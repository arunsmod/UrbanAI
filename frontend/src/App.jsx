import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { apiService } from './services/api';
import { Activity, ArrowRight, Menu, RefreshCw, Server } from 'lucide-react';
import { isFirebaseAuthEnabled, signInWithUrbanAI, signOutUrbanAI } from './firebase';

// Pages
import Overview from './pages/Overview';
import RiskMap from './pages/RiskMap';
import Sustainability from './pages/Sustainability';
import RiskPrediction from './pages/RiskPrediction';
import DecisionLab from './pages/DecisionLab';
import ResourceOptimizerPage from './pages/ResourceOptimizerPage';
import Interventions from './pages/Interventions';
import Outcomes from './pages/Outcomes';
import DataSources from './pages/DataSources';
import Settings from './pages/Settings';
import Login from './pages/Login';
import AIChat from './pages/AIChat';
import AIChatWidget from './components/AIChatWidget';

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('urbanai-user'));
      return localStorage.getItem('urbanai-token') ? storedUser : null;
    } catch {
      return null;
    }
  });
  const [zones, setZones] = useState([]);
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [retryAttempt, setRetryAttempt] = useState(0);

  useEffect(() => {
    async function loadZones() {
      setLoading(true);
      setLoadError(null);
      try {
        const data = await apiService.getWards();
        setZones(data);
        setSelectedZoneId(data[0]?.id || null);
      } catch (err) {
        console.error("Failed to load wards databases:", err);
        setLoadError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadZones();
  }, [retryAttempt]);

  const handleZoneChange = (id) => {
    setSelectedZoneId(id);
  };

  const toggleSidebar = (val) => {
    setIsSidebarOpen(val !== undefined ? val : !isSidebarOpen);
  };

  const handleLogin = async (email, password) => {
    if (isFirebaseAuthEnabled) {
      const userCredential = await signInWithUrbanAI(email, password);
      const firebaseToken = await userCredential.user.getIdToken();
      localStorage.setItem('urbanai-token', firebaseToken);
      localStorage.setItem('urbanai-user', JSON.stringify({ email: userCredential.user.email }));
      setUser({ email: userCredential.user.email });
      return;
    }

    const session = await apiService.login(email, password);
    localStorage.setItem('urbanai-token', session.access_token);
    localStorage.setItem('urbanai-user', JSON.stringify(session.user));
    setUser(session.user);
  };

  const handleLogout = async () => {
    if (isFirebaseAuthEnabled) {
      await signOutUrbanAI();
    }
    localStorage.removeItem('urbanai-user');
    localStorage.removeItem('urbanai-token');
    setUser(null);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-500 font-bold uppercase tracking-widest text-sm">
        Initializing URBANAi Decision Platform...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="relative flex items-center justify-center min-h-screen overflow-hidden bg-[#071525] px-6 py-12 text-white">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-white/[0.07] p-7 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-9">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 text-[#071525] shadow-lg shadow-cyan-400/20">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold tracking-[0.18em] text-white">URBANAi</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-200/60">Decision platform</p>
              </div>
            </div>
            <span className="flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-200">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-300" />
              Waking up
            </span>
          </div>

          <div className="mb-7 space-y-3">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">The city console is warming up.</h1>
            <p className="max-w-md text-sm leading-6 text-slate-300">
              The analysis server is starting after a quiet period. It is usually back online in under a minute, and your workspace will be ready as soon as it responds.
            </p>
          </div>

          <div className="mb-7 overflow-hidden rounded-xl border border-white/10 bg-black/10">
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
              <Server className="h-4 w-4 text-cyan-300" />
              <span className="text-xs font-semibold text-slate-200">URBANAi analysis engine</span>
              <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-amber-200">Connecting</span>
            </div>
            <div className="h-1 bg-white/5">
              <div className="h-full w-2/5 animate-pulse bg-gradient-to-r from-cyan-400 to-blue-500" />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => setRetryAttempt((attempt) => attempt + 1)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-cyan-400 px-4 py-3 text-sm font-bold text-[#071525] transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/60"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-white/15 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-white/30 hover:text-white"
            >
              Sign out
            </button>
          </div>
          <p className="mt-5 truncate text-[10px] text-slate-500" title={loadError}>Connection detail: {loadError}</p>
        </div>
      </div>
    );
  }

  if (zones.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 p-6">
        <div className="max-w-md bg-white border border-slate-200 rounded-xl p-6 text-center space-y-3">
          <h1 className="text-lg font-bold text-slate-900">No ward data is available</h1>
          <p className="text-sm text-slate-600">Connect an approved ingestion source and reload the dashboard.</p>
          <button onClick={handleLogout} className="text-sm font-semibold text-blue-700 hover:text-blue-900">Sign out</button>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
        
        {/* Navigation Sidebar */}
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

        {/* Main Content Pane */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          
          {/* Top Header */}
          <Header 
            selectedZoneId={selectedZoneId} 
            onZoneChange={handleZoneChange} 
            zones={zones}
            user={user}
            onLogout={handleLogout}
          />

          {/* Mobile Hamburguer Sticky Menu Trigger */}
          <div className="lg:hidden bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
            <span className="font-bold text-slate-800 tracking-wider">URBANAi</span>
            <button 
              onClick={() => toggleSidebar(true)} 
              className="p-1 text-slate-500 hover:text-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Subpages Container */}
          <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
            <Routes>
              <Route 
                path="/" 
                element={
                  <Overview 
                    selectedZoneId={selectedZoneId} 
                    onZoneChange={handleZoneChange} 
                    zones={zones} 
                  />
                } 
              />
              <Route 
                path="/risk-map" 
                element={
                  <RiskMap 
                    selectedZoneId={selectedZoneId} 
                    onZoneChange={handleZoneChange} 
                    zones={zones} 
                  />
                } 
              />
              <Route 
                path="/sustainability" 
                element={
                  <Sustainability 
                    selectedZoneId={selectedZoneId} 
                    zones={zones} 
                  />
                } 
              />
              <Route 
                path="/risk-prediction" 
                element={
                  <RiskPrediction 
                    selectedZoneId={selectedZoneId} 
                    onZoneChange={handleZoneChange} 
                    zones={zones} 
                  />
                } 
              />
              <Route 
                path="/decision-lab" 
                element={
                  <DecisionLab 
                    selectedZoneId={selectedZoneId} 
                    zones={zones} 
                  />
                } 
              />
              <Route 
                path="/resource-optimizer" 
                element={
                  <ResourceOptimizerPage 
                    selectedZoneId={selectedZoneId} 
                    zones={zones} 
                  />
                } 
              />
              <Route path="/ai-analyst" element={<Navigate to="/ai-chat" replace />} />
              <Route path="/ai-chat" element={<AIChat selectedZoneId={selectedZoneId} zones={zones} />} />
              <Route path="/interventions" element={<Interventions />} />
              <Route path="/outcomes" element={<Outcomes />} />
              <Route path="/data-sources" element={<DataSources />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <AIChatWidget selectedZoneId={selectedZoneId} />
        </div>
      </div>
    </Router>
  );
}
