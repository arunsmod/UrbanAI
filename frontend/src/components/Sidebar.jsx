import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Map, 
  Leaf, 
  AlertTriangle, 
  Sliders, 
  Cpu, 
  Database, 
  Settings, 
  Wrench,
  TrendingUp
  ,MessageCircle
} from 'lucide-react';

export default function Sidebar({ isOpen, toggleSidebar }) {
  const location = useLocation();

  const menuGroups = [
    {
      title: "URBANAi",
      items: [
        { path: "/", label: "Overview", icon: LayoutDashboard }
      ]
    },
    {
      title: "URBAN INTELLIGENCE",
      items: [
        { path: "/risk-map", label: "Risk Map", icon: Map },
        { path: "/sustainability", label: "Sustainability", icon: Leaf },
        { path: "/risk-prediction", label: "Risk Prediction", icon: TrendingUp }
      ]
    },
    {
      title: "DECISION LAB",
      items: [
        { path: "/decision-lab", label: "What-If Simulator", icon: Sliders },
        { path: "/resource-optimizer", label: "Resource Optimizer", icon: Cpu }
      ]
    },
    {
      title: "AI",
      items: [
        { path: "/ai-chat", label: "AI Analyst + Assistant", icon: MessageCircle }
      ]
    },
    {
      title: "OPERATIONS",
      items: [
        { path: "/interventions", label: "Interventions", icon: Wrench },
        { path: "/outcomes", label: "Outcome Tracking", icon: AlertTriangle }
      ]
    },
    {
      title: "SYSTEM",
      items: [
        { path: "/data-sources", label: "Data Sources", icon: Database },
        { path: "/settings", label: "Settings", icon: Settings }
      ]
    }
  ];

  const isActive = (path) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Persistent Sidebar */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-slate-300 transition-transform duration-300 ease-in-out lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-lg tracking-wider">
            U
          </div>
          <div>
            <h1 className="font-bold text-white tracking-wider text-lg">URBANAi</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Decision Engine</p>
          </div>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-7">
          {menuGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-2">
              <span className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                {group.title}
              </span>
              <ul className="space-y-1">
                {group.items.map((item, itemIdx) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <li key={itemIdx}>
                      <Link
                        to={item.path}
                        onClick={() => toggleSidebar(false)}
                        className={`
                          flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
                          ${active 
                            ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-500 pl-2.5' 
                            : 'hover:bg-slate-800 hover:text-white text-slate-400'
                          }
                        `}
                      >
                        <Icon className={`w-4 h-4 ${active ? 'text-blue-400' : 'text-slate-400 group-hover:text-white'}`} />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/20 text-center">
          <span className="text-xs text-slate-500 font-medium">Chennai Dashboard</span>
        </div>
      </aside>
    </>
  );
}
