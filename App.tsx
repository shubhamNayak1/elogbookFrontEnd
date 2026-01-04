
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
import { Shield, Layout, ClipboardList, History, BarChart3, Menu, X, Database } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(api.getState());
  const [currentView, setCurrentView] = useState<'DASHBOARD' | 'DESIGNER' | 'LOGBOOKS' | 'AUDIT' | 'REPORTS' | 'ENTRY_FORM'>('DASHBOARD');
  const [selectedLogbook, setSelectedLogbook] = useState<LogbookTemplate | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const refreshState = useCallback(() => {
    setAppState(api.getState());
  }, []);

  useEffect(() => {
    refreshState();
  }, [refreshState]);

  if (!appState.currentUser) {
    return <Login onLogin={refreshState} />;
  }

  const navigateTo = (view: typeof currentView, data?: any) => {
    if (view === 'ENTRY_FORM') setSelectedLogbook(data);
    setCurrentView(view);
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    api.logout();
    refreshState();
  };

  const renderContent = () => {
    switch (currentView) {
      case 'DASHBOARD':
        return <Dashboard state={appState} navigateTo={navigateTo} />;
      case 'DESIGNER':
        return appState.currentUser?.role === UserRole.ADMIN 
          ? <LogbookDesigner onSave={refreshState} /> 
          : <div className="p-8 text-red-500">Access Denied</div>;
      case 'LOGBOOKS':
        return <LogbookEntryList logbooks={appState.logbooks} navigateTo={navigateTo} />;
      case 'ENTRY_FORM':
        return selectedLogbook 
          ? <EntryForm template={selectedLogbook} onSave={() => { refreshState(); navigateTo('LOGBOOKS'); }} onCancel={() => navigateTo('LOGBOOKS')} />
          : <div>No Logbook Selected</div>;
      case 'AUDIT':
        return <AuditLogView auditLogs={appState.auditLogs} />;
      case 'REPORTS':
        return <ReportingDashboard state={appState} />;
      default:
        return <Dashboard state={appState} navigateTo={navigateTo} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-indigo-700 text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Shield size={24} />
          <span className="font-bold tracking-tight">PharmaTrack</span>
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
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                {currentView === 'DASHBOARD' && <Layout className="text-indigo-600" />}
                {currentView === 'DESIGNER' && <Database className="text-indigo-600" />}
                {currentView === 'LOGBOOKS' && <ClipboardList className="text-indigo-600" />}
                {currentView === 'AUDIT' && <History className="text-indigo-600" />}
                {currentView === 'REPORTS' && <BarChart3 className="text-indigo-600" />}
                {currentView.replace('_', ' ')}
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Welcome back, <span className="font-semibold text-slate-700">{appState.currentUser.fullName}</span> ({appState.currentUser.role})
              </p>
            </div>
            <div className="hidden md:flex items-center gap-4 text-xs font-mono bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
              <span className="text-green-600 font-bold underline">GxP COMPLIANT</span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-600 uppercase">21 CFR PART 11 ENABLED</span>
            </div>
          </div>
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
