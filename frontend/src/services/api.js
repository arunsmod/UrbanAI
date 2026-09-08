const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function wardNumber(id) {
  const match = String(id).match(/\d+/);
  return match ? Number(match[0]) : id;
}

function normalizeWard(ward) {
  const coordinates = ward.coordinates || [];
  const polygon = ward.polygon || (coordinates.length === 2 ? [
    [coordinates[0] + 0.004, coordinates[1] - 0.004],
    [coordinates[0] + 0.004, coordinates[1] + 0.004],
    [coordinates[0] - 0.004, coordinates[1] + 0.004],
    [coordinates[0] - 0.004, coordinates[1] - 0.004],
  ] : []);
  return {
    ...ward,
    id: ward.id ?? `Ward ${ward.ward_id}`,
    name: ward.name ?? `Ward ${ward.ward_id}`,
    floodRisk: ward.floodRisk ?? ward.risk,
    overallRisk: ward.overallRisk ?? ward.risk,
    hazardScores: ward.hazardScores ?? {},
    dimensions: ward.dimensions ?? {},
    riskFactors: ward.riskFactors ?? {},
    interventions: Array.isArray(ward.interventions) ? ward.interventions : [],
    coordinates,
    polygon,
  };
}

async function request(endpoint, options = {}) {
  const { timeoutMs = 10000, ...fetchOptions } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('urbanai-token')
          ? { Authorization: `Bearer ${localStorage.getItem('urbanai-token')}` }
          : {}),
        ...options.headers,
      },
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.detail || `Request failed with status ${response.status}`);
    }
    return data;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const apiService = {
  async checkHealth() {
    return request('/');
  },

  async login(email, password) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async getWards() {
    const data = await request('/wards', { timeoutMs: 90000 });
    return (data.wards || []).map(normalizeWard);
  },

  async getWard(id) {
    return normalizeWard(await request(`/wards/${wardNumber(id)}`));
  },

  async predictRisk(id, inputs) {
    return request(`/wards/${wardNumber(id)}/predict`, {
      method: 'POST',
      body: JSON.stringify(inputs),
    });
  },

  async askAssistant(id, question) {
    return request('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ ward_id: wardNumber(id), question }),
    });
  },

  async simulateIntervention(id, interventionType) {
    const [data, ward] = await Promise.all([
      request('/simulate', {
      method: 'POST',
      body: JSON.stringify({
        ward_id: wardNumber(id),
        interventions: Array.isArray(interventionType) ? interventionType : [interventionType],
      }),
      }),
      apiService.getWard(id),
    ]);
    return {
      ...data,
      before: { risk: Number(data.original_risk), sustainability: Number(ward.sustainabilityScore || 0) },
      after: { risk: Number(data.new_risk), sustainability: Number(ward.sustainabilityScore || 0) },
      explanation: data.explanation || `Estimated risk reduction: ${data.reduction}.`,
    };
  },

  async optimizeResources(id, constraints) {
    const data = await request('/optimize', {
      method: 'POST',
      body: JSON.stringify({
        ward_id: wardNumber(id),
        budget: constraints.budget,
        workers: constraints.workers,
        timeframe: constraints.timeframe,
      }),
    });
    const feasiblePlans = (data.selected_interventions || []).map((item, index) => ({
      id: item.intervention || `plan-${index}`,
      name: item.intervention,
      cost: item.cost,
      workers: item.workers,
      duration: item.duration,
      riskReduction: item.risk_reduction,
      scoreImprovement: item.score_improvement ?? 0,
    }));
    return {
      ...data,
      feasiblePlans,
      recommendedPlan: feasiblePlans[0] || null,
      reasoning: data.reasoning || (feasiblePlans.length ? 'Selected by the backend optimizer.' : 'No intervention fits the current constraints.'),
    };
  },

  async getPriorityAlerts() {
    const data = await request('/alerts');
    return data.alerts || [];
  },

  async getDataSources() {
    const data = await request('/data-sources');
    return data.sources || [];
  },

  async getInterventions() {
    const data = await request('/interventions');
    const catalogue = Object.entries(data.interventions || {}).map(([id, item]) => ({
      id,
      name: item.description || id,
      zone: 'Local ward catalogue',
      status: item.active ? 'Available' : 'Inactive',
      budget: `₹${(item.cost / 100000).toFixed(1)}L`,
      expectedImpact: `${item.workers} workers / ${item.duration} days`,
      actualImpact: 'Not measured',
    }));
    const active = (data.active || []).map((item) => {
      const definition = data.interventions?.[item.intervention] || {};
      return {
        id: `simulation-${item.id}`,
        name: definition.description || item.intervention,
        zone: `Ward ${item.ward_id}`,
        status: {
          planned: 'Planned',
          approved: 'Approved',
          in_progress: 'In Progress',
          completed: 'Completed',
          cancelled: 'Cancelled',
        }[item.status] || item.status,
        budget: definition.cost ? `₹${(definition.cost / 100000).toFixed(1)}L` : 'Not specified',
        expectedImpact: definition.workers ? `${definition.workers} workers / ${definition.duration} days` : 'Not specified',
        actualImpact: 'Not measured',
      };
    });
    return [...active, ...catalogue];
  },

  async getOutcomeLogs() {
    const data = await request('/outcomes');
    return (data.outcomes || []).map((item) => ({
      id: item.id,
      ...item,
      wardId: `Ward ${item.ward_id}`,
      intervention: item.interventions,
      beforeRisk: item.predicted_risk_before ?? item.predicted_risk,
      predictedRisk: item.predicted_risk_after ?? item.predicted_risk,
      actualRisk: item.actual_risk_after ?? item.actual_risk,
      predictedImprovement: item.predicted_improvement_pct ?? 0,
      actualImprovement: item.actual_improvement_pct ?? 0,
      accuracy: item.outcome_gap_pct == null && item.difference == null ? null : Math.max(0, 100 - Math.abs(item.outcome_gap_pct ?? item.difference)),
      feedback: item.notes || 'No notes recorded.',
    }));
  },

  async recordOutcome(outcome) {
    return request('/outcomes', {
      method: 'POST',
      body: JSON.stringify({
        ward_id: wardNumber(outcome.wardId),
        predicted_risk: outcome.predictedRisk,
        actual_risk: outcome.actualRisk,
        interventions: outcome.interventions,
      }),
    });
  },

  async commitIntervention(id, intervention) {
    return request('/interventions', {
      method: 'POST',
      body: JSON.stringify({ ward_id: wardNumber(id), intervention }),
    });
  },

  async updateInterventionStatus(simulationId, status) {
    return request(`/interventions/${simulationId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, actor: 'local-admin' }),
    });
  },
};
