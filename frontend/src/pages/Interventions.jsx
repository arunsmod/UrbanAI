import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Wrench, PlayCircle, Calendar, CheckCircle2 } from 'lucide-react';

export default function Interventions() {
  const [interventions, setInterventions] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    async function loadData() {
      const data = await apiService.getInterventions();
      setInterventions(data);
    }
    loadData();
  }, []);

  const advanceStatus = async (item) => {
    const nextStatus = { Planned: 'approved', Approved: 'in_progress', 'In Progress': 'completed' }[item.status];
    if (!nextStatus) return;
    try {
      await apiService.updateInterventionStatus(String(item.id).replace('simulation-', ''), nextStatus);
      setInterventions((current) => current.map((candidate) => candidate.id === item.id
        ? { ...candidate, status: nextStatus === 'approved' ? 'Approved' : nextStatus === 'in_progress' ? 'In Progress' : 'Completed' }
        : candidate));
      setStatusMessage(`Plan moved to ${nextStatus.replace('_', ' ')}.`);
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'In Progress':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Planned':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'In Progress':
        return <PlayCircle className="w-3.5 h-3.5 text-blue-500" />;
      case 'Planned':
        return <Calendar className="w-3.5 h-3.5 text-amber-500" />;
      case 'Completed':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
      default:
        return <Wrench className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const filteredInterventions = interventions.filter(item => {
    if (activeTab === 'All') return true;
    return item.status === activeTab;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Intervention Management</h2>
        <p className="text-xs text-slate-500 font-medium">Track operational status, deployment budgets, and impact metrics.</p>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-slate-200 gap-4">
        {['All', 'In Progress', 'Planned', 'Completed'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all px-1
              ${activeTab === tab 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
              }
            `}
          >
            {tab}
          </button>
        ))}
      </div>
      {statusMessage && <p className="text-xs text-slate-600">{statusMessage}</p>}

      {/* Table Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-4 pl-6">Intervention</th>
                <th className="p-4">Zone / Ward</th>
                <th className="p-4">Status</th>
                <th className="p-4">Budget</th>
                <th className="p-4">Expected Impact</th>
                <th className="p-4 pr-6">Actual Impact</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {filteredInterventions.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 pl-6 flex items-center gap-2">
                    <span className="p-1.5 bg-slate-100 rounded-lg text-slate-500">
                      <Wrench className="w-3.5 h-3.5" />
                    </span>
                    <span>{item.name}</span>
                  </td>
                  <td className="p-4">{item.zone}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold ${getStatusBadge(item.status)}`}>
                      {getStatusIcon(item.status)}
                      {item.status}
                    </span>
                  </td>
                  <td className="p-4">{item.budget}</td>
                  <td className="p-4 text-blue-600">{item.expectedImpact}</td>
                  <td className={`p-4 pr-6 ${item.actualImpact === 'Pending' ? 'text-slate-400 italic' : 'text-emerald-600'}`}>
                    {item.actualImpact}
                  </td>
                  <td className="p-4">
                    {['Planned', 'Approved', 'In Progress'].includes(item.status) && (
                      <button onClick={() => advanceStatus(item)} className="text-[10px] font-bold text-blue-600 hover:text-blue-800">
                        {item.status === 'Planned' ? 'Approve' : item.status === 'Approved' ? 'Start' : 'Complete'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {filteredInterventions.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                    No interventions found matching filter category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
