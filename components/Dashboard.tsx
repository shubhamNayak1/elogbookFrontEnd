
import React from 'react';
import { AppState, UserRole } from '../types';
import { ClipboardList, PlusCircle, Activity, History, AlertCircle } from 'lucide-react';

interface DashboardProps {
  state: AppState;
  navigateTo: (view: any, data?: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ state, navigateTo }) => {
  const isAdmin = state.currentUser?.role === UserRole.ADMIN;
  
  const stats = [
    { label: 'Active Templates', value: state.logbooks.filter(l => l.status === 'ACTIVE').length, icon: ClipboardList, color: 'text-blue-600' },
    { label: 'Total Entries', value: state.entries.length, icon: Activity, color: 'text-green-600' },
    { label: 'Audit Logs', value: state.auditLogs.length, icon: History, color: 'text-indigo-600' },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-slate-50 ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <span className="text-3xl font-bold text-slate-900">{stat.value}</span>
            </div>
            <p className="text-slate-500 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isAdmin && (
              <button 
                onClick={() => navigateTo('DESIGNER')}
                className="p-6 bg-white border border-slate-200 rounded-2xl hover:border-indigo-600 hover:shadow-md transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <PlusCircle size={24} />
                </div>
                <h3 className="font-bold text-slate-800">New Template</h3>
                <p className="text-sm text-slate-500 mt-1">Design a new eLogbook template with dynamic columns.</p>
              </button>
            )}
            <button 
              onClick={() => navigateTo('LOGBOOKS')}
              className="p-6 bg-white border border-slate-200 rounded-2xl hover:border-indigo-600 hover:shadow-md transition-all text-left group"
            >
              <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-4 group-hover:bg-green-600 group-hover:text-white transition-colors">
                <ClipboardList size={24} />
              </div>
              <h3 className="font-bold text-slate-800">Record Entry</h3>
              <p className="text-sm text-slate-500 mt-1">Select an active logbook and record new data entries.</p>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800">Recent Audit Logs</h2>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">
              {state.auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="p-4 flex items-start gap-4">
                  <div className={`mt-1 p-2 rounded-full ${
                    log.action === 'CREATE' ? 'bg-green-100 text-green-600' :
                    log.action === 'UPDATE' ? 'bg-blue-100 text-blue-600' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {log.action === 'CREATE' ? <PlusCircle size={14} /> : <Activity size={14} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm font-bold text-slate-800">
                        {log.action} {log.entityType.replace('_', ' ')}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">{log.reason}</p>
                    <p className="text-[10px] text-indigo-600 mt-1 uppercase font-bold">BY {log.username}</p>
                  </div>
                </div>
              ))}
              {state.auditLogs.length === 0 && (
                <div className="p-8 text-center text-slate-400">
                  <AlertCircle size={24} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No activity recorded yet.</p>
                </div>
              )}
            </div>
            {state.auditLogs.length > 5 && (
              <button 
                onClick={() => navigateTo('AUDIT')}
                className="w-full py-3 bg-slate-50 text-xs font-bold text-slate-500 hover:text-indigo-600 border-t border-slate-100"
              >
                VIEW FULL AUDIT TRAIL
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
