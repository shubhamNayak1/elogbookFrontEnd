
import React from 'react';
import { LogbookTemplate } from '../types';
import { PlusCircle, Search, ClipboardList } from 'lucide-react';

interface LogbookEntryListProps {
  logbooks: LogbookTemplate[];
  navigateTo: (view: any, data?: any) => void;
}

const LogbookEntryList: React.FC<LogbookEntryListProps> = ({ logbooks, navigateTo }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4">
        <div className="flex-1 flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
          <Search size={20} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Search templates..." 
            className="bg-transparent w-full outline-none text-sm font-medium"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {logbooks.filter(l => l.status === 'ACTIVE').map((lb) => (
          <div 
            key={lb.id} 
            className="group bg-white p-6 rounded-3xl border border-slate-200 hover:border-indigo-600 hover:shadow-xl hover:shadow-indigo-500/5 transition-all cursor-pointer relative overflow-hidden"
            onClick={() => navigateTo('ENTRY_FORM', lb)}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-[4rem] flex items-center justify-center -mr-4 -mt-4 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
              <ClipboardList size={28} />
            </div>
            
            <div className="relative">
              <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">Active Template</div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">{lb.name}</h3>
              <p className="text-sm text-slate-500 mb-6 line-clamp-2">{lb.description || 'No description provided.'}</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="text-[10px] text-slate-400 font-bold uppercase">
                  {lb.columns.length} Fields
                </div>
                <button className="text-indigo-600 font-bold text-xs flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  New Entry <PlusCircle size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {logbooks.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <ClipboardList size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-slate-600 font-bold">No Active Logbooks</h3>
            <p className="text-slate-400 text-sm mt-1">Contact your Administrator to create templates.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogbookEntryList;
