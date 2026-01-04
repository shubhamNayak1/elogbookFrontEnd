
import React from 'react';
import { LogbookTemplate, User, UserRole } from '../types';
import { PlusCircle, Search, ClipboardList, Edit3 } from 'lucide-react';

interface LogbookEntryListProps {
  user: User;
  logbooks: LogbookTemplate[];
  navigateTo: (view: any, data?: any) => void;
}

const LogbookEntryList: React.FC<LogbookEntryListProps> = ({ user, logbooks, navigateTo }) => {
  const isAdmin = user.role === UserRole.ADMIN;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4 shadow-sm">
        <div className="flex-1 flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
          <Search size={20} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Search active templates..." 
            className="bg-transparent w-full outline-none text-sm font-medium text-slate-600 placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {logbooks.filter(l => l.status === 'ACTIVE').map((lb) => (
          <div 
            key={lb.id} 
            className="group bg-white p-6 rounded-3xl border border-slate-200 hover:border-indigo-600 hover:shadow-xl hover:shadow-indigo-500/5 transition-all relative overflow-hidden flex flex-col h-full"
          >
            {/* Template Header Overlay */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-[4rem] flex items-center justify-center -mr-4 -mt-4 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
              <ClipboardList size={28} />
            </div>
            
            <div className="relative flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Active Template</div>
                {isAdmin && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateTo('DESIGNER', lb);
                    }}
                    className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                    title="Edit Template Structure"
                  >
                    <Edit3 size={12} />
                  </button>
                )}
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">{lb.name}</h3>
              <p className="text-sm text-slate-500 mb-6 line-clamp-2 font-medium leading-relaxed">{lb.description || 'No description provided.'}</p>
            </div>

            <div className="relative pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                {lb.columns.length} Fields
              </div>
              <button 
                onClick={() => navigateTo('ENTRY_FORM', lb)}
                className="text-indigo-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
              >
                New Entry <PlusCircle size={14} />
              </button>
            </div>
          </div>
        ))}
        {logbooks.filter(l => l.status === 'ACTIVE').length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100">
            <ClipboardList size={48} className="mx-auto text-slate-200 mb-4" />
            <h3 className="text-slate-600 font-bold">No Active Logbooks</h3>
            <p className="text-slate-400 text-sm mt-1">Template definitions are required to begin data recording.</p>
            {isAdmin && (
              <button 
                onClick={() => navigateTo('DESIGNER')}
                className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
              >
                Create First Template
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LogbookEntryList;
