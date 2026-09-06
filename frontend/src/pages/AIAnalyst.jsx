import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Send, Sparkles, AlertCircle, FileText, CheckCircle } from 'lucide-react';

export default function AIAnalyst({ selectedZoneId, zones }) {
  const [activeZone, setActiveZone] = useState(null);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState("");

  useEffect(() => {
    async function loadData() {
      const data = await apiService.getWard(selectedZoneId);
      setActiveZone(data);
      setResponse(null);
      setSelectedQuestion("");
    }
    loadData();
  }, [selectedZoneId]);

  const suggestedQuestions = [
    `Which hazards are highest in ${selectedZoneId}?`,
    `What should we prioritize in ${selectedZoneId}?`,
    `Which intervention has the highest expected impact?`,
    `How should we respond to air quality and seismic exposure?`,
    `What factors are driving the risk?`
  ];

  const handleQuestionClick = (question) => {
    setSelectedQuestion(question);
    setLoading(true);
    setResponse(null);

    // Simulate analytical loading
    setTimeout(() => {
      let aiExplanation = "";
      let evidence = [];
      let actions = [];

      if (question.includes("hazards are highest")) {
        const hazards = Object.entries(activeZone?.hazardScores || {}).sort(([, left], [, right]) => right - left).slice(0, 3);
        aiExplanation = `${selectedZoneId} has a composite risk score of ${activeZone?.overallRisk}%. The leading current hazard dimensions are ${hazards.map(([name, value]) => `${name.replace('_', ' ')} (${value})`).join(', ')}.`;
        evidence = hazards.map(([name, value]) => `${name.replace('_', ' ')} score: ${value}`);
        actions = ["Prioritize the highest-scoring hazard in the next intervention cycle.", "Review cross-hazard dependencies before committing resources.", "Capture measured outcomes to improve future risk estimates."];
      } else if (question.includes("prioritize")) {
        aiExplanation = `The priority should be driven by the lowest-performing sustainability dimension and the highest hazard score in ${selectedZoneId}. The current composite risk is ${activeZone?.overallRisk}% and sustainability is ${activeZone?.sustainabilityScore}/100.`;
        evidence = [
          `Infrastructure Index Score: ${activeZone?.dimensions?.infrastructure}/100`,
          `Environmental Quality: ${activeZone?.dimensions?.environmentalQuality}/100`,
          `Hazard components tracked: ${Object.keys(activeZone?.hazardScores || {}).length}`
        ];
        actions = [
          "Compare interventions against budget, workforce, and duration constraints.",
          "Assign an accountable owner and target measurement date.",
          "Record the measured result in Outcome Tracking."
        ];
      } else if (question.includes("highest expected impact")) {
        aiExplanation = `Combined Drain Cleaning + Targeted Pumping (Plan C) delivers the absolute highest expected flood risk reduction (-41%) and sustainability benefit (+8 points). If funds are constrained, Option B (Temporary Pumping) offers the best cost-to-risk efficiency with a -27% risk reduction for ₹3.0L.`;
        evidence = [
          "Option A: Cost ₹2.0L | Impact -18% Risk",
          "Option B: Cost ₹3.0L | Impact -27% Risk",
          "Option C: Cost ₹5.0L | Impact -41% Risk"
        ];
        actions = [
          "Deploy Plan C immediately if budget of ₹5.0L is cleared.",
          "Otherwise, authorize Option B to secure quick relief under constrained conditions."
        ];
      } else if (question.includes("air quality")) {
        aiExplanation = `Air quality and earthquake exposure should be reviewed alongside flood conditions. ${selectedZoneId} currently has air quality status ${activeZone?.riskFactors?.airQuality} and earthquake exposure ${activeZone?.riskFactors?.earthquake}.`;
        evidence = [`Air quality: ${activeZone?.riskFactors?.airQuality}`, `Earthquake exposure: ${activeZone?.riskFactors?.earthquake}`, `Composite risk: ${activeZone?.overallRisk}%`];
        actions = ["Validate sensor coverage and freshness for air-quality readings.", "Review seismic preparedness and critical infrastructure exposure.", "Avoid treating a flood-only intervention as a complete risk response."];
      } else {
        // default factors
        aiExplanation = `Risk in ${selectedZoneId} is composed of seven hazard dimensions. The composite score is ${activeZone?.overallRisk}% and should be interpreted alongside the individual hazard components rather than as a flood-only result.`;
        evidence = [
          ...Object.entries(activeZone?.hazardScores || {}).map(([name, value]) => `${name.replace('_', ' ')}: ${value}`)
        ];
        actions = [
          "Inspect the highest-scoring hazard indicators.",
          "Choose an intervention that addresses the dominant hazard mix."
        ];
      }

      setResponse({
        explanation: aiExplanation,
        evidence: evidence,
        recommendedActions: actions
      });
      setLoading(false);
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">AI Urban Analyst</h2>
        <p className="text-xs text-slate-500 font-medium">Contextual decision-intelligence assistant grounded in spatial metrics.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Suggested Questions */}
        <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-xs space-y-4 h-fit">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ask about {selectedZoneId}</h3>
          
          <div className="space-y-2">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleQuestionClick(q)}
                className={`
                  w-full text-left text-xs font-semibold p-3 border rounded-lg transition-all
                  ${selectedQuestion === q 
                    ? 'border-blue-500 bg-blue-50/20 text-blue-700' 
                    : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 text-slate-600'
                  }
                `}
              >
                {q}
              </button>
            ))}
          </div>

          <div className="relative pt-2 border-t border-slate-100 flex items-center">
            <input 
              type="text" 
              placeholder="Query custom parameters..." 
              disabled
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md py-2 pl-3 pr-10 text-slate-400 focus:outline-none cursor-not-allowed"
            />
            <button disabled className="absolute right-2 text-slate-300 cursor-not-allowed">
              <Send className="w-4 h-4" />
            </button>
          </div>
          <span className="text-[9px] text-slate-400 font-medium block text-center leading-none">Custom query input planned for future integrations.</span>
        </div>

        {/* Right Side: Analytical Output Drawer */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Analytical Assistant Response</h3>

          {loading && (
            <div className="bg-slate-900 text-white p-8 rounded-xl text-center font-bold animate-pulse">
              Parsing municipal telemetry and computing factors...
            </div>
          )}

          {response && !loading && (
            <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs space-y-5 animate-fade-in">
              {/* Header */}
              <div className="flex items-center gap-2 text-blue-600 border-b border-slate-100 pb-3">
                <Sparkles className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">AI Priority Explanation</span>
              </div>

              {/* Explanation Text */}
              <div className="space-y-1.5">
                <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                  {response.explanation}
                </p>
              </div>

              {/* Evidence Badges */}
              <div className="space-y-2 bg-slate-50 p-4 border border-slate-100 rounded-lg">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  Grounded Evidence Indicators
                </span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {response.evidence.map((item, idx) => (
                    <span key={idx} className="bg-white border border-slate-200 text-slate-600 px-2.5 py-1 rounded text-[10px] font-bold uppercase">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions Checklist */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Recommended Action Path
                </span>
                <ul className="space-y-1.5 text-xs text-slate-600 font-semibold list-disc list-inside">
                  {response.recommendedActions.map((action, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {!response && !loading && (
            <div className="bg-white border border-slate-200 p-8 rounded-xl shadow-xs text-center text-slate-400 flex flex-col items-center justify-center h-64">
              <Sparkles className="w-8 h-8 mb-2 text-slate-300" />
              <p className="text-xs font-bold">Select a suggested analytical question to generate contextual insights.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
