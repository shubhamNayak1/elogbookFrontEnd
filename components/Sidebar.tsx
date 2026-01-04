
import React from 'react';
import { User, UserRole } from '../types';
import { Layout, ClipboardList, Database, History, BarChart3, LogOut, ShieldCheck, Users } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  currentView: string;
  user: User;
  onNavigate: (view: any) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, currentView, user, onNavigate, onLogout }) => {
  const isAdmin = user.role === UserRole.ADMIN;

  const navItems = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: Layout },
    { id: 'LOGBOOKS', label: 'Logbooks', icon: ClipboardList },
    { id: 'DESIGNER', label: 'Template Designer', icon: Database, adminOnly: true },
    { id: 'USERS', label: 'User Management', icon: Users, adminOnly: true },
    { id: 'REPORTS', label: 'Reporting', icon: BarChart3 },
    { id: 'AUDIT', label: 'Audit Trail', icon: History },
  ];

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 transform transition-transform duration-200 ease-in-out
      md:relative md:translate-x-0
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      <div className="h-full flex flex-col">
        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <ShieldCheck size={24} />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-white tracking-tight">PharmaTrack</span>
            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">eLogbook System</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.filter(item => !item.adminOnly || isAdmin).map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                ${currentView === item.id 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'hover:bg-slate-800 hover:text-white'}
              `}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3 px-2 py-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
              {user.username.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user.fullName}</p>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{user.role}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 mt-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium text-sm">Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
