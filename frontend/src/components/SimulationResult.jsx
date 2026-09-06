import React from 'react';
import { ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SimulationResult({ result, interventionName, onReset, onCommit }) {
  const navigate = useNavigate();
  if (!result) return null;

  const { before, after, explanation } = result;

  const riskDiff = (after.risk - before.risk).toFixed(2);
  const scoreDiff = (after.sustainability - before.sustainability).toFixed(2);

  return (
    <div className="bg-slate-900 border border-slate-800 text-white p-6 rounded-xl shadow-lg space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block">Simulation Result</span>
          <h4 className="font-bold text-base text-slate-100">{interventionName}</h4>
        </div>
        <div className="flex items-center gap-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 px-2 py-0.5 rounded text-[10px] font-semibold">
          <Sparkles className="w-3 h-3" />
          <span>Estimated Projection</span>
        </div>
      </div>

      {/* Comparisons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Risk Column */}
        <div className="bg-slate-950/40 p-4 border border-slate-800 rounded-lg flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Composite Risk</span>
            <div className="flex items-center gap-3">
              <span className="text-xl font-semibold text-slate-400 line-through">{before.risk}%</span>
              <ArrowRight className="w-4 h-4 text-slate-500" />
              <span className="text-2xl font-bold text-red-400">{after.risk}%</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Difference</span>
            <span className="text-lg font-bold text-emerald-400">{riskDiff} pp</span>
          </div>
        </div>

        {/* Sustainability Score Column */}
        <div className="bg-slate-950/40 p-4 border border-slate-800 rounded-lg flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Sustainability</span>
            <div className="flex items-center gap-3">
              <span className="text-xl font-semibold text-slate-400 line-through">{before.sustainability}</span>
              <ArrowRight className="w-4 h-4 text-slate-500" />
              <span className="text-2xl font-bold text-emerald-400">{after.sustainability}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Difference</span>
                <span className="text-lg font-bold text-emerald-400">+{scoreDiff} pts</span>
          </div>
        </div>
      </div>

      {/* Explanation text */}
      <div className="bg-slate-950/60 p-4 border border-slate-800/60 rounded-lg space-y-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Simulation Explanation</span>
        <p className="text-xs text-slate-300 leading-relaxed font-medium">
          {explanation}
        </p>
      </div>

      {/* Honesty alert */}
      <div className="flex items-start gap-2 text-[10px] text-slate-500 leading-relaxed bg-slate-950/20 p-2 rounded">
        <AlertCircle className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
        <span>This is a forecasted estimation generated using statistical weighting parameters. Real outcomes will vary based on weather severity and deployment precision.</span>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          onClick={onReset}
          className="py-2 px-4 border border-slate-700 hover:border-slate-500 hover:text-white rounded-lg text-xs font-bold text-slate-400 transition-colors"
        >
          Clear Simulation
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/resource-optimizer')}
            className="py-2 px-3 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg text-xs font-bold text-slate-300 transition-colors"
          >
            Compare Scenarios
          </button>
          <button
            onClick={() => {
              onCommit?.();
            }}
            className="py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-md hover:shadow-blue-500/10"
          >
            Submit This Plan
          </button>
        </div>
      </div>
    </div>
  );
}
