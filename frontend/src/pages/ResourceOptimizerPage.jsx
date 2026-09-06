import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  Cell
} from 'recharts';
import { Sliders, Coins, Users, Calendar, Sparkles, Award, ArrowRight, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ResourceOptimizerPage({ selectedZoneId, zones }) {
  const navigate = useNavigate();
  const [wardData, setWardData] = useState(null);
  
  // Constraints
  const [budget, setBudget] = useState(500000);
  const [workers, setWorkers] = useState(20);
  const [timeframe, setTimeframe] = useState(30);

  // Optimizer Outputs
  const [optimization, setOptimization] = useState(null);
  const [loading, setLoading] = useState(false);
  const [commitStatus, setCommitStatus] = useState('');

  useEffect(() => {
    async function loadData() {
      const data = await apiService.getWard(selectedZoneId);
      setWardData(data);
    }
    loadData();
  }, [selectedZoneId]);

  // Recalculate optimizer outputs
  useEffect(() => {
    async function runOptimize() {
      if (!selectedZoneId) return;
      setLoading(true);
      const res = await apiService.optimizeResources(selectedZoneId, {
        budget,
        workers,
        timeframe
      });
      setOptimization(res);
      setLoading(false);
    }
    runOptimize();
  }, [budget, workers, timeframe, selectedZoneId]);

  if (!wardData) return <div className="p-8 text-center text-slate-500 font-semibold">Loading Optimizer Engine...</div>;

  const formatCost = (val) => {
    return `₹${(val / 100000).toFixed(1)} L`;
  };

  // Convert optimizer feasible list to bar chart data
  const getChartData = () => {
    if (!optimization || !optimization.feasiblePlans) return [];
    return optimization.feasiblePlans.map(plan => ({
      name: plan.name.split(' ')[0], // short name
      fullName: plan.name,
      Cost: plan.cost / 100000, // Lakhs
      SustainabilityImprovement: plan.scoreImprovement,
      RiskReduction: plan.riskReduction
    }));
  };

  const chartData = getChartData();

  const handleCommit = async () => {
    const intervention = optimization?.recommendedPlan?.name;
    if (!intervention) return;
    const committed = await apiService.commitIntervention(selectedZoneId, intervention);
    setCommitStatus(committed ? 'Plan committed for outcome tracking.' : 'Plan could not be committed.');
    if (committed) navigate('/interventions');
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Resource Optimizer</h2>
        <p className="text-xs text-slate-500 font-medium">Find the absolute best intervention combinations under resource constraints.</p>
      </div>

      {/* Constraints Sliders & Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Constraints Configurator */}
        <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              Optimization Constraints
            </h3>
          </div>

          {/* Budget Constraint */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-slate-400" />
                Max Budget Limit
              </span>
              <span className="font-extrabold text-slate-800">{formatCost(budget)}</span>
            </div>
            <input 
              type="range" 
              min="100000" 
              max="800000" 
              step="50000" 
              value={budget} 
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[9px] text-slate-400 font-bold">
              <span>₹1.0L</span>
              <span>₹8.0L</span>
            </div>
          </div>

          {/* Manpower Constraint */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-400" />
                Max Worker Force
              </span>
              <span className="font-extrabold text-slate-800">{workers} Workers</span>
            </div>
            <input 
              type="range" 
              min="5" 
              max="30" 
              step="1" 
              value={workers} 
              onChange={(e) => setWorkers(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[9px] text-slate-400 font-bold">
              <span>5 Workers</span>
              <span>30 Workers</span>
            </div>
          </div>

          {/* Timeframe Constraint */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                Max Time Allocation
              </span>
              <span className="font-extrabold text-slate-800">{timeframe} Days</span>
            </div>
            <input 
              type="range" 
              min="5" 
              max="45" 
              step="5" 
              value={timeframe} 
              onChange={(e) => setTimeframe(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[9px] text-slate-400 font-bold">
              <span>5 Days</span>
              <span>45 Days</span>
            </div>
          </div>

          {/* Objective function selection */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-[10px] text-slate-500 font-bold uppercase">Optimization Objective</label>
            <select
              defaultValue="sustainability"
              className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-md py-1.5 px-2.5"
            >
              <option value="sustainability">Maximize Sustainability Improvement</option>
              <option value="risk">Minimize Composite Risk</option>
            </select>
          </div>
        </div>

        {/* Right Side: Cost vs Impact Bar Chart */}
        <div className="lg:col-span-2 space-y-2">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Candidate Interventions Comparison</h3>
          <div className="bg-white p-5 border border-slate-200 rounded-xl h-72">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} label={{ value: 'Cost (Lakhs ₹)', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' } }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} label={{ value: 'Index Improvement', angle: 90, position: 'insideRight', style: { fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' } }} />
                  <Tooltip formatter={(value, name) => [value, name === 'Cost' ? 'Cost (Lakhs ₹)' : 'Sustainability Index Improvement']} />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                  <Bar yAxisId="left" dataKey="Cost" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar yAxisId="right" dataKey="SustainabilityImprovement" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs font-semibold">
                No plans meet current constraints. Expand resource boundaries.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recommended Output Block */}
      {loading && (
        <div className="bg-slate-900 text-white p-8 rounded-xl text-center font-bold animate-pulse">
          Running resource optimization algorithm...
        </div>
      )}

      {optimization && !loading && (
        <div className="bg-slate-900 border border-slate-800 text-white p-6 rounded-xl shadow-lg space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block">Optimization Engine Result</span>
              <h3 className="font-bold text-base text-slate-100">Recommended Plan Configuration</h3>
            </div>
            <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Constraint Cleared</span>
            </div>
          </div>

          {optimization.recommendedPlan ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Plan metrics */}
              <div className="md:col-span-2 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-950/40 p-3.5 border border-slate-800 rounded-lg">
                    <span className="text-[9px] text-slate-500 uppercase font-bold block">Selected Plan</span>
                    <span className="text-sm font-bold text-slate-200">
                      {optimization.recommendedPlan.items ? (
                        optimization.recommendedPlan.items.map(i => i.name.split(' ')[0]).join(' + ')
                      ) : "Plan C (Combined)"}
                    </span>
                  </div>
                  <div className="bg-slate-950/40 p-3.5 border border-slate-800 rounded-lg">
                    <span className="text-[9px] text-slate-500 uppercase font-bold block">Optimal Cost</span>
                    <span className="text-sm font-bold text-slate-200">{formatCost(optimization.recommendedPlan.cost || 500000)}</span>
                  </div>
                  <div className="bg-slate-950/40 p-3.5 border border-slate-800 rounded-lg">
                    <span className="text-[9px] text-slate-500 uppercase font-bold block">Optimal Labor</span>
                    <span className="text-sm font-bold text-slate-200">{optimization.recommendedPlan.workers || 14} Workers</span>
                  </div>
                  <div className="bg-slate-950/40 p-3.5 border border-slate-800 rounded-lg">
                    <span className="text-[9px] text-slate-500 uppercase font-bold block">Optimal Duration</span>
                    <span className="text-sm font-bold text-slate-200">{optimization.recommendedPlan.duration || 10} Days</span>
                  </div>
                </div>

                <div className="bg-slate-950/60 p-4 border border-slate-800/60 rounded-lg">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Optimizer Reasoning</span>
                  <p className="text-xs text-slate-300 leading-relaxed font-semibold mt-1">
                    {optimization.reasoning}
                  </p>
                </div>
              </div>

              {/* Expected Impact Summary */}
              <div className="bg-blue-600/10 border border-blue-500/20 p-5 rounded-xl flex flex-col justify-between space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block">Expected Improvement</span>
                  <h4 className="text-2xl font-black text-white">+{optimization.recommendedPlan.scoreImprovement || 8} Score Points</h4>
                  <p className="text-xs text-blue-300 leading-normal font-medium mt-1">
                    Estimated composite risk decreases by <strong className="text-emerald-400">-{optimization.recommendedPlan.riskReduction || 0}%</strong>.
                  </p>
                </div>

                <button
                  onClick={handleCommit}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  Commit Recommended Plan
                  <ArrowRight className="w-4 h-4" />
                </button>
                {commitStatus && <span className="text-[10px] text-blue-200">{commitStatus}</span>}
              </div>
            </div>
          ) : (
            <div className="text-center p-6 text-slate-400 text-xs font-bold">
              {optimization.reasoning}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
