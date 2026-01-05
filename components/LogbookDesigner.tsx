
import React, { useState, useEffect, useMemo } from 'react';
import { ColumnType, LogbookStatus, LogbookColumn, LogbookTemplate } from '../types';
import { api } from '../services/api';
import { Plus, Trash2, Save, X, MoveUp, MoveDown, Info, Loader2, Database, Lock, Layers, LayoutGrid, ListPlus } from 'lucide-react';

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

  // Local state to track the raw text of dropdown options while typing
  // This prevents the "stolen comma" bug where split/join deletes trailing commas
  const [rawOptions, setRawOptions] = useState<Record<string, string>>({});

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

  useEffect(() => {
    if (initialTemplate) {
      setName(initialTemplate.name);
      setDescription(initialTemplate.description);
      const existingCols = initialTemplate.columns;
      
      // Initialize raw options map for existing dropdowns
      const initialRaw: Record<string, string> = {};
      existingCols.forEach(c => {
        if (c.type === ColumnType.DROPDOWN && c.options) {
          initialRaw[c.id] = c.options.join(', ');
        }
      });
      setRawOptions(initialRaw);

      const hasTime = existingCols.some(c => c.key === 'time');
      if (!hasTime) {
        setColumns([...getSystemColumns(), ...existingCols]);
      } else {
        const updatedCols = existingCols.map(c => 
          c.key === 'time' && c.isSystemManaged ? { ...c, label: 'Time', type: ColumnType.DATE } : c
        );
        setColumns(updatedCols);
      }
    } else {
      setName('');
      setDescription('');
      setColumns(getSystemColumns());
      setRawOptions({});
    }
  }, [initialTemplate]);

  const addColumn = (groupName?: string) => {
    const newCol: LogbookColumn = {
      id: `col_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      label: 'New Column',
      key: `col_${columns.length + 1}`,
      type: ColumnType.TEXT,
      isMandatory: true,
      displayOrder: columns.length,
      groupName: groupName || undefined,
      options: []
    };
    setColumns([...columns, newCol]);
  };

  const removeColumn = (id: string) => {
    const col = columns.find(c => c.id === id);
    if (col?.isSystemManaged) return;
    setColumns(columns.filter(c => c.id !== id));
    setRawOptions(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
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
    if (newCols[index].isSystemManaged || (targetIndex >= 0 && targetIndex < newCols.length && newCols[targetIndex].isSystemManaged)) return;

    if (targetIndex >= 0 && targetIndex < newCols.length) {
      [newCols[index], newCols[targetIndex]] = [newCols[targetIndex], newCols[index]];
      setColumns(newCols.map((c, i) => ({ ...c, displayOrder: c.isSystemManaged ? -1 : i })));
    }
  };

  const handleSave = async () => {
    if (!name || columns.length === 0 || !reason || isSaving) return;
    setIsSaving(true);
    
    // Final cleanup of options before saving
    const finalColumns = columns.map(col => {
      if (col.type === ColumnType.DROPDOWN) {
        const raw = rawOptions[col.id] || "";
        const cleanOptions = raw.split(',')
          .map(s => s.trim())
          .filter(s => s !== "");
        return { ...col, options: cleanOptions };
      }
      return col;
    }).sort((a, b) => a.displayOrder - b.displayOrder);

    try {
      await api.saveLogbook({
        id: initialTemplate?.id,
        name,
        description,
        status: LogbookStatus.ACTIVE,
        columns: finalColumns
      }, reason);
      onSave();
    } catch (err) {
      console.error("Save failed", err);
    } finally {
      setIsSaving(false);
    }
  };

  const allowedColumnTypes = Object.values(ColumnType).filter(
    type => type !== ColumnType.TIME && type !== ColumnType.DATETIME
  );

  const groupedData = useMemo(() => {
    const groups: Record<string, LogbookColumn[]> = { "__independent": [] };
    columns.forEach(col => {
      if (col.groupName) {
        if (!groups[col.groupName]) groups[col.groupName] = [];
        groups[col.groupName].push(col);
      } else {
        groups["__independent"].push(col);
      }
    });
    return groups;
  }, [columns]);

  const addGroup = () => {
    const gName = prompt("Enter Group Name:");
    if (gName && gName.trim()) {
      addColumn(gName.trim());
    }
  };

  const renameGroup = (oldName: string) => {
    const newName = prompt("Rename Group to:", oldName);
    if (newName && newName.trim() && newName !== oldName) {
      setColumns(columns.map(c => c.groupName === oldName ? { ...c, groupName: newName.trim() } : c));
    }
  };

  const deleteGroup = (groupName: string) => {
    if (confirm(`Delete group "${groupName}" and all its columns?`)) {
      setColumns(columns.filter(c => c.groupName !== groupName));
    }
  };

  const renderColumnRow = (col: LogbookColumn, idx: number) => (
    <div key={col.id} className={`p-4 rounded-2xl border animate-in fade-in slide-in-from-top-2 duration-200 ${col.isSystemManaged ? 'bg-slate-50 border-slate-200 opacity-80' : 'bg-white border-slate-100 shadow-sm'}`}>
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex gap-1 mb-auto pt-1">
          {!col.isSystemManaged && (
            <>
              <button onClick={() => moveColumn(columns.findIndex(c => c.id === col.id), 'UP')} className="p-1 text-slate-300 hover:text-indigo-600 transition-colors"><MoveUp size={14}/></button>
              <button onClick={() => moveColumn(columns.findIndex(c => c.id === col.id), 'DOWN')} className="p-1 text-slate-300 hover:text-indigo-600 transition-colors"><MoveDown size={14}/></button>
            </>
          )}
          {col.isSystemManaged && <div className="p-1 text-indigo-400"><Lock size={14} /></div>}
        </div>
        
        <div className="flex-1 min-w-[180px] space-y-1">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Attribute Label</label>
          <input 
            type="text" 
            value={col.label}
            disabled={col.isSystemManaged}
            onChange={(e) => updateColumn(col.id, { label: e.target.value, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
            className={`w-full px-3 py-2 rounded-lg border text-sm font-medium ${col.isSystemManaged ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed' : 'bg-white border-slate-200'}`}
          />
        </div>

        <div className="w-36 space-y-1">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Type</label>
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
            className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
          />
          <label htmlFor={`mand_${col.id}`} className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Mandatory</label>
        </div>

        {!col.isSystemManaged && (
          <button onClick={() => removeColumn(col.id)} className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {col.type === ColumnType.DROPDOWN && !col.isSystemManaged && (
        <div className="mt-4 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50 space-y-2">
          <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1">
            <ListPlus size={10} /> Dropdown Options (Comma separated)
          </label>
          <input 
            type="text" 
            placeholder="Option 1, Option 2, Option 3..."
            value={rawOptions[col.id] || ''}
            onChange={(e) => {
              const val = e.target.value;
              // Allow users to type commas freely in local state
              setRawOptions(prev => ({ ...prev, [col.id]: val }));
              
              // Also sync with column state for previewing (but don't delete empty strings yet)
              const cleanArray = val.split(',').map(s => s.trim()).filter(s => s !== "");
              updateColumn(col.id, { options: cleanArray });
            }}
            className="w-full px-3 py-2 bg-white border border-indigo-100 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <p className="text-[9px] text-slate-400 italic">Example: Pass, Fail, N/A</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Database size={20} /></div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">{initialTemplate ? 'Edit Logbook' : 'New Logbook'}</h2>
              <p className="text-xs text-slate-400 font-medium tracking-tight">Design structural hierarchy for GxP data capture</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addGroup} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-bold text-xs transition-all">
              <Layers size={14} /> New Group
            </button>
            <button onClick={() => addColumn()} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold text-xs transition-all shadow-lg shadow-indigo-100">
              <Plus size={14} /> Add Independent Column
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Equipment Log" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Purpose" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium" />
          </div>
        </div>

        <div className="space-y-8 pt-4">
          {groupedData["__independent"].length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <LayoutGrid size={14} /> Independent Columns
              </h3>
              <div className="space-y-3">
                {groupedData["__independent"].map((col, idx) => renderColumnRow(col, idx))}
              </div>
            </div>
          )}

          {(Object.entries(groupedData) as [string, LogbookColumn[]][]).map(([groupName, groupCols]) => {
            if (groupName === "__independent") return null;
            return (
              <div key={groupName} className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="font-black text-indigo-600 text-sm uppercase tracking-widest flex items-center gap-2">
                    <Layers size={14} /> {groupName}
                  </h3>
                  <div className="flex gap-2">
                    <button onClick={() => addColumn(groupName)} className="p-1.5 text-indigo-600 hover:bg-white rounded-lg transition-all" title="Add to group">
                      <Plus size={16} />
                    </button>
                    <button onClick={() => renameGroup(groupName)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-all" title="Rename group">
                      <MoveUp size={14} className="rotate-90" />
                    </button>
                    <button onClick={() => deleteGroup(groupName)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  {groupCols.map((col, idx) => renderColumnRow(col, idx))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-8 flex justify-end">
          <button disabled={!name || columns.length === 0} onClick={() => setShowReasonModal(true)} className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 disabled:bg-slate-100 disabled:text-slate-300 disabled:shadow-none transition-all">
            <Save size={18} /> Commit Changes
          </button>
        </div>
      </div>

      {showReasonModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white max-w-lg w-full rounded-3xl p-8 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 mb-6 text-indigo-600">
              <div className="p-2 bg-indigo-50 rounded-lg"><Info size={24} /></div>
              <h3 className="text-xl font-black tracking-tight">E-Signature Justification</h3>
            </div>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for modification..." className="w-full h-32 p-4 rounded-2xl border border-slate-100 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none resize-none mb-6 text-sm font-medium" />
            <div className="flex gap-4">
              <button disabled={isSaving} onClick={() => setShowReasonModal(false)} className="flex-1 py-4 font-black text-xs uppercase tracking-widest text-slate-400">Cancel</button>
              <button disabled={!reason.trim() || isSaving} onClick={handleSave} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 flex items-center justify-center gap-2">
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save & Sign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogbookDesigner;
