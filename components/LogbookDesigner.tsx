
import React, { useState, useEffect } from 'react';
import { ColumnType, LogbookStatus, LogbookColumn, LogbookTemplate } from '../types';
import { api } from '../services/api';
import { Plus, Trash2, Save, X, MoveUp, MoveDown, Info, Loader2, Database } from 'lucide-react';

interface LogbookDesignerProps {
  initialTemplate?: LogbookTemplate | null;
  onSave: () => void;
}

const LogbookDesigner: React.FC<LogbookDesignerProps> = ({ initialTemplate, onSave }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [columns, setColumns] = useState<LogbookColumn[]>([]);
  const [reason, setReason] = useState('');
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form when editing
  useEffect(() => {
    if (initialTemplate) {
      setName(initialTemplate.name);
      setDescription(initialTemplate.description);
      setColumns(initialTemplate.columns);
    } else {
      setName('');
      setDescription('');
      setColumns([]);
    }
  }, [initialTemplate]);

  const addColumn = () => {
    const newCol: LogbookColumn = {
      id: `col_${Date.now()}`,
      label: 'New Column',
      key: `col_${columns.length + 1}`,
      type: ColumnType.TEXT,
      isMandatory: true,
      displayOrder: columns.length,
    };
    setColumns([...columns, newCol]);
  };

  const removeColumn = (id: string) => {
    setColumns(columns.filter(c => c.id !== id));
  };

  const updateColumn = (id: string, updates: Partial<LogbookColumn>) => {
    setColumns(columns.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const moveColumn = (index: number, direction: 'UP' | 'DOWN') => {
    const newCols = [...columns];
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newCols.length) {
      [newCols[index], newCols[targetIndex]] = [newCols[targetIndex], newCols[index]];
      setColumns(newCols.map((c, i) => ({ ...c, displayOrder: i })));
    }
  };

  const handleSave = async () => {
    if (!name || columns.length === 0 || !reason || isSaving) return;
    
    setIsSaving(true);
    try {
      await api.saveLogbook({
        id: initialTemplate?.id, // Preserve ID if editing
        name,
        description,
        status: LogbookStatus.ACTIVE,
        columns
      }, reason);
      
      onSave();
      setName('');
      setDescription('');
      setColumns([]);
      setReason('');
      setShowReasonModal(false);
    } catch (err) {
      console.error("Save failed", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Database size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">{initialTemplate ? 'Update Logbook Template' : 'Create New Logbook Template'}</h2>
            <p className="text-xs text-slate-400 font-medium">Define the structure and metadata for GxP data collection</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logbook Identity</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Equipment Cleaning Log"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-sm transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Functional Scope</label>
            <input 
              type="text" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="System or Area purpose"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-sm transition-all"
            />
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              Schema Definitions
              <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full uppercase font-black tracking-widest">
                {columns.length} Nodes
              </span>
            </h3>
            <button 
              onClick={addColumn}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold text-xs transition-all shadow-sm"
            >
              <Plus size={14} /> Add Column
            </button>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
            {columns.map((col, idx) => (
              <div key={col.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-wrap gap-4 items-end animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex gap-1 mb-auto pt-1">
                  <button onClick={() => moveColumn(idx, 'UP')} className="p-1 text-slate-300 hover:text-indigo-600 transition-colors"><MoveUp size={14}/></button>
                  <button onClick={() => moveColumn(idx, 'DOWN')} className="p-1 text-slate-300 hover:text-indigo-600 transition-colors"><MoveDown size={14}/></button>
                </div>
                
                <div className="flex-1 min-w-[200px] space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Attribute Label</label>
                  <input 
                    type="text" 
                    value={col.label}
                    onChange={(e) => updateColumn(col.id, { label: e.target.value, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium"
                  />
                </div>

                <div className="w-40 space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Data Type</label>
                  <select 
                    value={col.type}
                    onChange={(e) => updateColumn(col.id, { type: e.target.value as ColumnType })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm appearance-none font-medium"
                  >
                    {Object.values(ColumnType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-2 h-10 px-2">
                  <input 
                    type="checkbox" 
                    id={`mand_${col.id}`}
                    checked={col.isMandatory}
                    onChange={(e) => updateColumn(col.id, { isMandatory: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                  />
                  <label htmlFor={`mand_${col.id}`} className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Mandatory</label>
                </div>

                <button 
                  onClick={() => removeColumn(col.id)}
                  className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            {columns.length === 0 && (
              <div className="py-16 text-center text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl">
                <Database size={40} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">Click "Add Column" to define the logbook structure</p>
              </div>
            )}
          </div>
        </div>

        <div className="pt-8 flex justify-end">
          <button 
            disabled={!name || columns.length === 0}
            onClick={() => setShowReasonModal(true)}
            className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 disabled:bg-slate-100 disabled:text-slate-300 disabled:shadow-none transition-all"
          >
            <Save size={18} /> {initialTemplate ? 'Apply Updates' : 'Commit Template'}
          </button>
        </div>
      </div>

      {/* Audit Reason Modal */}
      {showReasonModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white max-w-lg w-full rounded-3xl p-8 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 mb-6 text-indigo-600">
              <div className="p-2 bg-indigo-50 rounded-lg"><Info size={24} /></div>
              <h3 className="text-xl font-black tracking-tight">E-Signature Verification</h3>
            </div>
            <p className="text-slate-500 mb-6 text-sm leading-relaxed">
              Pursuant to <span className="text-slate-800 font-bold">21 CFR Part 11</span>, providing a justification is mandatory for this template {initialTemplate ? 'modification' : 'creation'}.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State the justification for this change..."
              className="w-full h-32 p-4 rounded-2xl border border-slate-100 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none resize-none mb-6 text-sm font-medium"
            />
            <div className="flex gap-4">
              <button 
                disabled={isSaving}
                onClick={() => setShowReasonModal(false)}
                className="flex-1 py-4 font-black text-xs uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
              >
                Go Back
              </button>
              <button 
                disabled={!reason.trim() || isSaving}
                onClick={handleSave}
                className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 disabled:bg-slate-100 transition-all flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Confirm & Sign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogbookDesigner;
