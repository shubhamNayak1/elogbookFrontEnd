
import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole, AppState, LogbookTemplate, LogbookStatus } from './types';
import { api } from './services/api';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import LogbookDesigner from './components/LogbookDesigner';
import LogbookEntryList from './components/LogbookEntryList';
import EntryForm from './components/EntryForm';
import AuditLogView from './components/AuditLogView';
import ReportingDashboard from './components/ReportingDashboard';
import { Shield, Layout, ClipboardList, History, BarChart3, Menu, X, Database, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState | null>(null);
  const [currentView, setCurrentView] = useState<'DASHBOARD' | 'DESIGNER' | 'LOGBOOKS' | 'AUDIT' | 'REPORTS' | 'ENTRY_FORM'>('DASHBOARD');
  const [selectedLogbook, setSelectedLogbook] = useState<LogbookTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<LogbookTemplate | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshState = useCallback(async () => {
    setIsRefreshing(true);
    const state = await api.getState();
    setAppState(state);
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    refreshState();
  }, [refreshState]);

  if (!appState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  if (!appState.currentUser) {
    return <Login onLogin={refreshState} />;
  }

  const navigateTo = (view: typeof currentView, data?: any) => {
    if (view === 'ENTRY_FORM') {
      setSelectedLogbook(data);
    } else if (view === 'DESIGNER') {
      setEditingTemplate(data || null);
    }
    
    setCurrentView(view);
    setSidebarOpen(false);
  };

  const handleLogout = async () => {
    await api.logout();
    await refreshState();
  };

  const renderContent = () => {
    // Current user is guaranteed to exist here
    const user = appState.currentUser!;

    switch (currentView) {
      case 'DASHBOARD':
        return <Dashboard state={appState} navigateTo={navigateTo} />;
      case 'DESIGNER':
        return user.role === UserRole.ADMIN 
          ? <LogbookDesigner 
              initialTemplate={editingTemplate} 
              onSave={async () => { 
                setEditingTemplate(null);
                await refreshState(); 
                navigateTo('LOGBOOKS');
              }} 
            /> 
          : <div className="p-8 text-red-500 font-bold">Access Denied: Administrator role required.</div>;
      case 'LOGBOOKS':
        return <LogbookEntryList user={user} logbooks={appState.logbooks} navigateTo={navigateTo} />;
      case 'ENTRY_FORM':
        return selectedLogbook 
          ? <EntryForm template={selectedLogbook} onSave={async () => { await refreshState(); navigateTo('LOGBOOKS'); }} onCancel={() => navigateTo('LOGBOOKS')} />
          : <div>No Logbook Selected</div>;
      case 'AUDIT':
        return <AuditLogView user={user} auditLogs={appState.auditLogs} />;
      case 'REPORTS':
        return <ReportingDashboard state={appState} />;
      default:
        return <Dashboard state={appState} navigateTo={navigateTo} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-indigo-700 text-white p-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-2">
          <Shield size={24} />
          <span className="font-bold tracking-tight uppercase text-sm">PharmaTrack</span>
        </div>
        <button onClick={() => setSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        currentView={currentView} 
        user={appState.currentUser} 
        onNavigate={navigateTo} 
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
        {isRefreshing && (
          <div className="absolute top-4 right-8 flex items-center gap-2 text-[10px] font-bold text-indigo-400 uppercase tracking-widest bg-white/80 backdrop-blur px-3 py-1 rounded-full border border-indigo-50 shadow-sm z-10 animate-pulse">
            <Loader2 size={12} className="animate-spin" /> Synchronizing...
          </div>
        )}
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
                {currentView === 'DASHBOARD' && <Layout className="text-indigo-600" />}
                {currentView === 'DESIGNER' && <Database className="text-indigo-600" />}
                {currentView === 'LOGBOOKS' && <ClipboardList className="text-indigo-600" />}
                {currentView === 'AUDIT' && <History className="text-indigo-600" />}
                {currentView === 'REPORTS' && <BarChart3 className="text-indigo-600" />}
                {currentView.replace('_', ' ')}
                {currentView === 'DESIGNER' && editingTemplate && (
                  <span className="text-indigo-400 text-sm font-medium ml-2">/ Editing: {editingTemplate.name}</span>
                )}
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Active Session: <span className="font-semibold text-slate-700">{appState.currentUser.fullName}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-4 text-[10px] font-mono bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-green-600 font-bold">SECURE NODE: 0x82A1</span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-600 uppercase tracking-tighter">21 CFR PART 11</span>
              </div>
            </div>
          </div>
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
