import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import InterventionCard from '../components/InterventionCard';
import SimulationResult from '../components/SimulationResult';
import { Sliders, Coins, Users, Calendar, HelpCircle, AlertTriangle } from 'lucide-react';

export default function DecisionLab({ selectedZoneId, zones }) {
  const navigate = useNavigate();
  const [wardData, setWardData] = useState(null);
  
  // Sliders/Limits constraints state
  const [budget, setBudget] = useState(500000);
  const [workers, setWorkers] = useState(20);
  const [timeframe, setTimeframe] = useState(30);

  // Active result from the backend simulation service.
  const [simulatedResult, setSimulatedResult] = useState(null);
  const [selectedIntId, setSelectedIntId] = useState(null);
  const [selectedIntName, setSelectedIntName] = useState("");
  const [selectedIntType, setSelectedIntType] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      const data = await apiService.getWard(selectedZoneId);
      setWardData(data);
      // Reset simulator on ward change
      setSimulatedResult(null);
      setSelectedIntId(null);
    }
    loadData();
  }, [selectedZoneId]);

  if (!wardData) return <div className="p-8 text-center text-slate-500 font-semibold">Loading Decision Simulator...</div>;

  const handleSimulate = async (intervention) => {
    setLoading(true);
    setSelectedIntId(intervention.id);
    setSelectedIntName(intervention.name);
    setSelectedIntType(intervention.type);

    // Call the backend simulation service.
    const result = await apiService.simulateIntervention(selectedZoneId, intervention.type);
    setSimulatedResult(result);
    setLoading(false);
  };

  const handleResetSimulation = () => {
    setSimulatedResult(null);
    setSelectedIntId(null);
  };

  const handleCommit = async () => {
    const committed = await apiService.commitIntervention(selectedZoneId, selectedIntType);
    if (committed) {
      navigate('/interventions');
    }
  };

  const formatCost = (val) => {
    return `₹${(val / 100000).toFixed(1)} L`;
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Decision Lab</h2>
        <p className="text-xs text-slate-500 font-medium">Simulate interventions before committing municipal resources.</p>
      </div>

      {/* Ward Status Bar */}
      <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-xs grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Selected Ward</span>
          <span className="text-sm font-bold text-slate-800">{wardData.name}</span>
        </div>
        <div className="border-l border-slate-100 pl-0 md:pl-4">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Current Sustainability</span>
          <span className="text-sm font-extrabold text-slate-800">{wardData.sustainabilityScore} / 100</span>
        </div>
        <div className="border-l border-slate-100 pl-0 md:pl-4">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Current Composite Risk</span>
          <span className="text-sm font-extrabold text-red-600">{wardData.overallRisk}%</span>
        </div>
        <div className="border-l border-slate-100 pl-0 md:pl-4 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
          <span className="text-[10px] text-blue-500 font-bold uppercase block">Optimizer Shortcut</span>
          <span className="text-[11px] font-semibold text-blue-800 block leading-tight">Run multi-constraint knapsack optimizer.</span>
        </div>
      </div>

      {/* Constraints Sliders & Interventions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Constraints Configurator */}
        <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-xs space-y-6 h-fit">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              Resource Constraints
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">Sliders</span>
          </div>

          {/* Budget Constraint */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-slate-400" />
                Available Budget
              </span>
              <span className="font-extrabold text-slate-800">{formatCost(budget)}</span>
            </div>
            <input 
              type="range" 
              min="100000" 
              max="800000" 
              step="50000" 
              value={budget} 
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[9px] text-slate-400 font-bold">
              <span>₹1.0L</span>
              <span>₹8.0L</span>
            </div>
          </div>

          {/* Manpower Constraint */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-400" />
                Available Workers
              </span>
              <span className="font-extrabold text-slate-800">{workers} Workers</span>
            </div>
            <input 
              type="range" 
              min="5" 
              max="30" 
              step="1" 
              value={workers} 
              onChange={(e) => setWorkers(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[9px] text-slate-400 font-bold">
              <span>5 Workers</span>
              <span>30 Workers</span>
            </div>
          </div>

          {/* Timeframe Constraint */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                Available Duration
              </span>
              <span className="font-extrabold text-slate-800">{timeframe} Days</span>
            </div>
            <input 
              type="range" 
              min="5" 
              max="45" 
              step="5" 
              value={timeframe} 
              onChange={(e) => setTimeframe(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[9px] text-slate-400 font-bold">
              <span>5 Days</span>
              <span>45 Days</span>
            </div>
          </div>
        </div>

        {/* Right Side: Intervention Cards Grid */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Choose Intervention Plan</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wardData.interventions?.map((intervention) => {
              const exceedsBudget = intervention.cost > budget;
              const exceedsWorkers = intervention.workers > workers;
              const exceedsTime = intervention.duration > timeframe;
              const isBlocked = exceedsBudget || exceedsWorkers || exceedsTime;
              const isSelected = selectedIntId === intervention.id;

              return (
                <div key={intervention.id} className="relative">
                  <InterventionCard 
                    intervention={intervention} 
                    onSimulate={handleSimulate}
                    isSelected={isSelected}
                  />

                  {/* Red warning overlay if exceeds slider parameters */}
                  {isBlocked && (
                    <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-[0.5px] rounded-xl flex flex-col items-center justify-center p-4 text-center z-10 border border-red-100 animate-fade-in">
                      <AlertTriangle className="w-6 h-6 text-red-500 mb-1" />
                      <p className="text-[11px] font-bold text-red-800">Exceeds Limits</p>
                      <span className="text-[9px] text-slate-500 max-w-[150px] leading-tight font-medium mt-0.5">
                        {exceedsBudget && "Insufficient Budget. "}
                        {exceedsWorkers && "Insufficient Labor. "}
                        {exceedsTime && "Duration limits exceeded."}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Simulation Result comparison section */}
      {loading && (
        <div className="bg-slate-900 text-white p-8 rounded-xl text-center font-bold animate-pulse">
          Computing predictive simulation variables...
        </div>
      )}

      {simulatedResult && !loading && (
        <SimulationResult 
          result={simulatedResult} 
          interventionName={selectedIntName}
          onReset={handleResetSimulation}
          onCommit={handleCommit}
        />
      )}
    </div>
  );
}
