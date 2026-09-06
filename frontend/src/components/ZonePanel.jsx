import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sliders, TrendingUp, HelpCircle } from 'lucide-react';

export default function ZonePanel({ zone }) {
  const navigate = useNavigate();

  if (!zone) {
    return (
      <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-xs h-full flex flex-col items-center justify-center text-center text-slate-400">
        <HelpCircle className="w-10 h-10 mb-2 text-slate-300" />
        <p className="text-sm font-semibold">Select a zone on the map to inspect detail attributes.</p>
      </div>
    );
  }

  const getRiskBadgeColor = (risk) => {
    if (risk >= 70) return 'text-red-700 bg-red-50 border-red-200';
    if (risk >= 40) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  };

  const hazardLabels = {
    flood: 'Flood / Waterlogging',
    air_quality: 'Air Quality',
    earthquake: 'Earthquake',
    windstorm: 'Windstorm',
    wildfire: 'Wildfire',
    landslide: 'Landslide',
    industrial: 'Industrial',
  };

  return (
    <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-xs flex flex-col h-full space-y-5">
      {/* Title */}
      <div>
        <h3 className="text-lg font-bold text-slate-800">{zone.name}</h3>
        <p className="text-xs text-slate-400 font-medium">Chennai District Ward Zone</p>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50 p-3.5 border border-slate-100 rounded-lg text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sustainability</span>
          <span className="text-xl font-bold text-slate-700">{zone.sustainabilityScore} <span className="text-xs text-slate-400 font-normal">/ 100</span></span>
        </div>
        <div className={`p-3.5 border rounded-lg text-center ${getRiskBadgeColor(zone.overallRisk ?? zone.floodRisk)}`}>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Overall Risk</span>
          <span className="text-xl font-bold">{zone.overallRisk ?? zone.floodRisk}%</span>
        </div>
      </div>

      {/* Multi-hazard profile */}
      <div className="space-y-2 flex-1">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Multi-Hazard Profile</h4>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(zone.hazardScores || {}).map(([key, value]) => (
            <div key={key} className={`p-2 rounded-lg border ${getRiskBadgeColor(value)}`}>
              <span className="block text-[9px] font-bold uppercase tracking-wide">{hazardLabels[key] || key}</span>
              <span className="text-sm font-extrabold">{value}%</span>
            </div>
          ))}
        </div>
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider pt-2">Indicator Details</h4>
        <div className="space-y-1.5">
          {Object.entries(zone.riskFactors || {}).map(([key, value]) => {
            const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            const isHigh = value === 'HIGH' || value === 'LOW' && key === 'drainageCapacity';
            return (
              <div key={key} className="flex justify-between items-center text-xs py-1 border-b border-slate-50">
                <span className="text-slate-600 font-medium">{label}</span>
                <span className={`px-1.5 py-0.5 rounded-sm font-semibold text-[10px] ${
                  isHigh 
                    ? 'bg-red-50 text-red-600' 
                    : value === 'MEDIUM' 
                    ? 'bg-amber-50 text-amber-600' 
                    : 'bg-emerald-50 text-emerald-600'
                }`}>
                  {value}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Interpretation preview */}
      <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-lg text-xs text-blue-800 space-y-1">
        <span className="font-bold text-blue-900 flex items-center gap-1">AI Priority Insight</span>
        <p className="line-clamp-2 leading-relaxed text-[11px]">{zone.aiInsight || zone.explanation || 'Review the multi-hazard profile and current indicators for this ward.'}</p>
      </div>

      {/* Navigation shortcuts */}
      <div className="grid grid-cols-2 gap-2 pt-2">
        <button
          onClick={() => navigate('/risk-prediction')}
          className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors"
        >
          <TrendingUp className="w-3.5 h-3.5" />
          View Analysis
        </button>
        <button
          onClick={() => navigate('/decision-lab')}
          className="flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 rounded-lg text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          <Sliders className="w-3.5 h-3.5" />
          Run Simulation
        </button>
      </div>
    </div>
  );
}
