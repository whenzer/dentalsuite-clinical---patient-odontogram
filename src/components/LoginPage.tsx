import React, { useState } from 'react';
import { AuthUser } from '../types';
import { DEFAULT_AUTH_USERS } from '../data/adminMasterData';
import { ToothIcon } from './Navbar';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  Stethoscope,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: AuthUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [identifier, setIdentifier] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanId = identifier.trim().toLowerCase();
    if (!cleanId) {
      setError('Please enter your clinic email or username.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Find matching user from default users or permit custom valid clinic credentials
      const matched = DEFAULT_AUTH_USERS.find(
        (u) =>
          u.username.toLowerCase() === cleanId ||
          u.email.toLowerCase() === cleanId
      );

      if (matched) {
        setIsLoading(false);
        onLogin(matched);
      } else {
        // Allow fallback user with clean identifier
        const customUser: AuthUser = {
          id: `user-${Date.now()}`,
          name: cleanId.includes('@') ? cleanId.split('@')[0] : cleanId,
          username: cleanId,
          email: cleanId.includes('@') ? cleanId : `${cleanId}@dentaflow.ph`,
          role: cleanId.includes('admin') ? 'admin' : cleanId.includes('dr') ? 'dentist' : 'receptionist',
          title: cleanId.includes('admin') ? 'Clinic Administrator' : 'Clinical Practitioner',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        };
        setIsLoading(false);
        onLogin(customUser);
      }
    }, 350);
  };

  const handleQuickFill = (user: AuthUser, pass: string) => {
    setIdentifier(user.username);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-sky-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header Badge */}
        <div className="bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-800 p-6 sm:p-8 text-white text-center relative">
          <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner border border-white/20">
            <ToothIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            Denta<span className="text-sky-300">Flow</span>
          </h1>
          <p className="text-xs text-sky-100 font-medium tracking-wide mt-1">
            Clinical Suite & Practice Administration (PH)
          </p>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-[11px] font-semibold text-sky-100 mt-3 border border-white/10">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>Encrypted Clinic Portal · PHP Currency Enabled</span>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} className="p-6 sm:p-8 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email or Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="admin or admin@dentaflow.ph"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <span className="text-[11px] text-sky-600 hover:text-sky-700 cursor-pointer">
                Demo: admin123
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 font-medium">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer"
              />
              <span>Remember clinic device</span>
            </label>
            <span className="text-xs text-slate-400">DOH-FDA Registered</span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Authenticating...
              </span>
            ) : (
              <>
                <span>Sign In to Clinic Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Quick Demo Logins Section */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>One-Click Demo Roles</span>
              </span>
              <span className="text-[10px] text-slate-400">Click to fill</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill(DEFAULT_AUTH_USERS[0], 'admin123')}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                  identifier === 'admin'
                    ? 'border-sky-500 bg-sky-50/80 ring-2 ring-sky-200'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <span className="text-[10px] font-extrabold text-sky-800 block">Admin</span>
                <span className="text-[10px] text-slate-500 truncate block">Dr. Watson</span>
                <span className="text-[9px] text-emerald-600 font-semibold block mt-0.5">Full Access</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill(DEFAULT_AUTH_USERS[1], 'dentist123')}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                  identifier === 'dr.thorne'
                    ? 'border-sky-500 bg-sky-50/80 ring-2 ring-sky-200'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <span className="text-[10px] font-extrabold text-slate-800 block">Dentist</span>
                <span className="text-[10px] text-slate-500 truncate block">Dr. Thorne</span>
                <span className="text-[9px] text-sky-600 font-semibold block mt-0.5">Operatory 2</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill(DEFAULT_AUTH_USERS[2], 'staff123')}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                  identifier === 'receptionist'
                    ? 'border-sky-500 bg-sky-50/80 ring-2 ring-sky-200'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <span className="text-[10px] font-extrabold text-slate-800 block">Reception</span>
                <span className="text-[10px] text-slate-500 truncate block">M. Santos</span>
                <span className="text-[9px] text-amber-600 font-semibold block mt-0.5">Front Desk</span>
              </button>
            </div>
          </div>
        </form>

        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-500">
            DentaFlow Clinic Systems · Philippine Peso (PHP) Currency Compliant
          </p>
        </div>
      </div>
    </div>
  );
};
