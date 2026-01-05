
import React, { useState, useEffect, useMemo } from 'react';
import { LogbookTemplate, ColumnType, LogbookEntry, LogbookColumn } from '../types';
import { api } from '../services/api';
import { Save, ChevronLeft, Info, AlertCircle, CheckCircle2, Loader2, Clock, Calendar, Lock, Layers } from 'lucide-react';

interface EntryFormProps {
  template: LogbookTemplate;
  onSave: () => void;
  onCancel: () => void;
}

const EntryForm: React.FC<EntryFormProps> = ({ template, onSave, onCancel }) => {
  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [reason, setReason] = useState('');
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const now = new Date();
    const formattedTimestamp = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour12: false })}`;
    setValues(prev => ({ ...prev, 'time': formattedTimestamp }));
  }, []);

  const groupedColumns = useMemo(() => {
    const groups: Record<string, LogbookColumn[]> = { "__independent": [] };
    template.columns.forEach(col => {
      if (col.groupName) {
        if (!groups[col.groupName]) groups[col.groupName] = [];
        groups[col.groupName].push(col);
      } else {
        groups["__independent"].push(col);
      }
    });
    return groups;
  }, [template]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    template.columns.forEach(col => {
      if (col.isMandatory && !col.isSystemManaged && (values[col.key] === undefined || values[col.key] === '')) {
        newErrors[col.key] = `${col.label} is required`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFinalSave = async () => {
    if (!reason.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await api.saveEntry({ logbookId: template.id, values, status: 'SUBMITTED' }, reason);
      onSave();
    } catch (err) {
      console.error("Entry save failed", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (col: LogbookColumn) => {
    const value = values[col.key] || '';
    const error = errors[col.key];

    if (col.isSystemManaged) {
      return (
        <div className="relative">
          <input type="text" value={value} readOnly className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 font-bold text-slate-700 cursor-not-allowed pl-10" />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500"><Clock size={14} /></div>
          <Lock size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" />
        </div>
      );
    }

    switch (col.type) {
      case ColumnType.BOOLEAN:
        return (
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={!!value} onChange={(e) => setValues({ ...values, [col.key]: e.target.checked })} className="w-5 h-5 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500" />
            <span className="text-sm font-bold text-slate-700">{col.label}</span>
          </div>
        );
      case ColumnType.NUMBER:
        return <input type="number" value={value} onChange={(e) => setValues({ ...values, [col.key]: e.target.value })} className={`w-full px-4 py-3 rounded-xl border font-medium ${error ? 'border-red-500 bg-red-50' : 'border-slate-200'}`} />;
      case ColumnType.DATE:
        return <input type="datetime-local" value={value} onChange={(e) => setValues({ ...values, [col.key]: e.target.value })} className={`w-full px-4 py-3 rounded-xl border font-medium ${error ? 'border-red-500 bg-red-50' : 'border-slate-200'}`} />;
      case ColumnType.DROPDOWN:
        // Filter out empty options that might have been accidentally saved
        const cleanOptions = col.options?.filter(opt => opt.trim() !== "") || [];
        return (
          <select 
            value={value} 
            onChange={(e) => setValues({ ...values, [col.key]: e.target.value })} 
            className={`w-full px-4 py-3 rounded-xl border font-medium appearance-none bg-no-repeat bg-[right_1rem_center] ${error ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-white'}`}
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")` }}
          >
            <option value="">Select an option...</option>
            {cleanOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );
      default:
        return <input type="text" value={value} onChange={(e) => setValues({ ...values, [col.key]: e.target.value })} className={`w-full px-4 py-3 rounded-xl border font-medium ${error ? 'border-red-500 bg-red-50' : 'border-slate-200'}`} />;
    }
  };

  const renderGroup = (groupName: string, cols: LogbookColumn[]) => (
    <div key={groupName} className={groupName === "__independent" ? "space-y-6" : "bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100 space-y-6 mt-4"}>
      {groupName !== "__independent" && (
        <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 mb-2 px-2">
          <Layers size={14} /> {groupName}
        </h3>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cols.map(col => (
          <div key={col.id} className={`space-y-2 ${col.type === ColumnType.BOOLEAN ? 'md:col-span-1 flex items-center pt-4' : ''}`}>
            <div className="flex flex-col w-full space-y-2">
              {col.type !== ColumnType.BOOLEAN && (
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  {col.label} {col.isMandatory && !col.isSystemManaged && <span className="text-red-500">*</span>}
                </label>
              )}
              {renderField(col)}
              {errors[col.key] && <p className="text-[9px] text-red-500 font-black uppercase tracking-widest flex items-center gap-1 mt-1"><AlertCircle size={10} /> {errors[col.key]}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300 pb-20">
      <div className="flex items-center gap-4">
        <button onClick={onCancel} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-800"><ChevronLeft /></button>
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">{template.name}</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Validated Data Entry Interface</p>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-10">
        {groupedColumns["__independent"].length > 0 && renderGroup("__independent", groupedColumns["__independent"])}
        {(Object.entries(groupedColumns) as [string, LogbookColumn[]][]).map(([name, cols]) => name !== "__independent" && renderGroup(name, cols))}

        <div className="pt-8 border-t border-slate-50 flex justify-end gap-4">
          <button disabled={isSubmitting} onClick={onCancel} className="px-6 py-3 font-black text-xs uppercase tracking-widest text-slate-400">Discard</button>
          <button disabled={isSubmitting} onClick={() => validate() && setShowReasonModal(true)} className="flex items-center gap-2 px-10 py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all"><CheckCircle2 size={18} /> Sign Entry</button>
        </div>
      </div>

      {showReasonModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white max-w-lg w-full rounded-[2.5rem] p-10 shadow-2xl border border-slate-100">
            <h3 className="text-xl font-black tracking-tight mb-4 text-indigo-600">Attestation Signature</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">I certify that the information entered is accurate, complete, and performed in accordance with GxP standards.</p>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Enter signature comments..." className="w-full h-24 p-4 rounded-2xl border border-slate-100 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none resize-none mb-6 text-sm" />
            <div className="flex gap-4">
              <button disabled={isSubmitting} onClick={() => setShowReasonModal(false)} className="flex-1 py-4 font-black text-xs uppercase tracking-widest text-slate-400">Back</button>
              <button disabled={!reason.trim() || isSubmitting} onClick={handleFinalSave} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 flex items-center justify-center gap-2">
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Confirm & Sign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntryForm;
