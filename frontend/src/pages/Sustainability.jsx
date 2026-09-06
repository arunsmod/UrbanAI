import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';
import { Leaf, Info, HelpCircle, Sparkles } from 'lucide-react';

export default function Sustainability({ selectedZoneId, zones }) {
  const [wardData, setWardData] = useState(null);

  useEffect(() => {
    async function loadData() {
      const data = await apiService.getWard(selectedZoneId);
      setWardData(data);
    }
    loadData();
  }, [selectedZoneId]);

  if (!wardData) return <div className="p-8 text-center text-slate-500 font-semibold">Loading Sustainability Index...</div>;

  const getProgressColor = (score) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getStatusBadge = (status) => {
    if (status === 'Excellent' || status === 'Good') return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (status === 'Fair') return 'bg-blue-50 text-blue-800 border-blue-200';
    if (status === 'Needs Improvement') return 'bg-amber-50 text-amber-800 border-amber-200';
    return 'bg-red-50 text-red-800 border-red-200';
  };

  // Convert dimensions keys to user friendly labels
  const dimensionLabels = {
    environmentalQuality: "Environmental Quality",
    infrastructure: "Infrastructure",
    mobility: "Mobility",
    publicServices: "Public Services",
    communityWellBeing: "Community Well-being"
  };

  // Static weighting explanation
  const weightsDescription = "Methodology: Environmental (25%), Infrastructure (25%), Mobility (20%), Services (15%), Community (15%).";

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sustainability Intelligence</h2>
        <p className="text-xs text-slate-500 font-medium">Evaluate the multidimensional index and track historical contributions.</p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Score & Progress dimensions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-xs space-y-5">
            {/* Top row */}
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Overall Assessment</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-slate-800">{wardData.sustainabilityScore}</span>
                  <span className="text-sm font-semibold text-slate-400">/ 100</span>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadge(wardData.status)}`}>
                {wardData.status}
              </span>
            </div>

            {/* Horizontal progress indicators */}
            <div className="space-y-4 pt-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Index Dimensions</h4>
              <div className="space-y-3.5">
                {Object.entries(wardData.dimensions || {}).map(([key, score]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-600">{dimensionLabels[key] || key}</span>
                      <span className="text-slate-800 font-bold">{score} <span className="text-[10px] text-slate-400">/ 100</span></span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${getProgressColor(score)}`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Note on methodology weights */}
            <div className="flex items-start gap-1.5 text-[10px] text-slate-400 border-t border-slate-100 pt-3">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>{weightsDescription} <strong className="font-semibold text-slate-500">Proposed MVP weights. Not official municipal weights.</strong></span>
            </div>
          </div>

          {/* Historical Trend Area Chart */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Score Trend</h3>
            <div className="bg-white p-5 border border-slate-200 rounded-xl h-60">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={wardData.sustainabilityTrend.filter(t => t.score !== null)}>
                  <defs>
                    <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#scoreColor)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Side: Contributors & AI explanations */}
        <div className="space-y-6">
          {/* Indicator Contribution card */}
          <div className="bg-white p-5 border border-slate-200 rounded-xl space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Indicator Contribution</h4>
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg space-y-1">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Positive Drivers</span>
                <p className="text-xs text-emerald-900 leading-relaxed font-semibold">
                  Environmental Quality is at {wardData.dimensions?.environmentalQuality}/100, bolstered by recent green belt planting projects.
                </p>
              </div>
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg space-y-1">
                <span className="text-[10px] font-bold text-red-800 uppercase tracking-wider block">Primary Bottlenecks</span>
                <p className="text-xs text-red-900 leading-relaxed font-semibold">
                  Infrastructure score remains depressed at {wardData.dimensions?.infrastructure}/100, heavily constrained by drainage and waterlogging vulnerabilities.
                </p>
              </div>
            </div>
          </div>

          {/* AI Interpretation */}
          <div className="bg-slate-900 border border-slate-800 text-white p-5 rounded-xl space-y-4">
            <div className="flex items-center gap-1.5 text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded w-fit text-[10px] font-bold">
              <Sparkles className="w-3 h-3" />
              <span>AI INTERPRETATION</span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100">Improvement Opportunities</h4>
              <p className="text-xs text-slate-300 leading-relaxed font-medium mt-1.5">
                Infrastructure is currently the largest improvement opportunity for {selectedZoneId}. Resolving secondary stormwater drain blockages will yield a high multiplier impact across multiple dimensions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
