import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  FolderGit2, 
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Database
} from 'lucide-react';
import KPICard from '../components/KPICard';
import MapView from '../components/MapView';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { apiService } from '../services/api';

export default function Overview({ selectedZoneId, onZoneChange, zones }) {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [activeZoneData, setActiveZoneData] = useState(null);
  const [dataSources, setDataSources] = useState([]);

  useEffect(() => {
    async function loadData() {
      const data = await apiService.getWard(selectedZoneId);
      setActiveZoneData(data);
      const [priorityAlerts, sources] = await Promise.all([
        apiService.getPriorityAlerts(),
        apiService.getDataSources()
      ]);
      setAlerts(priorityAlerts);
      setDataSources(sources);
    }
    loadData();
  }, [selectedZoneId]);

  if (!activeZoneData) return <div className="p-8 text-center text-slate-500 font-semibold">Loading Urban Intelligence Overview...</div>;

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Urban Risk Overview</h2>
        <p className="text-xs text-slate-500 font-medium">Monitor current conditions, identify emerging risks and prioritize action.</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          title="Overall Risk" 
          value={(activeZoneData.overallRisk ?? activeZoneData.floodRisk) >= 70 ? "HIGH" : (activeZoneData.overallRisk ?? activeZoneData.floodRisk) >= 40 ? "MEDIUM" : "LOW"} 
          change={`Composite score: ${activeZoneData.overallRisk ?? activeZoneData.floodRisk}%`} 
          icon={ShieldAlert}
          type="risk"
        />
        <KPICard 
          title="Zones Requiring Attention" 
          value={zones.filter(zone => (zone.overallRisk ?? zone.floodRisk ?? 0) >= 70).length} 
          change={`of ${zones.length} loaded wards`} 
          icon={AlertTriangle} 
        />
        <KPICard 
          title="Risk Signals" 
          value={Object.keys(activeZoneData.hazardScores || activeZoneData.riskFactors || {}).length} 
          change="Factors monitored" 
          icon={FolderGit2} 
        />
        <KPICard 
          title="Data Sources Online" 
          value={dataSources.filter(source => ['Connected', 'connected', 'Local', 'local'].includes(source.status)).length} 
          change={`of ${dataSources.length} registered`} 
          icon={Database} 
        />
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Risk Data Coverage</h3>
        <div className="bg-white p-5 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3">
          {dataSources.map((source) => (
            <div key={source.id} className="flex items-center gap-3 p-3 border border-slate-100 rounded-lg">
              <Database className="w-4 h-4 text-blue-600 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-700 truncate">{source.name}</p>
                <p className="text-[10px] text-slate-400">{source.type}</p>
              </div>
              <span className={`ml-auto text-[9px] font-bold uppercase ${source.status === 'Connected' ? 'text-emerald-600' : 'text-amber-600'}`}>
                {source.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Map & Priority Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Map View */}
        <div className="lg:col-span-2 space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Spatial Risk Hotspots</h3>
            <span className="text-[10px] text-slate-400 font-semibold bg-slate-100 border border-slate-200 px-2 py-0.5 rounded uppercase">Chennai Grid</span>
          </div>
          <MapView 
            zones={zones} 
            selectedZoneId={selectedZoneId} 
            onZoneSelect={onZoneChange} 
          />
        </div>

        {/* Right Priority Alerts */}
        <div className="flex flex-col h-full space-y-2">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Priority Alerts</h3>
          <div className="bg-white p-5 border border-slate-200 rounded-xl flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div 
                  key={alert.id}
                  onClick={() => {
                    const matched = zones.find(z => z.name.includes(alert.zone.split(' ')[0]));
                    if (matched) onZoneChange(matched.id);
                  }}
                  className="flex items-center justify-between p-3 border border-slate-100 hover:border-blue-200 hover:bg-slate-50/50 rounded-lg cursor-pointer transition-all"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800">{alert.zone}</span>
                    <p className="text-[11px] text-slate-500 leading-none">{alert.risk}</p>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                    alert.priority === 'HIGH' 
                      ? 'bg-red-50 text-red-600 border border-red-100' 
                      : alert.priority === 'MEDIUM' 
                      ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                      : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                  }`}>
                    {alert.priority}
                  </span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => navigate('/risk-map')}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
            >
              Open Large Risk Map
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Overall Risk Trend & AI Insight Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <div className="lg:col-span-2 space-y-2">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overall Risk Trend</h3>
          <div className="bg-white p-5 border border-slate-200 rounded-xl h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activeZoneData.riskProbabilities || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                <Line 
                  name="Risk Score" 
                  type="monotone" 
                  dataKey="risk" 
                  stroke="#2563eb" 
                  strokeWidth={2.5} 
                  dot={{ r: 4 }} 
                  activeDot={{ r: 6 }} 
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Priority Insight */}
        <div className="flex flex-col h-full space-y-2">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI priority insight</h3>
          <div className="bg-slate-900 border border-slate-800 text-white p-5 rounded-xl flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded w-fit text-[10px] font-bold">
                <Sparkles className="w-3 h-3" />
                <span>MUNICIPAL INTELLIGENCE</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100">{selectedZoneId} require attention</h4>
                <p className="text-xs text-slate-300 leading-relaxed font-medium mt-1">
                  {activeZoneData.aiInsight || activeZoneData.explanation || 'Review the current composite score and individual hazard components before choosing an intervention.'}
                </p>
              </div>
            </div>

            <button 
              onClick={() => navigate('/risk-prediction')}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
            >
              Analyze Risk
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
