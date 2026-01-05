
import React, { useState, useMemo } from 'react';
import { AuditRecord, User, UserRole } from '../types';
import { Search, Eye, Filter, ArrowUpDown, UserCheck, ShieldCheck, Download, Calendar, AlertCircle, FileSpreadsheet, X, Fingerprint, Clock, Tag } from 'lucide-react';

interface AuditLogViewProps {
  user: User;
  auditLogs: AuditRecord[];
}

const AuditLogView: React.FC<AuditLogViewProps> = ({ user, auditLogs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditRecord | null>(null);
  
  const isAdmin = user.role === UserRole.ADMIN;

  // Get today's date in YYYY-MM-DD format for input restriction
  const today = new Date().toISOString().split('T')[0];

  // Filter based on role first (Security requirement)
  const accessibleLogs = useMemo(() => {
    return isAdmin 
      ? auditLogs 
      : auditLogs.filter(log => log.userId === user.id);
  }, [isAdmin, auditLogs, user.id]);

  // Apply search and date filters
  const filteredLogs = useMemo(() => {
    return accessibleLogs.filter(log => {
      const matchesSearch = 
        log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.reason.toLowerCase().includes(searchTerm.toLowerCase());
      
      const logTime = new Date(log.timestamp).getTime();
      const start = startDate ? new Date(startDate).getTime() : 0;
      const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : Infinity;
      
      const matchesDate = logTime >= start && logTime <= end;
      
      return matchesSearch && matchesDate;
    });
  }, [accessibleLogs, searchTerm, startDate, endDate]);

  const validateRange = () => {
    if (!startDate || !endDate) return "Please select both start and end dates.";
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    if (end > now) return "End date cannot be in the future.";
    if (start > now) return "Start date cannot be in the future.";
    if (end < start) return "End date cannot be before start date.";
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 31) return "Export range is limited to 1 month (31 days).";
    return null;
  };

  const downloadCSV = () => {
    const error = validateRange();
    if (error) {
      alert(error);
      return;
    }

    setIsExporting(true);
    
    // Prepare headers
    const headers = ["Timestamp", "User", "Action", "Entity Type", "Entity ID", "Reason", "Old Value", "New Value"];
    
    // Format rows
    const rows = filteredLogs.map(log => [
      new Date(log.timestamp).toISOString(),
      log.username,
      log.action,
      log.entityType,
      log.entityId,
      `"${log.reason.replace(/"/g, '""')}"`,
      `"${JSON.stringify(log.oldValue || '').replace(/"/g, '""')}"`,
      `"${JSON.stringify(log.newValue || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    link.setAttribute("href", url);
    link.setAttribute("download", `PharmaTrack_Audit_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setIsExporting(false);
  };

  const renderValue = (val: any) => {
    if (val === null || val === undefined) return <span className="text-slate-400 italic">None</span>;
    if (typeof val === 'object') {
      return (
        <pre className="text-[10px] font-mono bg-slate-50 p-3 rounded-xl border border-slate-100 overflow-x-auto text-slate-600">
          {JSON.stringify(val, null, 2)}
        </pre>
      );
    }
    return <span className="text-sm font-medium text-slate-700">{String(val)}</span>;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Filters Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
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
          
          <div className={`
            hidden md:flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest
            ${isAdmin ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-green-50 border-green-100 text-green-600'}
          `}>
            {isAdmin ? <ShieldCheck size={14} /> : <UserCheck size={14} />}
            {isAdmin ? 'System View' : 'Personal Records'}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-50 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Calendar size={10} /> Export Start Date
              </label>
              <input 
                type="date" 
                value={startDate} 
                max={endDate || today}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Calendar size={10} /> Export End Date
              </label>
              <input 
                type="date" 
                value={endDate} 
                min={startDate}
                max={today}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500" 
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={downloadCSV}
              disabled={isExporting || !startDate || !endDate}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-300 shadow-xl shadow-indigo-100 transition-all"
            >
              <FileSpreadsheet size={16} /> Export CSV (Excel)
            </button>
          </div>
        </div>

        {(startDate && endDate) && (
          <div className="p-3 bg-indigo-50/50 rounded-xl flex items-center gap-2 text-[10px] font-bold text-indigo-600">
            <AlertCircle size={14} /> 
            Note: Maximum range for regulatory exports is 31 days. Current range: {startDate} to {endDate}
          </div>
        )}
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
                    <button 
                      onClick={() => setSelectedLog(log)}
                      className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    >
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
                      <p className="text-sm">No audit records found matching your filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600 border border-slate-100">
                  <Fingerprint size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Audit Record Detail</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Regulatory Verification Trace</p>
                </div>
              </div>
              <button onClick={() => setSelectedLog(null)} className="p-2 text-slate-300 hover:text-slate-600 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200 shadow-none hover:shadow-sm">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Clock size={12} /> Execution Timestamp
                    </label>
                    <p className="text-sm font-bold text-slate-800">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <UserCheck size={12} /> Authenticated User
                    </label>
                    <p className="text-sm font-bold text-slate-800">{selectedLog.username} (ID: {selectedLog.userId})</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Tag size={12} /> Action & Entity
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-indigo-600 text-white uppercase">{selectedLog.action}</span>
                      <span className="text-xs font-bold text-slate-600">{selectedLog.entityType}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <AlertCircle size={12} /> Reason for Change
                    </label>
                    <p className="text-xs text-slate-600 bg-amber-50 p-2 rounded-lg border border-amber-100/50 italic leading-relaxed">"{selectedLog.reason}"</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-50">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prior State (Snapshot)</label>
                    <div className="min-h-[100px] border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                      {renderValue(selectedLog.oldValue)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">New State (Snapshot)</label>
                    <div className="min-h-[100px] border border-indigo-100/30 rounded-2xl p-4 bg-indigo-50/30">
                      {renderValue(selectedLog.newValue)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-50 bg-slate-50/30 flex justify-end">
              <button 
                onClick={() => setSelectedLog(null)}
                className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
              >
                Close Trace
              </button>
            </div>
          </div>
        </div>
      )}
      
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
