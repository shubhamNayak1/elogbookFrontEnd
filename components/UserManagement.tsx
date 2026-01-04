
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';
import { UserPlus, Search, ShieldCheck, UserCheck, Loader2, Info, CheckCircle2, AlertCircle } from 'lucide-react';

interface UserManagementProps {
  users: User[];
  onUpdate: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    role: UserRole.USER,
    reason: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const filteredUsers = users.filter(u => 
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.fullName || !formData.reason) return;
    
    setIsSaving(true);
    setError('');
    
    try {
      await api.saveUser({
        username: formData.username.toLowerCase().trim(),
        fullName: formData.fullName.trim(),
        role: formData.role
      }, formData.reason);
      
      setShowCreateModal(false);
      setFormData({ username: '', fullName: '', role: UserRole.USER, reason: '' });
      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Action Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 flex flex-col md:flex-row items-center gap-4 shadow-sm">
        <div className="flex-1 flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 w-full">
          <Search size={20} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Search personnel by name or ID..."
            className="bg-transparent w-full outline-none text-sm font-medium py-1"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all"
        >
          <UserPlus size={16} /> Provision User
        </button>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">System ID</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Access Level</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Creation Date</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xs">
                        {u.fullName.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm font-bold text-slate-800">{u.fullName}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <code className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">
                      {u.username}
                    </code>
                  </td>
                  <td className="px-8 py-5">
                    <div className={`
                      inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter
                      ${u.role === UserRole.ADMIN ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}
                    `}>
                      {u.role === UserRole.ADMIN ? <ShieldCheck size={12} /> : <UserCheck size={12} />}
                      {u.role}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-xs text-slate-500 font-medium">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'System Initial'}
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provisioning Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white max-w-xl w-full rounded-[2.5rem] p-10 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
                  <UserPlus size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Provision Personnel</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Access Control Management</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-slate-300 hover:text-slate-900 transition-colors"
              >
                <AlertCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Username (System ID)</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. asmith"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Permissions</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                  >
                    <option value={UserRole.USER}>Standard User</option>
                    <option value={UserRole.ADMIN}>Administrator</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Legal Name</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Alice Smith"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Justification for Access</label>
                <textarea 
                  required
                  placeholder="State the regulatory or operational need for this account..."
                  className="w-full h-24 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-2 text-xs font-bold">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-4 font-black text-xs uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Discard
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 disabled:bg-slate-100 transition-all flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  Authorize Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
