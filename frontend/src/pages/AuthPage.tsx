import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import { AlertCircle, Loader2, ArrowRight } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { login, register, switchDemoUser } = useAuth();
  const [isRegister, setIsRegister] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('USER');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        await register(name, email, password, role);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error || 'Authentication failed. Please verify credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfbfd] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-sm">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
              <path d="M13 5v2" />
              <path d="M13 17v2" />
              <path d="M13 11v2" />
            </svg>
          </div>
        </div>

        <h1 className="text-xl font-semibold text-center text-zinc-900 tracking-tight">
          {isRegister ? 'Create an account' : 'Sign in to Support Desk'}
        </h1>
        <p className="mt-1 text-center text-xs text-zinc-500">
          Event-driven helpdesk and ticket tracking system
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-[400px]">
        <div className="bg-white py-7 px-6 sm:px-8 rounded-2xl border border-zinc-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
          {/* Quick Demo Switcher */}
          <div className="mb-5 pb-5 border-b border-zinc-100">
            <span className="text-[11px] font-medium text-zinc-400 block mb-2 uppercase tracking-wider">
              Quick Test Accounts
            </span>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => switchDemoUser('admin')}
                className="w-full text-left px-3 py-2 rounded-lg bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200/60 transition-all flex items-center justify-between group"
              >
                <div>
                  <p className="text-xs font-medium text-zinc-800">Sarah Connor</p>
                  <p className="text-[10px] text-zinc-400">Support Administrator</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700 transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => switchDemoUser('john')}
                className="w-full text-left px-3 py-2 rounded-lg bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200/60 transition-all flex items-center justify-between group"
              >
                <div>
                  <p className="text-xs font-medium text-zinc-800">John Doe</p>
                  <p className="text-[10px] text-zinc-400">Standard Customer</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700 transition-colors" />
              </button>
            </div>
          </div>

          {/* Form Tabs */}
          <div className="flex bg-zinc-100 p-0.5 rounded-lg mb-5 text-xs font-medium text-zinc-600">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setError(null);
              }}
              className={`flex-1 py-1 rounded-md transition-all ${
                !isRegister ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setError(null);
              }}
              className={`flex-1 py-1 rounded-md transition-all ${
                isRegister ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="mb-4 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isRegister && (
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Full name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Alex Morgan"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all placeholder:text-zinc-400"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@example.com"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all placeholder:text-zinc-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all placeholder:text-zinc-400"
              />
            </div>

            {isRegister && (
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 font-medium"
                >
                  <option value="USER">Customer (Submit & Track)</option>
                  <option value="ADMIN">Administrator (Triage & Resolve)</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2 px-4 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 active:scale-[0.99] rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>{isRegister ? 'Create Account' : 'Continue'}</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
