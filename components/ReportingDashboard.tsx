
import React, { useState, useEffect } from 'react';
import { AppState, LogbookTemplate, LogbookEntry } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Search, Filter, Download, Sparkles, AlertCircle } from 'lucide-react';
import { geminiService } from '../services/gemini';

interface ReportingDashboardProps {
  state: AppState;
}

const ReportingDashboard: React.FC<ReportingDashboardProps> = ({ state }) => {
  const [selectedLogbookId, setSelectedLogbookId] = useState<string>(state.logbooks[0]?.id || '');
  const [reportData, setReportData] = useState<LogbookEntry[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const filtered = state.entries.filter(e => e.logbookId === selectedLogbookId);
    setReportData(filtered);
    setAiAnalysis('');
  }, [selectedLogbookId, state.entries]);

  const runAIAnalysis = async () => {
    const logbook = state.logbooks.find(l => l.id === selectedLogbookId);
    if (!logbook || reportData.length === 0) return;
    
    setIsAnalyzing(true);
    const result = await geminiService.generateReportSummary(logbook, reportData);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  const selectedLogbook = state.logbooks.find(l => l.id === selectedLogbookId);

  // Group by date for chart
  const chartData = reportData.reduce((acc: any[], entry) => {
    const date = new Date(entry.createdAt).toLocaleDateString();
    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ date, count: 1 });
    }
    return acc;
  }, []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-8">
      {/* Header & Select */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Filter size={20} />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Target Logbook</p>
            <select 
              value={selectedLogbookId}
              onChange={(e) => setSelectedLogbookId(e.target.value)}
              className="w-full md:w-64 bg-transparent font-bold text-slate-800 outline-none"
            >
              {state.logbooks.map(lb => (
                <option key={lb.id} value={lb.id}>{lb.name}</option>
              ))}
              {state.logbooks.length === 0 && <option>No Logbooks Available</option>}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 text-slate-600 font-bold text-xs hover:bg-slate-50 rounded-xl transition-colors">
            <Download size={16} /> Export CSV
          </button>
          <button 
            onClick={runAIAnalysis}
            disabled={isAnalyzing || reportData.length === 0}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 disabled:bg-slate-300 transition-all"
          >
            <Sparkles size={16} /> {isAnalyzing ? 'Analyzing...' : 'AI Insights'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800">Entry Velocity (Last 30 Days)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#4f46e5" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Panel */}
        <div className="bg-indigo-900 text-white p-8 rounded-3xl shadow-xl shadow-indigo-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 text-indigo-500 opacity-20 group-hover:scale-110 transition-transform">
            <Sparkles size={120} />
          </div>
          <div className="relative">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              Gemini AI Auditor
              <span className="text-[10px] bg-indigo-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">Experimental</span>
            </h3>
            {aiAnalysis ? (
              <div className="text-indigo-100 text-sm leading-relaxed prose prose-invert overflow-y-auto max-h-[300px] scrollbar-hide">
                {aiAnalysis}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-center">
                <AlertCircle className="mb-4 text-indigo-400" size={40} />
                <p className="text-indigo-200 text-sm">
                  Click the AI Insights button to generate a compliance audit and data trend summary.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Detailed Records</h3>
          <span className="text-xs font-bold text-slate-400 uppercase">{reportData.length} Entries Found</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Timestamp</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Created By</th>
                {selectedLogbook?.columns.map(col => (
                  <th key={col.id} className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportData.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-xs font-medium text-slate-600 whitespace-nowrap">
                    {new Date(entry.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-indigo-600 uppercase">
                      {entry.createdBy}
                    </span>
                  </td>
                  {selectedLogbook?.columns.map(col => (
                    <td key={col.id} className="px-6 py-4 text-sm text-slate-800">
                      {String(entry.values[col.key] || '-')}
                    </td>
                  ))}
                </tr>
              ))}
              {reportData.length === 0 && (
                <tr>
                  <td colSpan={100} className="px-6 py-12 text-center text-slate-400">
                    No records match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportingDashboard;
