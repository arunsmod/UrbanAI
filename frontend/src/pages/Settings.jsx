import React from 'react';
import { Settings as SettingsIcon, ShieldCheck, User, Bell, Cpu, ShieldAlert } from 'lucide-react';

export default function Settings() {
  const systemInfo = {
    model: "Random Forest Regressor (scikit-learn)",
    version: "URBANAi v1.0.0-MVP",
    environment: "Configured deployment environment",
    ingestion: "Configured production data sources"
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Settings</h2>
        <p className="text-xs text-slate-500 font-medium">Configure simulation risk thresholds and inspect model variables.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns: Configs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Risk Thresholds Card */}
          <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <ShieldAlert className="w-4 h-4 text-slate-400" />
              Risk Severity Thresholds (%)
            </h3>
            
            <div className="space-y-3.5 pt-1 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-semibold">High Risk Bound (Red)</span>
                <span className="font-extrabold text-slate-800">&ge; 70%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-semibold">Medium Risk Bound (Amber)</span>
                <span className="font-extrabold text-slate-800">40% - 69%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-semibold">Low Risk Bound (Green)</span>
                <span className="font-extrabold text-slate-800">&lt; 40%</span>
              </div>
            </div>
          </div>

          {/* Model Configs */}
          <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Cpu className="w-4 h-4 text-slate-400" />
              Machine Learning Configuration
            </h3>
            
            <div className="space-y-3.5 pt-1 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-semibold">Classifier Algorithm</span>
                <span className="font-extrabold text-slate-800">Random Forest Regressor</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-semibold">Number of Estimators</span>
                <span className="font-extrabold text-slate-800">50 trees</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-semibold">Training Fit Split</span>
                <span className="font-extrabold text-slate-800">75% train / 25% test</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: System Info */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 text-white p-5 rounded-xl space-y-4 shadow-md">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest block">System Diagnostics</h3>
            
            <div className="space-y-3.5 pt-1 text-xs font-semibold">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Model Engine</span>
                <span className="text-slate-200">{systemInfo.model}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Release Build</span>
                <span className="text-slate-200">{systemInfo.version}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Telemetry Node</span>
                <span className="text-slate-200">{systemInfo.environment}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Ingestion Set</span>
                <span className="text-slate-200">{systemInfo.ingestion}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
