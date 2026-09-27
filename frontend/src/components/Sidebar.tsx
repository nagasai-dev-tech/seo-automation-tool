import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, TrendingUp, Key, Globe, Layers,
  FileText, PlayCircle, BarChart3, BellRing, Settings,
  Clock, X
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navItems = [
    { label: 'Dashboard', to: '/', icon: LayoutDashboard },
    { label: 'Rankings', to: '/rankings', icon: TrendingUp },
    { label: 'Keywords', to: '/keywords', icon: Key },
    { label: 'Websites', to: '/websites', icon: Globe },
    { label: 'Brands', to: '/brands', icon: Layers },
    { label: 'Rank Jobs', to: '/jobs', icon: PlayCircle },
    { label: 'Analytics', to: '/analytics', icon: BarChart3 },
    { label: 'Reports', to: '/reports', icon: FileText },
    { label: 'Alerts', to: '/alerts', icon: BellRing },
    { label: 'Settings', to: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Logo Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center font-black text-white text-base shadow-sm">
              A
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                <span>Avention</span>
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-semibold border border-red-500/30">
                  SEO
                </span>
              </div>
              <div className="text-[10px] text-slate-400 -mt-0.5 font-medium">Rank Automation</div>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white md:hidden">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Platform Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Monday Automation Schedule Card */}
        <div className="p-3 m-3 rounded-xl bg-slate-800/70 border border-slate-700/60 text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-bold mb-1.5">
            <Clock className="w-3.5 h-3.5 text-red-400" />
            <span>Monday Automation</span>
          </div>
          <div className="text-[11px] text-slate-400 leading-relaxed">
            Automated check runs every Monday at <strong className="text-white">06:00 AM</strong>.
          </div>
          <div className="mt-2 text-[10px] font-mono text-emerald-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Scheduler: Active (Asia/Kolkata)
          </div>
        </div>

        {/* System Version */}
        <div className="px-6 py-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-mono">
          <span>Avention SaaS v1.0</span>
          <span className="text-emerald-400 font-semibold">Online</span>
        </div>
      </aside>
    </>
  );
};
