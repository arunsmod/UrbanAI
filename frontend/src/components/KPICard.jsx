import React from 'react';

export default function KPICard({ title, value, change, icon: Icon, type }) {
  const getRiskColor = (val) => {
    if (val === 'HIGH' || (typeof val === 'number' && val >= 70)) return 'text-red-600 bg-red-50 border-red-100';
    if (val === 'MEDIUM' || (typeof val === 'number' && val >= 40)) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-emerald-600 bg-emerald-50 border-emerald-100';
  };

  const getKPIColors = () => {
    if (type === 'risk') return getRiskColor(value);
    return 'text-slate-800 bg-slate-50 border-slate-200';
  };

  return (
    <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-between">
      <div className="space-y-1">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
          {title}
        </span>
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-bold tracking-tight ${type === 'risk' ? getRiskColor(value).split(' ')[0] : 'text-slate-800'}`}>
            {value}
          </span>
          {change && (
            <span className="text-[10px] font-semibold text-slate-400">
              {change}
            </span>
          )}
        </div>
      </div>
      
      <div className={`p-3 rounded-lg border ${getKPIColors()}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}
