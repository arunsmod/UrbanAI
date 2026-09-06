import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Sub-component to dynamically fly to active coordinates when selection changes
function MapRecenter({ coordinates }) {
  const map = useMap();
  useEffect(() => {
    if (coordinates) {
      map.setView(coordinates, 12, { animate: true, duration: 1.5 });
    }
  }, [coordinates, map]);
  return null;
}

function MapResizeHandler() {
  const map = useMap();
  useEffect(() => {
    const frame = requestAnimationFrame(() => map.invalidateSize());
    return () => cancelAnimationFrame(frame);
  }, [map]);
  return null;
}

export default function MapView({ zones, selectedZoneId, onZoneSelect, activeFilters }) {
  // Define map colors based on risk level
  const getRiskStyle = (risk, id) => {
    const isSelected = id === selectedZoneId;
    let color = '#10b981'; // low (emerald)
    if (risk >= 70) color = '#ef4444'; // high (red)
    else if (risk >= 40) color = '#f59e0b'; // medium (amber)

    return {
      color: isSelected ? '#2563eb' : color, // blue border if selected
      weight: isSelected ? 4 : 2,
      fillColor: color,
      fillOpacity: isSelected ? 0.45 : 0.25,
      dashArray: isSelected ? '0' : '3',
    };
  };

  const activeZone = zones.find(z => z.id === selectedZoneId);
  const center = activeZone ? activeZone.coordinates : [13.0475, 80.2289];

  // Filter zones by active risk filter if any
  const filteredZones = zones.filter(zone => {
    if (activeFilters?.riskLevel) {
      const risk = activeFilters?.riskType && activeFilters.riskType !== 'All'
        ? zone.hazardScores?.[activeFilters.riskType] ?? zone.overallRisk ?? zone.floodRisk
        : zone.overallRisk ?? zone.riskProbability ?? zone.floodRisk;
      if (activeFilters.riskLevel === 'HIGH' && risk < 70) return false;
      if (activeFilters.riskLevel === 'MEDIUM' && (risk < 40 || risk >= 70)) return false;
      if (activeFilters.riskLevel === 'LOW' && risk >= 40) return false;
    }
    return true;
  });

  return (
    <div className="relative w-full h-[500px] bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-xs">
      <MapContainer 
        center={center} 
        zoom={12} 
        scrollWheelZoom={true} 
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapResizeHandler />
        
        {filteredZones.map((zone) => {
          if (!zone.polygon) return null;
          const overallRisk = activeFilters?.riskType && activeFilters.riskType !== 'All'
            ? zone.hazardScores?.[activeFilters.riskType] ?? zone.overallRisk ?? zone.floodRisk
            : zone.overallRisk ?? zone.riskProbability ?? zone.floodRisk;
          return (
            <Polygon
              key={zone.id}
              positions={zone.polygon}
              eventHandlers={{
                click: () => {
                  onZoneSelect(zone.id);
                },
              }}
              pathOptions={getRiskStyle(overallRisk, zone.id)}
            >
              <Popup>
                <div className="p-1 space-y-1">
                  <h4 className="font-bold text-slate-800 text-sm">{zone.name}</h4>
                  <p className="text-xs text-slate-500">{activeFilters?.riskType && activeFilters.riskType !== 'All' ? `${activeFilters.riskType} risk` : 'Composite risk'}: <span className="font-semibold text-slate-700">{overallRisk}%</span></p>
                </div>
              </Popup>
            </Polygon>
          );
        })}

        <MapRecenter coordinates={center} />
      </MapContainer>

      {/* Floating map legend */}
      <div className="absolute bottom-4 left-4 z-50 bg-white/95 backdrop-blur-xs p-3 border border-slate-200 rounded-lg shadow-sm space-y-1.5 text-[11px] text-slate-600">
        <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Overall Risk Legend</p>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-red-500/30 border border-red-500 rounded" />
          <span>High Risk (&ge;70%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-amber-500/30 border border-amber-500 rounded" />
          <span>Medium Risk (40% - 69%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-emerald-500/30 border border-emerald-500 rounded" />
          <span>Low Risk (&lt;40%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-blue-500/40 border border-blue-600 border-2 rounded" />
          <span>Selected Zone</span>
        </div>
      </div>
    </div>
  );
}
