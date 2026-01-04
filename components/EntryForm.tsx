
import React, { useState, useEffect } from 'react';
import { LogbookTemplate, ColumnType, LogbookEntry } from '../types';
import { api } from '../services/api';
import { Save, ChevronLeft, Info, AlertCircle, CheckCircle2, Loader2, Clock, Calendar, Lock } from 'lucide-react';

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

  // Set initial time and ensure it's unchangeable
  useEffect(() => {
    const now = new Date();
    const date = now.toLocaleDateString();
    const time = now.toLocaleTimeString([], { hour12: false });
    const formattedTimestamp = `${date} ${time}`;
    
    setValues(prev => ({
      ...prev,
      'time': formattedTimestamp
    }));
  }, []);

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

  const handleInitialSave = () => {
    if (validate()) {
      setShowReasonModal(true);
    }
  };

  const handleFinalSave = async () => {
    if (!reason.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await api.saveEntry({
        logbookId: template.id,
        values,
        status: 'SUBMITTED',
      }, reason);
      onSave();
    } catch (err) {
      console.error("Entry save failed", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (col: any) => {
    const value = values[col.key] || '';
    const error = errors[col.key];

    if (col.isSystemManaged) {
      return (
        <div className="relative">
          <input 
            type="text" 
            value={value}
            readOnly
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 font-bold text-slate-700 cursor-not-allowed pl-10 pr-10"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex gap-1 text-indigo-500">
            <Clock size={14} />
          </div>
          <Lock size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" />
        </div>
      );
    }

    switch (col.type) {
      case ColumnType.BOOLEAN:
        return (
          <div className="flex items-center gap-3">
            <input 
              type="checkbox" 
              checked={!!value}
              onChange={(e) => setValues({ ...values, [col.key]: e.target.checked })}
              className="w-5 h-5 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
            />
            <span className="text-sm font-bold text-slate-700">{col.label}</span>
          </div>
        );
      case ColumnType.DATE:
      case ColumnType.DATETIME: // Support legacy/internal DATETIME as Date+Time
        return (
          <input 
            type="datetime-local" 
            value={value}
            onChange={(e) => setValues({ ...values, [col.key]: e.target.value })}
            className={`w-full px-4 py-3 rounded-xl border font-medium ${error ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
          />
        );
      case ColumnType.TIME: // Support legacy/internal TIME if needed
        return (
          <input 
            type="time" 
            value={value}
            onChange={(e) => setValues({ ...values, [col.key]: e.target.value })}
            className={`w-full px-4 py-3 rounded-xl border font-medium ${error ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
          />
        );
      case ColumnType.NUMBER:
        return (
          <input 
            type="number" 
            value={value}
            onChange={(e) => setValues({ ...values, [col.key]: e.target.value })}
            className={`w-full px-4 py-3 rounded-xl border font-medium ${error ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
          />
        );
      default:
        return (
          <input 
            type="text" 
            value={value}
            onChange={(e) => setValues({ ...values, [col.key]: e.target.value })}
            className={`w-full px-4 py-3 rounded-xl border font-medium ${error ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
          />
        );
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center gap-4">
        <button onClick={onCancel} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-800">
          <ChevronLeft />
        </button>
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">{template.name}</h2>
          <p className="text-sm text-slate-400 font-medium uppercase tracking-widest text-[10px]">Electronic Data Entry</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {template.columns.map(col => (
            <div key={col.id} className={`space-y-2 ${col.type === ColumnType.BOOLEAN ? 'md:col-span-1 pt-6' : ''}`}>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                {col.label}
                {col.isMandatory && !col.isSystemManaged && <span className="text-red-500">*</span>}
                {col.isSystemManaged && <span className="text-[8px] bg-indigo-100 text-indigo-600 px-1 rounded ml-1">SECURE</span>}
              </label>
              {renderField(col)}
              {errors[col.key] && (
                <p className="text-[9px] text-red-500 font-black uppercase tracking-widest flex items-center gap-1 mt-1">
                  <AlertCircle size={10} /> {errors[col.key]}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-slate-50 flex justify-end gap-4">
          <button 
            disabled={isSubmitting}
            onClick={onCancel}
            className="px-6 py-3 font-black text-xs uppercase tracking-widest text-slate-400 hover:text-slate-800"
          >
            Discard
          </button>
          <button 
            disabled={isSubmitting}
            onClick={handleInitialSave}
            className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all"
          >
            <CheckCircle2 size={16} /> Submit & Authenticate
          </button>
        </div>
      </div>

      {showReasonModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white max-w-lg w-full rounded-3xl p-8 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 mb-6 text-indigo-600">
              <div className="p-2 bg-indigo-50 rounded-lg"><Info size={24} /></div>
              <h3 className="text-xl font-black tracking-tight">Certification Signature</h3>
            </div>
            <div className="bg-slate-50 p-5 rounded-2xl mb-6 text-[11px] text-slate-500 leading-relaxed border border-slate-100">
              <p className="font-bold text-slate-800 mb-1 uppercase tracking-tighter">Legal Declaration:</p>
              "I confirm that this data entry accurately represents the true state of operations. I understand that this digital signature is the legal equivalent of my handwritten signature."
            </div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Entry Comments</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide context for this entry..."
              className="w-full h-24 p-4 rounded-2xl border border-slate-100 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none resize-none mb-6 text-sm font-medium"
            />
            <div className="flex gap-4">
              <button 
                disabled={isSubmitting}
                onClick={() => setShowReasonModal(false)}
                className="flex-1 py-4 font-black text-xs uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
              >
                Revision
              </button>
              <button 
                disabled={!reason.trim() || isSubmitting}
                onClick={handleFinalSave}
                className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 disabled:bg-slate-100 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                Apply Signature
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntryForm;
