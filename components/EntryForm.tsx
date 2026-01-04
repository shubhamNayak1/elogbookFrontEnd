
import React, { useState } from 'react';
import { LogbookTemplate, ColumnType, LogbookEntry } from '../types';
import { api } from '../services/api';
import { Save, ChevronLeft, Info, AlertCircle, CheckCircle2 } from 'lucide-react';

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

  const validate = () => {
    const newErrors: Record<string, string> = {};
    template.columns.forEach(col => {
      if (col.isMandatory && (values[col.key] === undefined || values[col.key] === '')) {
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

  const handleFinalSave = () => {
    if (!reason.trim()) return;
    api.saveEntry({
      logbookId: template.id,
      values,
      status: 'SUBMITTED',
    }, reason);
    onSave();
  };

  const renderField = (col: any) => {
    const value = values[col.key] || '';
    const error = errors[col.key];

    switch (col.type) {
      case ColumnType.BOOLEAN:
        return (
          <div className="flex items-center gap-3">
            <input 
              type="checkbox" 
              checked={!!value}
              onChange={(e) => setValues({ ...values, [col.key]: e.target.checked })}
              className="w-5 h-5 rounded text-indigo-600"
            />
            <span className="text-sm font-medium text-slate-700">{col.label}</span>
          </div>
        );
      case ColumnType.DATE:
        return (
          <input 
            type="datetime-local" 
            value={value}
            onChange={(e) => setValues({ ...values, [col.key]: e.target.value })}
            className={`w-full px-4 py-3 rounded-xl border ${error ? 'border-red-500' : 'border-slate-200'}`}
          />
        );
      case ColumnType.NUMBER:
        return (
          <input 
            type="number" 
            value={value}
            onChange={(e) => setValues({ ...values, [col.key]: e.target.value })}
            className={`w-full px-4 py-3 rounded-xl border ${error ? 'border-red-500' : 'border-slate-200'}`}
          />
        );
      default:
        return (
          <input 
            type="text" 
            value={value}
            onChange={(e) => setValues({ ...values, [col.key]: e.target.value })}
            className={`w-full px-4 py-3 rounded-xl border ${error ? 'border-red-500' : 'border-slate-200'}`}
          />
        );
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <button onClick={onCancel} className="p-2 hover:bg-white rounded-full transition-colors">
          <ChevronLeft />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-800">{template.name}</h2>
          <p className="text-sm text-slate-500">Record a new eLogbook entry</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {template.columns.map(col => (
            <div key={col.id} className={`space-y-2 ${col.type === ColumnType.BOOLEAN ? 'md:col-span-1 pt-6' : ''}`}>
              {col.type !== ColumnType.BOOLEAN && (
                <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
                  {col.label}
                  {col.isMandatory && <span className="text-red-500">*</span>}
                </label>
              )}
              {renderField(col)}
              {errors[col.key] && (
                <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider flex items-center gap-1">
                  <AlertCircle size={10} /> {errors[col.key]}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-slate-100 flex justify-end gap-4">
          <button 
            onClick={onCancel}
            className="px-6 py-3 font-bold text-slate-500 hover:text-slate-800"
          >
            Discard
          </button>
          <button 
            onClick={handleInitialSave}
            className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
          >
            <CheckCircle2 size={18} /> Submit Entry
          </button>
        </div>
      </div>

      {/* Audit Reason Modal */}
      {showReasonModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white max-w-lg w-full rounded-3xl p-8 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 mb-6 text-indigo-600">
              <Info size={24} />
              <h3 className="text-xl font-bold">Verify & Sign Entry</h3>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl mb-6 text-xs text-slate-600 leading-relaxed italic border border-slate-100">
              "By signing this entry, I certify that the recorded information is accurate, complete, and contemporaneous to the task performed."
            </div>
            <p className="text-slate-700 font-bold text-sm mb-2">Comment / Reason for Entry</p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Routine morning check completed..."
              className="w-full h-24 p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none mb-6"
            />
            <div className="flex gap-4">
              <button 
                onClick={() => setShowReasonModal(false)}
                className="flex-1 py-4 font-bold text-slate-500 hover:text-slate-700"
              >
                Go Back
              </button>
              <button 
                disabled={!reason.trim()}
                onClick={handleFinalSave}
                className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 disabled:bg-slate-200 transition-all"
              >
                Confirm Signature
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntryForm;
