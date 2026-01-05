
import React, { useState, useEffect, useMemo } from 'react';
import { AppState, LogbookTemplate, LogbookEntry, LogbookColumn } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Filter, AlertCircle, Layers, LayoutGrid, Calendar, FileSpreadsheet } from 'lucide-react';

interface ReportingDashboardProps {
  state: AppState;
}

const ReportingDashboard: React.FC<ReportingDashboardProps> = ({ state }) => {
  const [selectedLogbookId, setSelectedLogbookId] = useState<string>(state.logbooks[0]?.id || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Get today's date in YYYY-MM-DD format for input restriction
  const today = new Date().toISOString().split('T')[0];

  const reportData = useMemo(() => {
    return state.entries.filter(e => {
      const matchesLogbook = e.logbookId === selectedLogbookId;
      if (!matchesLogbook) return false;

      const logTime = new Date(e.createdAt).getTime();
      const start = startDate ? new Date(startDate).getTime() : 0;
      const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : Infinity;
      
      return logTime >= start && logTime <= end;
    });
  }, [selectedLogbookId, state.entries, startDate, endDate]);

  const validateRange = () => {
    if (!startDate || !endDate) return "Please select both start and end dates for export.";
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    if (end > now) return "End date cannot be in the future.";
    if (start > now) return "Start date cannot be in the future.";
    if (end < start) return "End date cannot be before start date.";
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 31) return "Export range is limited to 1 month (31 days) for regulatory data sets.";
    return null;
  };

  const downloadCSV = () => {
    const error = validateRange();
    if (error) {
      alert(error);
      return;
    }

    const logbook = state.logbooks.find(l => l.id === selectedLogbookId);
    if (!logbook || reportData.length === 0) {
      alert("No data available to export for the selected range.");
      return;
    }

    setIsExporting(true);
    
    const metaHeaders = ["Entry ID", "Timestamp", "Signee", "Justification"];
    const colHeaders = logbook.columns.map(c => c.label);
    const headers = [...metaHeaders, ...colHeaders];
    
    const rows = reportData.map(entry => {
      const metaValues = [
        entry.id,
        new Date(entry.createdAt).toISOString(),
        entry.createdBy,
        `"${(entry.reason || '').replace(/"/g, '""')}"`
      ];
      
      const colValues = logbook.columns.map(col => {
        const val = entry.values[col.key];
        if (val === undefined || val === null) return "-";
        if (typeof val === 'boolean') return val ? "TRUE" : "FALSE";
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      
      return [...metaValues, ...colValues];
    });

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    link.setAttribute("href", url);
    link.setAttribute("download", `Report_${logbook.name.replace(/\s+/g, '_')}_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setIsExporting(false);
  };

  const selectedLogbook = state.logbooks.find(l => l.id === selectedLogbookId);

  const tableHeaderStructure = useMemo(() => {
    if (!selectedLogbook) return [];
    const groups: { name: string; cols: LogbookColumn[] }[] = [];
    selectedLogbook.columns.forEach(col => {
      const gName = col.groupName || "Independent";
      const existing = groups.find(g => g.name === gName);
      if (existing) {
        existing.cols.push(col);
      } else {
        groups.push({ name: gName, cols: [col] });
      }
    });
    return groups;
  }, [selectedLogbook]);

  const chartData = reportData.reduce((acc: any[], entry) => {
    const date = new Date(entry.createdAt).toLocaleDateString();
    const existing = acc.find(item => item.date === date);
    if (existing) existing.count += 1;
    else acc.push({ date, count: 1 });
    return acc;
  }, []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-20">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Filter size={20} /></div>
            <div className="flex-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Target Template</p>
              <select 
                value={selectedLogbookId} 
                onChange={(e) => setSelectedLogbookId(e.target.value)} 
                className="w-full md:w-64 bg-transparent font-bold text-slate-800 outline-none"
              >
                {state.logbooks.map(lb => <option key={lb.id} value={lb.id}>{lb.name}</option>)}
                {state.logbooks.length === 0 && <option>No Logbooks Available</option>}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={downloadCSV}
              disabled={isExporting || !startDate || !endDate || reportData.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-300 shadow-xl shadow-indigo-100 transition-all disabled:opacity-50"
            >
              <FileSpreadsheet size={16} /> Export CSV (Excel)
            </button>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Calendar size={10} /> Scope Start
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
              <Calendar size={10} /> Scope End
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
          <div className="col-span-1 lg:col-span-2 flex items-end">
            {(startDate && endDate) && (
              <div className="w-full p-2.5 bg-indigo-50/50 rounded-xl flex items-center gap-2 text-[10px] font-bold text-indigo-600 border border-indigo-100/30">
                <AlertCircle size={14} /> 
                Range restricted to 31 days max. Current scope: {reportData.length} records.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">Trend Analysis <span className="text-[10px] text-slate-400 font-medium">(Daily Submission Velocity)</span></h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px -5px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#4f46e5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Verified Data Records</h3>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{reportData.length} entries matching scope</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th colSpan={2} className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center border-r border-slate-200">System Metadata</th>
                {tableHeaderStructure.map(group => (
                  <th key={group.name} colSpan={group.cols.length} className="px-6 py-3 text-[10px] font-black text-indigo-600 uppercase tracking-widest text-center border-r border-slate-200 bg-indigo-50/30">
                    <span className="flex items-center justify-center gap-1">
                      {group.name === "Independent" ? <LayoutGrid size={10} /> : <Layers size={10} />}
                      {group.name}
                    </span>
                  </th>
                ))}
              </tr>
              <tr className="bg-white border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-r border-slate-100">Signee</th>
                {tableHeaderStructure.flatMap(group => group.cols).map(col => (
                  <th key={col.id} className="px-6 py-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {reportData.map((entry) => (
                <tr key={entry.id} className="hover:bg-indigo-50/20 transition-colors">
                  <td className="px-6 py-4 text-xs font-medium text-slate-500 whitespace-nowrap">{new Date(entry.createdAt).toLocaleString()}</td>
                  <td className="px-6 py-4 border-r border-slate-50"><span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{entry.createdBy}</span></td>
                  {tableHeaderStructure.flatMap(group => group.cols).map(col => (
                    <td key={col.id} className="px-6 py-4 text-sm text-slate-800">
                      {entry.values[col.key] === true ? '✓' : entry.values[col.key] === false ? '✗' : String(entry.values[col.key] || '-')}
                    </td>
                  ))}
                </tr>
              ))}
              {reportData.length === 0 && (
                <tr><td colSpan={100} className="px-6 py-20 text-center text-slate-300 font-bold uppercase text-xs tracking-widest">No valid records found in current scope</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportingDashboard;
