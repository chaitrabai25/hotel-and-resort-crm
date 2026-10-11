import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Hotel, Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Admin@12345');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-400 text-white shadow-xl shadow-brand-500/20 mb-4">
          <Hotel className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          GrandStay CRM
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Premium Resort, Hotel & Restaurant Multi-Tenant SaaS
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-slate-900/80 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-2xl border border-slate-800 sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@serenevalley.com"
                  className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl text-sm text-white pl-10 pr-4 py-2.5 focus:outline-none focus:border-brand-500 transition-colors placeholder:text-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl text-sm text-white pl-10 pr-4 py-2.5 focus:outline-none focus:border-brand-500 transition-colors placeholder:text-slate-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 active:scale-[0.99] transition-all shadow-lg shadow-brand-600/30 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick 1-Click Demo Accounts */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>1-Click Verified Demo Accounts:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickDemo('superadmin@grandstay.com')}
                className="p-2 text-left bg-slate-800/60 hover:bg-slate-800 rounded-lg border border-slate-700/50 text-slate-200 transition-all hover:border-amber-500/50"
              >
                <div className="font-bold text-amber-400">Master SaaS Admin</div>
                <div className="text-[10px] text-slate-400 truncate">superadmin@grandstay.com</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('admin@serenevalley.com')}
                className="p-2 text-left bg-slate-800/60 hover:bg-slate-800 rounded-lg border border-slate-700/50 text-slate-200 transition-all hover:border-brand-500/50"
              >
                <div className="font-bold text-brand-400">Resort GM / Owner</div>
                <div className="text-[10px] text-slate-400 truncate">admin@serenevalley.com</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('reception@serenevalley.com')}
                className="p-2 text-left bg-slate-800/60 hover:bg-slate-800 rounded-lg border border-slate-700/50 text-slate-200 transition-all hover:border-blue-500/50"
              >
                <div className="font-bold text-blue-400">Front Desk Lead</div>
                <div className="text-[10px] text-slate-400 truncate">reception@serenevalley.com</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('pos@serenevalley.com')}
                className="p-2 text-left bg-slate-800/60 hover:bg-slate-800 rounded-lg border border-slate-700/50 text-slate-200 transition-all hover:border-purple-500/50"
              >
                <div className="font-bold text-purple-400">Restaurant Captain</div>
                <div className="text-[10px] text-slate-400 truncate">pos@serenevalley.com</div>
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-slate-500">
              Default password for all demo accounts: <span className="font-mono text-slate-300">Admin@12345</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
