import React from 'react';
import { DollarSign, Users, Clock, Zap } from 'lucide-react';

export default function InterventionCard({ intervention, onSimulate, isSelected }) {
  const { name, cost, expectedRiskReduction, workers, duration, description } = intervention;

  const formatCost = (val) => {
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(1)} L`;
    }
    return `₹${val.toLocaleString()}`;
  };

  return (
    <div className={`
      bg-white p-5 border rounded-xl shadow-xs transition-all duration-200 flex flex-col justify-between space-y-4
      ${isSelected 
        ? 'border-blue-500 ring-1 ring-blue-500/50 bg-blue-50/10' 
        : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
      }
    `}>
      {/* Title */}
      <div className="space-y-1">
        <h4 className="font-bold text-slate-800 text-sm">{name}</h4>
        {description && (
          <p className="text-xs text-slate-400 font-medium leading-relaxed">{description}</p>
        )}
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
          <DollarSign className="w-4 h-4 text-slate-400" />
          <div>
            <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Cost</span>
            <span className="font-bold text-slate-700">{formatCost(cost)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
          <Zap className="w-4 h-4 text-blue-500" />
          <div>
            <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Est. Impact</span>
            <span className="font-bold text-blue-600">-{expectedRiskReduction}% Risk</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
          <Users className="w-4 h-4 text-slate-400" />
          <div>
            <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Labor</span>
            <span className="font-bold text-slate-700">{workers} Workers</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
          <Clock className="w-4 h-4 text-slate-400" />
          <div>
            <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Duration</span>
            <span className="font-bold text-slate-700">{duration} Days</span>
          </div>
        </div>
      </div>

      {/* Action */}
      <button
        onClick={() => onSimulate(intervention)}
        className={`
          w-full py-2 px-3 rounded-lg text-xs font-bold transition-colors
          ${isSelected 
            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }
        `}
      >
        {isSelected ? 'Active Simulation' : 'Simulate Intervention'}
      </button>
    </div>
  );
}
