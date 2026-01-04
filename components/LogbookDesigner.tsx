
import React, { useState } from 'react';
import { ColumnType, LogbookStatus, LogbookColumn, LogbookTemplate } from '../types';
import { api } from '../services/api';
import { Plus, Trash2, Save, X, MoveUp, MoveDown, Info } from 'lucide-react';

interface LogbookDesignerProps {
  onSave: () => void;
}

const LogbookDesigner: React.FC<LogbookDesignerProps> = ({ onSave }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [columns, setColumns] = useState<LogbookColumn[]>([]);
  const [reason, setReason] = useState('');
  const [showReasonModal, setShowReasonModal] = useState(false);

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

  const handleSave = () => {
    if (!name || columns.length === 0 || !reason) return;
    api.saveLogbook({
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
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Logbook Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Equipment Cleaning Log"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Description</label>
            <input 
              type="text" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="System or Area purpose"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              Column Definitions
              <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full uppercase tracking-widest">
                {columns.length} Total
              </span>
            </h3>
            <button 
              onClick={addColumn}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold text-sm transition-all"
            >
              <Plus size={16} /> Add Column
            </button>
          </div>

          <div className="space-y-3">
            {columns.map((col, idx) => (
              <div key={col.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap gap-4 items-end">
                <div className="flex gap-1 mb-auto pt-1">
                  <button onClick={() => moveColumn(idx, 'UP')} className="text-slate-400 hover:text-indigo-600"><MoveUp size={16}/></button>
                  <button onClick={() => moveColumn(idx, 'DOWN')} className="text-slate-400 hover:text-indigo-600"><MoveDown size={16}/></button>
                </div>
                
                <div className="flex-1 min-w-[200px] space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Label</label>
                  <input 
                    type="text" 
                    value={col.label}
                    onChange={(e) => updateColumn(col.id, { label: e.target.value, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>

                <div className="w-40 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Type</label>
                  <select 
                    value={col.type}
                    onChange={(e) => updateColumn(col.id, { type: e.target.value as ColumnType })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    {Object.values(ColumnType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-2 h-10">
                  <input 
                    type="checkbox" 
                    id={`mand_${col.id}`}
                    checked={col.isMandatory}
                    onChange={(e) => updateColumn(col.id, { isMandatory: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                  <label htmlFor={`mand_${col.id}`} className="text-xs font-bold text-slate-700">Required</label>
                </div>

                <button 
                  onClick={() => removeColumn(col.id)}
                  className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
            {columns.length === 0 && (
              <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                No columns defined. Click "Add Column" to begin.
              </div>
            )}
          </div>
        </div>

        <div className="pt-6 flex justify-end">
          <button 
            disabled={!name || columns.length === 0}
            onClick={() => setShowReasonModal(true)}
            className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 disabled:bg-slate-200 disabled:shadow-none transition-all"
          >
            <Save size={20} /> Save Template
          </button>
        </div>
      </div>

      {/* Audit Reason Modal */}
      {showReasonModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white max-w-lg w-full rounded-3xl p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-6 text-indigo-600">
              <Info size={24} />
              <h3 className="text-xl font-bold">Electronic Signature Required</h3>
            </div>
            <p className="text-slate-600 mb-6 text-sm leading-relaxed">
              In compliance with 21 CFR Part 11, you must provide a justification for creating or updating this Logbook Template.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for change (e.g., Initial creation, Update to SOP-123)..."
              className="w-full h-32 p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none mb-6"
            />
            <div className="flex gap-4">
              <button 
                onClick={() => setShowReasonModal(false)}
                className="flex-1 py-4 font-bold text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
              <button 
                disabled={!reason.trim()}
                onClick={handleSave}
                className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 disabled:bg-slate-200 transition-all"
              >
                Sign & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogbookDesigner;
