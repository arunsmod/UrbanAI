import React, { useState, useEffect } from 'react';
import MapView from '../components/MapView';
import ZonePanel from '../components/ZonePanel';
import { apiService } from '../services/api';
import { Filter, Clock, AlertTriangle } from 'lucide-react';

export default function RiskMap({ selectedZoneId, onZoneChange, zones }) {
  const [activeZone, setActiveZone] = useState(null);
  const [riskType, setRiskType] = useState('All');
  const [timeHorizon, setTimeHorizon] = useState('Current');
  const [riskFilter, setRiskFilter] = useState('All');

  useEffect(() => {
    async function loadActiveZone() {
      if (selectedZoneId) {
        const data = await apiService.getWard(selectedZoneId);
        setActiveZone(data);
      }
    }
    loadActiveZone();
  }, [selectedZoneId]);

  const handleZoneSelectFromMap = (id) => {
    onZoneChange(id);
  };

  const getFilteredZones = () => {
    return zones;
  };

  const mapZones = getFilteredZones();

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Urban Risk Map</h2>
        <p className="text-xs text-slate-500 font-medium">Identify spatial risk hotspots across Chennai grid wards.</p>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Risk Type Selector */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            Risk Type
          </label>
          <select
            value={riskType}
            onChange={(e) => setRiskType(e.target.value)}
            className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-md py-1.5 px-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="All">All Risks Combined</option>
            <option value="flood">Flooding / Waterlogging</option>
            <option value="air_quality">Air Quality</option>
            <option value="earthquake">Earthquake Exposure</option>
            <option value="windstorm">Windstorm Exposure</option>
            <option value="wildfire">Wildfire Exposure</option>
            <option value="landslide">Landslide Exposure</option>
            <option value="industrial">Industrial Exposure</option>
          </select>
        </div>

        {/* Time Horizon Selector */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Time Forecast Horizon
          </label>
          <select
            value={timeHorizon}
            onChange={(e) => setTimeHorizon(e.target.value)}
            className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-md py-1.5 px-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="Current">Current Conditions</option>
          </select>
        </div>

        {/* Risk Level Filter */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Filter Risk Severity
          </label>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-md py-1.5 px-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="All">All Risk Levels</option>
            <option value="HIGH">High Severity Only (&ge;70%)</option>
            <option value="MEDIUM">Medium Severity Only (40%-69%)</option>
            <option value="LOW">Low Severity Only (&lt;40%)</option>
          </select>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Map */}
        <div className="lg:col-span-2">
          <MapView 
            zones={mapZones} 
            selectedZoneId={selectedZoneId} 
            onZoneSelect={handleZoneSelectFromMap}
            activeFilters={{
              riskLevel: riskFilter !== 'All' ? riskFilter : null,
              riskType,
            }}
          />
        </div>

        {/* Right Column: Detail Panel */}
        <div>
          <ZonePanel zone={activeZone} />
        </div>
      </div>
    </div>
  );
}
