
import React, { useState } from 'react';
import { AuditRecord, User, UserRole } from '../types';
import { Search, Eye, Filter, ArrowUpDown, UserCheck, ShieldCheck } from 'lucide-react';

interface AuditLogViewProps {
  user: User;
  auditLogs: AuditRecord[];
}

const AuditLogView: React.FC<AuditLogViewProps> = ({ user, auditLogs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const isAdmin = user.role === UserRole.ADMIN;

  // Filter based on role first (Security requirement)
  const accessibleLogs = isAdmin 
    ? auditLogs 
    : auditLogs.filter(log => log.userId === user.id);

  // Then apply search filter
  const filteredLogs = accessibleLogs.filter(log => 
    log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-center gap-4 shadow-sm">
        <div className="flex-1 flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 w-full">
          <Search size={20} className="text-slate-400" />
          <input 
            type="text" 
            placeholder={isAdmin ? "Search all system activity..." : "Search your personal activity..."}
            className="bg-transparent w-full outline-none text-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Data Context Badge */}
          <div className={`
            flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest
            ${isAdmin ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-green-50 border-green-100 text-green-600'}
          `}>
            {isAdmin ? <ShieldCheck size={14} /> : <UserCheck size={14} />}
            {isAdmin ? 'System View' : 'Personal Records Only'}
          </div>
          
          <div className="flex gap-2 flex-1 md:flex-none">
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
              <Filter size={16} /> Filters
            </button>
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
              <ArrowUpDown size={16} /> Sort
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Timestamp</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">User</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Action</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entity</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reason / Justification</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-xs font-mono text-slate-500">{new Date(log.timestamp).toLocaleDateString()}</p>
                    <p className="text-[10px] font-mono text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                        {log.username.substring(0,2).toUpperCase()}
                      </div>
                      <span className="text-sm font-bold text-slate-800">{log.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`
                      text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider
                      ${log.action === 'CREATE' ? 'bg-green-50 text-green-600' :
                        log.action === 'UPDATE' ? 'bg-blue-50 text-blue-600' :
                        log.action === 'LOGIN' ? 'bg-indigo-50 text-indigo-600' :
                        'bg-slate-50 text-slate-500'}
                    `}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium text-slate-600">{log.entityType.replace('_', ' ')}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-slate-500 italic line-clamp-2 max-w-xs">{log.reason}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Search size={24} className="opacity-20" />
                      <p className="text-sm">No audit records found matching your search.</p>
                      {!isAdmin && accessibleLogs.length === 0 && (
                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                          You haven't performed any signable actions yet.
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="flex items-center justify-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] py-4">
        <span>Attributable</span>
        <span>•</span>
        <span>Legible</span>
        <span>•</span>
        <span>Contemporaneous</span>
        <span>•</span>
        <span>Original</span>
        <span>•</span>
        <span>Accurate</span>
      </div>
    </div>
  );
};

export default AuditLogView;
