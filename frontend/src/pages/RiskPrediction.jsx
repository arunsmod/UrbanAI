import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ReferenceLine 
} from 'recharts';
import { Brain, Sliders, ShieldAlert, AlertCircle, HelpCircle } from 'lucide-react';

const HAZARD_CONTROLS = [
  ['earthquake', 'Earthquake Exposure'],
  ['windstorm', 'Windstorm Exposure'],
  ['airQuality', 'Air Quality'],
  ['wildfire', 'Wildfire Exposure'],
  ['landslide', 'Landslide Exposure'],
  ['industrial', 'Industrial Incident'],
];

export default function RiskPrediction({ selectedZoneId, onZoneChange, zones }) {
  const navigate = useNavigate();
  const [wardData, setWardData] = useState(null);
  const [inputs, setInputs] = useState({
    rainfall: 'HIGH',
    drainageCapacity: 'LOW',
    historicalWaterlogging: 'HIGH',
    waterloggingSignals: 'HIGH',
    elevation: 'MEDIUM',
    earthquake: 'LOW',
    windstorm: 'LOW',
    airQuality: 'LOW',
    wildfire: 'LOW',
    landslide: 'LOW',
    industrial: 'LOW'
  });
  const [prediction, setPrediction] = useState({
    riskProbability: 78,
    confidence: 84,
    explanation: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      const data = await apiService.getWard(selectedZoneId);
      setWardData(data);
      if (data) {
        // Initialize inputs based on zone data
        setInputs({
          rainfall: data.riskFactors?.rainfallExposure || 'HIGH',
          drainageCapacity: data.riskFactors?.drainageCapacity || 'LOW',
          historicalWaterlogging: data.riskFactors?.historicalWaterlogging || 'HIGH',
          waterloggingSignals: data.riskFactors?.waterloggingSignals || 'HIGH',
          elevation: data.riskFactors?.elevation || 'MEDIUM',
          earthquake: data.riskFactors?.earthquake || 'LOW',
          windstorm: data.riskFactors?.windstorm || 'LOW',
          airQuality: data.riskFactors?.airQuality || 'LOW',
          wildfire: data.riskFactors?.wildfire || 'LOW',
          landslide: data.riskFactors?.landslide || 'LOW',
          industrial: data.riskFactors?.industrial || 'LOW'
        });
      }
    }
    loadData();
  }, [selectedZoneId]);

  // Recalculate prediction whenever inputs or ward changes
  useEffect(() => {
    async function getMLPrediction() {
      if (!selectedZoneId) return;
      setLoading(true);
      const res = await apiService.predictRisk(selectedZoneId, inputs);
      if (res) {
        setPrediction(res);
      }
      setLoading(false);
    }
    getMLPrediction();
  }, [inputs, selectedZoneId]);

  if (!wardData) return <div className="p-8 text-center text-slate-500 font-semibold">Loading Risk Prediction...</div>;

  const getRiskColor = (prob) => {
    if (prob >= 70) return 'text-red-600 bg-red-50 border-red-200';
    if (prob >= 40) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  };

  const getRiskText = (prob) => {
    if (prob >= 70) return 'HIGH';
    if (prob >= 40) return 'MEDIUM';
    return 'LOW';
  };

  const handleInputChange = (field, value) => {
    setInputs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Only render observed/model output. Forecast points require time-series data.
  const getPredictiveChartData = () => {
    const historical = [
      { name: "Current", risk: prediction.riskProbability },
    ];
    return historical;
  };

  const chartData = getPredictiveChartData();

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Predictive Urban Risk</h2>
        <p className="text-xs text-slate-500 font-medium">Evaluate current indicators across flood, air quality, seismic, weather, ecological, and industrial hazards.</p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns: Parameters Selector & Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Factor Controls */}
          <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5" />
                Risk Factor Simulation Controls
              </h3>
              {loading && <span className="text-[10px] text-blue-500 font-bold animate-pulse">Running ML Model...</span>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Rainfall */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Rainfall Exposure</label>
                <select
                  value={inputs.rainfall}
                  onChange={(e) => handleInputChange('rainfall', e.target.value)}
                  className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-md py-1 px-2.5"
                >
                  <option value="LOW">LOW (No significant rain)</option>
                  <option value="MEDIUM">MEDIUM (Standard seasonal)</option>
                  <option value="HIGH">HIGH (Monsoon/Heavy storm)</option>
                </select>
              </div>

              {/* Drainage */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Drainage Capacity</label>
                <select
                  value={inputs.drainageCapacity}
                  onChange={(e) => handleInputChange('drainageCapacity', e.target.value)}
                  className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-md py-1 px-2.5"
                >
                  <option value="HIGH">HIGH (Unblocked channels)</option>
                  <option value="MEDIUM">MEDIUM (Moderate flow)</option>
                  <option value="LOW">LOW (Silt bottlenecks)</option>
                </select>
              </div>

              {/* Waterlogging signals */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Citizen Signals / Complaints</label>
                <select
                  value={inputs.waterloggingSignals}
                  onChange={(e) => handleInputChange('waterloggingSignals', e.target.value)}
                  className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-md py-1 px-2.5"
                >
                  <option value="LOW">LOW (Few or no calls)</option>
                  <option value="MEDIUM">MEDIUM (Occasional reports)</option>
                  <option value="HIGH">HIGH (Concentrated alerts)</option>
                </select>
              </div>

              {/* Elevation */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Elevation Profile</label>
                <select
                  value={inputs.elevation}
                  onChange={(e) => handleInputChange('elevation', e.target.value)}
                  className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-md py-1 px-2.5"
                >
                  <option value="HIGH">HIGH (Ridge / Sloped)</option>
                  <option value="MEDIUM">MEDIUM (Flat plain)</option>
                  <option value="LOW">LOW (Basin / Sink)</option>
                </select>
              </div>

              {/* Historical Waterlogging */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Historical Waterlogging</label>
                <select
                  value={inputs.historicalWaterlogging}
                  onChange={(e) => handleInputChange('historicalWaterlogging', e.target.value)}
                  className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-md py-1 px-2.5"
                >
                  <option value="LOW">LOW (Rarely floods)</option>
                  <option value="MEDIUM">MEDIUM (Floods occasionally)</option>
                  <option value="HIGH">HIGH (Known chronic point)</option>
                </select>
              </div>

              {HAZARD_CONTROLS.map(([field, label]) => (
                <div className="space-y-1.5" key={field}>
                  <label className="text-[10px] text-slate-500 font-bold uppercase">{label}</label>
                  <select
                    value={inputs[field]}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-md py-1 px-2.5"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Forecast Line Chart */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Composite Risk</h3>
            <div className="bg-white p-5 border border-slate-200 rounded-xl h-60">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <ReferenceLine x="Current" stroke="#64748b" strokeWidth={1} label={{ value: 'CURRENT STATE', fill: '#64748b', fontSize: 9, position: 'insideTopRight', fontWeight: 'bold' }} />
                  <Line 
                    name="Risk Index (%)" 
                    type="monotone" 
                    dataKey="risk" 
                    stroke="#ef4444" 
                    strokeWidth={2.5}
                    dot={(props) => {
                      const { cx, cy, payload } = props;
                      const isForecast = payload.name.includes('(F)');
                      return (
                        <circle cx={cx} cy={cy} r={isForecast ? 3 : 4} stroke={isForecast ? '#94a3b8' : '#ef4444'} strokeWidth={2} fill="white" key={payload.name} />
                      );
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column: Prediction Score & AI Summary */}
        <div className="space-y-6">
          {/* Main Risk Card */}
          <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-xs space-y-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Overall Multi-Hazard Risk Score</span>
            
            <div className={`p-4 border rounded-xl flex items-center justify-between ${getRiskColor(prediction.riskProbability)}`}>
              <div>
                <span className="text-xs font-semibold block uppercase tracking-wider opacity-75">Severity Level</span>
                <span className="text-2xl font-black">{getRiskText(prediction.riskProbability)}</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold block uppercase tracking-wider opacity-75">Score</span>
                <span className="text-3xl font-black">{prediction.riskProbability}%</span>
              </div>
            </div>

            {/* Model Confidence with info tooltip */}
            <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-3">
              <span className="text-slate-500 font-semibold flex items-center gap-1">
                Model Confidence
                <div className="group relative cursor-pointer">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block w-48 bg-slate-800 text-white text-[10px] p-2 rounded shadow-lg z-50 leading-relaxed font-normal">
                    Confidence represents the prediction accuracy score evaluated on historical verification testing splits.
                  </div>
                </div>
              </span>
              <span className="font-extrabold text-slate-800">{prediction.confidence}%</span>
            </div>
          </div>

          {/* AI Explanation of risk */}
          <div className="bg-slate-900 border border-slate-800 text-white p-5 rounded-xl space-y-4">
            <div className="flex items-center gap-1.5 text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded w-fit text-[10px] font-bold">
              <Brain className="w-3.5 h-3.5" />
              <span>AI EXPLAINABILITY ANALYSIS</span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100">Why is the risk increasing?</h4>
              <p className="text-xs text-slate-300 leading-relaxed font-medium mt-1.5">
                {prediction.explanation || `Risk is expected to increase if rainfall remains above the historical average while drainage capacity remains constrained.`}
              </p>
            </div>
            
            <div className="flex items-center gap-2 pt-1">
              <button 
                onClick={() => navigate('/data-sources')}
                className="flex-1 py-2 px-3 border border-slate-700 hover:border-slate-500 hover:text-white rounded-lg text-xs font-bold text-slate-300 transition-colors text-center"
              >
                View Evidence
              </button>
              <button 
                onClick={() => navigate('/decision-lab')}
                className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors text-center"
              >
                Open Decision Lab
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
