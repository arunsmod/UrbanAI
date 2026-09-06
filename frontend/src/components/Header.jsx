import React from 'react';
import { Bell, MapPin, LogOut } from 'lucide-react';

export default function Header({ selectedZoneId, onZoneChange, zones, user, onLogout }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 h-16 bg-white border-b border-slate-200">
      {/* Location / Zone Selector */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 text-slate-500 text-sm">
          <MapPin className="w-4 h-4 text-blue-600" />
          <span className="font-semibold text-slate-700">Chennai</span>
        </div>
        <div className="h-4 w-px bg-slate-200" />
        
        {/* Ward/Zone Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="zone-select" className="text-xs text-slate-500 font-medium">Active Zone:</label>
          <select
            id="zone-select"
            value={selectedZoneId}
            onChange={(e) => onZoneChange(e.target.value)}
            disabled={zones.length === 0}
            className="text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-md py-1 px-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Header Info & Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications Icon */}
        <button className="relative p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        </button>

        <div className="h-4 w-px bg-slate-200" />

        {/* Profile Card */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
            MA
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-slate-800">{user?.email || 'Admin User'}</p>
            <p className="text-[10px] text-slate-400 font-medium">Municipal Administrator</p>
          </div>
          <button onClick={onLogout} aria-label="Sign out" title="Sign out" className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
