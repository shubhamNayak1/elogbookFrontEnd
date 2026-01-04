
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import { ShieldAlert, LogIn, CheckCircle2, Loader2 } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUsername, setSelectedUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      const state = await api.getState();
      setAvailableUsers(state.users);
      setIsLoading(false);
    };
    fetchUsers();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUsername && !isLoggingIn) {
      setIsLoggingIn(true);
      const user = await api.login(selectedUsername);
      if (user) {
        onLogin();
      } else {
        setIsLoggingIn(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 text-white rounded-3xl shadow-xl shadow-indigo-200 mb-6">
            <ShieldAlert size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">PharmaTrack</h1>
          <p className="text-slate-500 mt-2 font-medium">Enterprise eLogbook Infrastructure</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Select Credentials</label>
              
              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-4 text-slate-400">
                  <Loader2 className="animate-spin" size={24} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Initializing Secure Node...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-hide">
                  {availableUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      disabled={isLoggingIn}
                      onClick={() => setSelectedUsername(user.username)}
                      className={`
                        p-4 rounded-2xl border-2 text-left transition-all relative
                        ${selectedUsername === user.username 
                          ? 'border-indigo-600 bg-indigo-50 shadow-sm' 
                          : 'border-slate-50 hover:border-slate-200 bg-slate-50/50'}
                        ${isLoggingIn ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-bold text-slate-900">{user.fullName}</p>
                          <p className="text-[10px] text-indigo-500 uppercase font-bold tracking-wider mt-0.5">{user.role}</p>
                        </div>
                        {selectedUsername === user.username && (
                          <CheckCircle2 size={24} className="text-indigo-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!selectedUsername || isLoggingIn || isLoading}
              className={`
                w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all
                ${selectedUsername && !isLoggingIn 
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
              `}
            >
              {isLoggingIn ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  Access Secure System
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100">
            <div className="flex items-center gap-4 text-[9px] text-slate-400 font-black uppercase tracking-widest justify-center">
              <span>Audit Ready</span>
              <span>•</span>
              <span>Validated</span>
              <span>•</span>
              <span>Encrypted</span>
            </div>
          </div>
        </div>
        
        <p className="text-center text-slate-400 text-[10px] mt-8 leading-relaxed max-w-xs mx-auto">
          Warning: Unauthorized access to this system is strictly prohibited and subject to criminal prosecution.
        </p>
      </div>
    </div>
  );
};

export default Login;
