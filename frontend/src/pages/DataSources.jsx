import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Database, Link2, Info, Wifi, WifiOff } from 'lucide-react';

export default function DataSources() {
  const [sources, setSources] = useState([]);

  useEffect(() => {
    async function loadData() {
      const data = await apiService.getDataSources();
      setSources(data);
    }
    loadData();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Connected':
      case 'connected':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'planned':
        return 'bg-slate-50 text-slate-400 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Data Sources</h2>
        <p className="text-xs text-slate-500 font-medium">Monitor active municipal telemetry feeds and scheduled ingestion pipelines.</p>
      </div>

      {/* Grid of Data Source Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sources.map((src) => (
          <div key={src.id} className="bg-white p-5 border border-slate-200 rounded-xl shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="p-2 bg-slate-100 rounded-lg text-slate-500">
                  <Database className="w-4 h-4" />
                </span>
                <span className={`px-2 py-0.5 border text-[10px] font-bold rounded-full ${getStatusBadge(src.status)}`}>
                  {src.status}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-800">{src.name}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{src.type}</p>
              </div>
            </div>

            <div className="border-t border-slate-50 pt-3 flex justify-between items-center text-xs">
              <span className="text-slate-500 font-semibold flex items-center gap-1">
                <Link2 className="w-3.5 h-3.5 text-slate-400" />
                Ingestion Source
              </span>
              <span className="text-slate-700 font-bold max-w-[150px] truncate">{src.dataset}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Future Integration Section */}
      <div className="bg-slate-950 border border-slate-800 text-white p-6 rounded-xl space-y-4">
        <div>
          <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-400" />
            Future Integration Plan
          </h3>
          <p className="text-xs text-slate-400 font-medium mt-0.5">URBANAi will scale to ingest official municipality assets and live ICCC nodes.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 text-xs">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg space-y-1">
            <span className="font-bold text-slate-200">Municipal APIs</span>
            <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">Integrate directly with Chennai GCC storm-water asset databases.</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg space-y-1">
            <span className="font-bold text-slate-200">ICCC Feeds</span>
            <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">Real-time command center streams for rainfall gauge metrics.</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg space-y-1">
            <span className="font-bold text-slate-200">IoT Sensor Networks</span>
            <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">Automatic reading from ultrasonic water-level grids.</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg space-y-1">
            <span className="font-bold text-slate-200">Open Government Datasets</span>
            <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">Ingestion of census maps for traffic flow and population densities.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
