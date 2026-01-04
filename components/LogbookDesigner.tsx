
import React, { useState, useEffect } from 'react';
import { ColumnType, LogbookStatus, LogbookColumn, LogbookTemplate } from '../types';
import { api } from '../services/api';
import { Plus, Trash2, Save, X, MoveUp, MoveDown, Info, Loader2, Database, Lock } from 'lucide-react';

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

  // System-enforced columns - using 'Time' label but 'DATE' type as requested
  const getSystemColumns = (): LogbookColumn[] => [
    {
      id: 'sys_col_time',
      label: 'Time',
      key: 'time',
      type: ColumnType.DATE,
      isMandatory: true,
      displayOrder: -1,
      isSystemManaged: true
    }
  ];

  // Initialize form when editing or creating
  useEffect(() => {
    if (initialTemplate) {
      setName(initialTemplate.name);
      setDescription(initialTemplate.description);
      const existingCols = initialTemplate.columns;
      const hasTime = existingCols.some(c => c.key === 'time');
      if (!hasTime) {
        setColumns([...getSystemColumns(), ...existingCols]);
      } else {
        // Migration: ensure existing time columns use the specified label and type if they are system managed
        const updatedCols = existingCols.map(c => 
          c.key === 'time' && c.isSystemManaged ? { ...c, label: 'Time', type: ColumnType.DATE } : c
        );
        setColumns(updatedCols);
      }
    } else {
      setName('');
      setDescription('');
      setColumns(getSystemColumns());
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
    const col = columns.find(c => c.id === id);
    if (col?.isSystemManaged) return;
    setColumns(columns.filter(c => c.id !== id));
  };

  const updateColumn = (id: string, updates: Partial<LogbookColumn>) => {
    setColumns(columns.map(c => {
      if (c.id === id) {
        if (c.isSystemManaged) return c;
        return { ...c, ...updates };
      }
      return c;
    }));
  };

  const moveColumn = (index: number, direction: 'UP' | 'DOWN') => {
    const newCols = [...columns];
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    
    if (newCols[index].isSystemManaged || (targetIndex >= 0 && targetIndex < newCols.length && newCols[targetIndex].isSystemManaged)) {
      return; 
    }

    if (targetIndex >= 0 && targetIndex < newCols.length) {
      [newCols[index], newCols[targetIndex]] = [newCols[targetIndex], newCols[index]];
      setColumns(newCols.map((c, i) => ({ ...c, displayOrder: c.isSystemManaged ? -1 : i })));
    }
  };

  const handleSave = async () => {
    if (!name || columns.length === 0 || !reason || isSaving) return;
    
    setIsSaving(true);
    try {
      await api.saveLogbook({
        id: initialTemplate?.id,
        name,
        description,
        status: LogbookStatus.ACTIVE,
        columns: columns.sort((a, b) => a.displayOrder - b.displayOrder)
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

  // Filter out TIME and DATETIME from the selection as they are deprecated in the UI
  const allowedColumnTypes = Object.values(ColumnType).filter(
    type => type !== ColumnType.TIME && type !== ColumnType.DATETIME
  );

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
              <div key={col.id} className={`p-4 rounded-2xl border flex flex-wrap gap-4 items-end animate-in fade-in slide-in-from-top-2 duration-200 ${col.isSystemManaged ? 'bg-slate-50 border-slate-200 opacity-80' : 'bg-white border-slate-100'}`}>
                <div className="flex gap-1 mb-auto pt-1">
                  {!col.isSystemManaged && (
                    <>
                      <button onClick={() => moveColumn(idx, 'UP')} className="p-1 text-slate-300 hover:text-indigo-600 transition-colors"><MoveUp size={14}/></button>
                      <button onClick={() => moveColumn(idx, 'DOWN')} className="p-1 text-slate-300 hover:text-indigo-600 transition-colors"><MoveDown size={14}/></button>
                    </>
                  )}
                  {col.isSystemManaged && (
                    <div className="p-1 text-indigo-400" title="Locked by System">
                      <Lock size={14} />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-[200px] space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                    Attribute Label {col.isSystemManaged && <span className="text-[8px] bg-indigo-100 text-indigo-600 px-1 rounded">SYSTEM</span>}
                  </label>
                  <input 
                    type="text" 
                    value={col.label}
                    disabled={col.isSystemManaged}
                    onChange={(e) => updateColumn(col.id, { label: e.target.value, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                    className={`w-full px-3 py-2 rounded-lg border text-sm font-medium ${col.isSystemManaged ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed' : 'bg-white border-slate-200'}`}
                  />
                </div>

                <div className="w-40 space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Data Type</label>
                  <select 
                    value={col.type}
                    disabled={col.isSystemManaged}
                    onChange={(e) => updateColumn(col.id, { type: e.target.value as ColumnType })}
                    className={`w-full px-3 py-2 rounded-lg border text-sm appearance-none font-medium ${col.isSystemManaged ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed' : 'bg-white border-slate-200'}`}
                  >
                    {allowedColumnTypes.map(t => (
                      <option key={t} value={t}>{t === ColumnType.DATE ? 'DATE + TIME' : t}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 h-10 px-2">
                  <input 
                    type="checkbox" 
                    id={`mand_${col.id}`}
                    checked={col.isMandatory}
                    disabled={col.isSystemManaged}
                    onChange={(e) => updateColumn(col.id, { isMandatory: e.target.checked })}
                    className={`w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 ${col.isSystemManaged ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                  <label htmlFor={`mand_${col.id}`} className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Mandatory</label>
                </div>

                {!col.isSystemManaged ? (
                  <button 
                    onClick={() => removeColumn(col.id)}
                    className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                ) : (
                  <div className="p-2.5 text-slate-200">
                    <Trash2 size={18} className="opacity-30" />
                  </div>
                )}
              </div>
            ))}
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
