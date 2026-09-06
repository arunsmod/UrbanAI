import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { apiService } from './services/api';
import { Menu } from 'lucide-react';

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

  useEffect(() => {
    async function loadZones() {
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
  }, []);

  const handleZoneChange = (id) => {
    setSelectedZoneId(id);
  };

  const toggleSidebar = (val) => {
    setIsSidebarOpen(val !== undefined ? val : !isSidebarOpen);
  };

  const handleLogin = async (email, password) => {
    const session = await apiService.login(email, password);
    localStorage.setItem('urbanai-token', session.access_token);
    localStorage.setItem('urbanai-user', JSON.stringify(session.user));
    setUser(session.user);
  };

  const handleLogout = () => {
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
      <div className="flex items-center justify-center min-h-screen bg-slate-50 p-6">
        <div className="max-w-md bg-white border border-red-200 rounded-xl p-6 text-center space-y-3">
          <h1 className="text-lg font-bold text-slate-900">Urban data is unavailable</h1>
          <p className="text-sm text-slate-600">The dashboard could not load its production data source.</p>
          <p className="text-xs text-red-700">{loadError}</p>
          <button onClick={handleLogout} className="text-sm font-semibold text-blue-700 hover:text-blue-900">Sign out</button>
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
