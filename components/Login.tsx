
import React, { useState } from 'react';
import { api, MOCK_USERS } from '../services/api';
import { ShieldAlert, LogIn, CheckCircle2 } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [selectedUsername, setSelectedUsername] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUsername) {
      api.login(selectedUsername);
      onLogin();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 text-white rounded-3xl shadow-xl shadow-indigo-200 mb-6">
            <ShieldAlert size={40} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">PharmaTrack</h1>
          <p className="text-slate-500 mt-2">Next-Gen GxP eLogbook System</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Select User Role</label>
              <div className="grid grid-cols-1 gap-3">
                {MOCK_USERS.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => setSelectedUsername(user.username)}
                    className={`
                      p-4 rounded-2xl border-2 text-left transition-all relative
                      ${selectedUsername === user.username 
                        ? 'border-indigo-600 bg-indigo-50' 
                        : 'border-slate-100 hover:border-slate-200'}
                    `}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-900">{user.fullName}</p>
                        <p className="text-xs text-slate-500 uppercase tracking-wider mt-0.5">{user.role}</p>
                      </div>
                      {selectedUsername === user.username && (
                        <CheckCircle2 size={24} className="text-indigo-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={!selectedUsername}
              className={`
                w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all
                ${selectedUsername 
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
              `}
            >
              <LogIn size={20} />
              Access Secure System
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100">
            <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest justify-center">
              <span>ALCOA+ Principles</span>
              <span>•</span>
              <span>21 CFR PART 11</span>
              <span>•</span>
              <span>Annex 11</span>
            </div>
          </div>
        </div>
        
        <p className="text-center text-slate-400 text-xs mt-8">
          Authorized personnel only. All access and actions are monitored and recorded in the immutable audit trail.
        </p>
      </div>
    </div>
  );
};

export default Login;
