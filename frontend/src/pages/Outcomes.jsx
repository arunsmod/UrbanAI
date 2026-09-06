import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { Target, HelpCircle, Activity, Sparkles } from 'lucide-react';

export default function Outcomes() {
  const [logs, setLogs] = useState([]);
  const [selectedLogId, setSelectedLogId] = useState(null);
  const [activeLog, setActiveLog] = useState(null);
  const [actualRisk, setActualRisk] = useState('');
  const [submitStatus, setSubmitStatus] = useState('');

  useEffect(() => {
    async function loadData() {
      const data = await apiService.getOutcomeLogs();
      setLogs(data);
      if (data && data.length > 0) {
        setSelectedLogId(data[0].id);
        setActiveLog(data[0]);
      }
    }
    loadData();
  }, []);

  const handleSelectChange = (id) => {
    const numericId = Number(id);
    setSelectedLogId(numericId);
    const matched = logs.find(log => log.id === numericId);
    setActiveLog(matched);
  };

  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 90) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (accuracy >= 75) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-amber-600 bg-amber-50 border-amber-200';
  };

  // Format chart data based on active selection
  const getChartData = () => {
    if (!activeLog) return [];
    return [
      {
        name: 'Improvement (%)',
        Predicted: activeLog.predictedImprovement,
        Actual: activeLog.actualImprovement
      },
      {
        name: 'Final Risk Index (%)',
        Predicted: activeLog.predictedRisk,
        Actual: activeLog.actualRisk
      }
    ];
  };

  const chartData = getChartData();

  const submitOutcome = async () => {
    if (!activeLog || actualRisk === '') return;
    const result = await apiService.recordOutcome({
      wardId: activeLog.wardId,
      predictedRisk: activeLog.predictedRisk,
      actualRisk: Number(actualRisk),
      interventions: [activeLog.intervention]
    });
    setSubmitStatus(result ? 'Outcome recorded in the live feedback loop.' : 'Unable to record outcome.');
    if (result) setActualRisk('');
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Outcome Tracking</h2>
        <p className="text-xs text-slate-500 font-medium">Verify post-intervention effectiveness and adjust forecasting models.</p>
      </div>

      {/* Selector bar */}
      <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <label htmlFor="log-select" className="text-xs text-slate-500 font-bold uppercase whitespace-nowrap">Verified Intervention:</label>
          <select
            id="log-select"
            value={selectedLogId || ""}
            onChange={(e) => handleSelectChange(e.target.value)}
            className="text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-md py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {logs.map((log) => (
              <option key={log.id} value={log.id}>
                {log.intervention}
              </option>
            ))}
          </select>
        </div>
        <span className="text-[10px] text-slate-400 font-semibold bg-slate-100 px-2 py-0.5 rounded uppercase">Closed Loop Feedback</span>
      </div>

      {activeLog && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side: Before/Predicted/Actual Comparisons */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* KPI Compare Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Before State */}
              <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-xs text-center space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Before Intervention</span>
                <span className="text-2xl font-extrabold text-slate-500">{activeLog.beforeRisk}%</span>
                <span className="text-[9px] text-slate-400 font-medium block">Baseline Risk Index</span>
              </div>

              {/* Predicted State */}
              <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-xs text-center space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Predicted Outcome</span>
                <span className="text-2xl font-extrabold text-blue-600">{activeLog.predictedRisk}%</span>
                <span className="text-[9px] text-blue-500 font-bold block">-{activeLog.predictedImprovement}% Improvement</span>
              </div>

              {/* Actual State */}
              <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-xs text-center space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Actual Outcome</span>
                <span className="text-2xl font-extrabold text-emerald-600">{activeLog.actualRisk}%</span>
                <span className="text-[9px] text-emerald-600 font-bold block">-{activeLog.actualImprovement}% Improvement</span>
              </div>
            </div>

            {/* Visual Bar Chart */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Predicted vs. Actual Outcomes</h3>
              <div className="bg-white p-5 border border-slate-200 rounded-xl h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                    <Bar dataKey="Predicted" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={45} />
                    <Bar dataKey="Actual" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={45} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Right Side: Prediction Accuracy & Feedback Loops */}
          <div className="space-y-6">
            
            {/* Accuracy card */}
            <div className="bg-white p-5 border border-slate-200 rounded-xl space-y-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Outcome Accuracy</span>
              <div className={`p-4 border rounded-xl flex items-center justify-between ${getAccuracyColor(activeLog.accuracy)}`}>
                <div className="space-y-0.5">
                  <span className="text-xs opacity-75 font-semibold block uppercase tracking-wider">Accuracy Score</span>
                  <span className="text-2xl font-black">{activeLog.accuracy}%</span>
                </div>
                <Target className="w-8 h-8 opacity-60" />
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                Represents the difference between the expected composite-risk outcome and the measured post-deployment result.
              </p>
            </div>

            {/* AI outcome feedback loop */}
            <div className="bg-slate-900 border border-slate-800 text-white p-5 rounded-xl space-y-4">
              <div className="flex items-center gap-1.5 text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded w-fit text-[10px] font-bold">
                <Sparkles className="w-3 h-3" />
                <span>AI FEEDBACK LOOP</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100">Closed-Loop Adjustment</h4>
                <p className="text-xs text-slate-300 leading-relaxed font-medium mt-1.5">
                  {activeLog.feedback}
                </p>
                <div className="bg-slate-950/50 border border-slate-800 p-2.5 rounded-lg text-[10px] text-slate-400 font-bold mt-3 leading-relaxed">
                  NOTE: Outcome metrics are integrated into the Random Forest regression models to automatically correct weights for the next simulation cycle.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-5 border border-slate-200 rounded-xl space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Record Actual Result</h3>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs font-semibold text-slate-600">
            Actual risk after implementation
            <input type="number" min="0" max="100" value={actualRisk} onChange={(event) => setActualRisk(event.target.value)} className="block mt-1 w-36 border border-slate-200 rounded-md px-2 py-1.5 text-sm" />
          </label>
          <button onClick={submitOutcome} disabled={!activeLog || actualRisk === ''} className="px-3 py-2 bg-blue-600 text-white rounded-md text-xs font-bold disabled:opacity-50">Save Outcome</button>
          {submitStatus && <span className="text-xs text-slate-500">{submitStatus}</span>}
        </div>
      </div>
    </div>
  );
}
