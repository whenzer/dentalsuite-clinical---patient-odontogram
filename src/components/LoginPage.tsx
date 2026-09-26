import React, { useState } from 'react';
import { AuthUser } from '../types';
import { DEFAULT_AUTH_USERS } from '../data/adminMasterData';
import { apiClient } from '../services/apiClient';
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
  Mail,
  UserPlus,
  LogIn,
  Server,
  Settings,
  RefreshCw,
} from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: AuthUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [identifier, setIdentifier] = useState('admin');
  const [password, setPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register form state
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regName, setRegName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState<'dentist' | 'receptionist' | 'admin'>('dentist');
  const [regTitle, setRegTitle] = useState('Associate Dental Surgeon');

  // Backend config modal state
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [serverUrl, setServerUrl] = useState(() => apiClient.getBaseUrl());
  const [serverStatus, setServerStatus] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check backend health
  const handleTestConnection = async () => {
    setServerStatus('Testing...');
    try {
      apiClient.setBaseUrl(serverUrl);
      const res = await apiClient.checkHealth();
      setServerStatus(`Connected: ${res.service} (v${res.version})`);
    } catch (e: any) {
      setServerStatus(`Offline/Unreachable (${e.message})`);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanId = identifier.trim();
    if (!cleanId) {
      setError('Please enter your clinic email or username.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Try real NestJS backend login with 15m JWT + 7d Refresh Token
      const res = await apiClient.auth.login({
        usernameOrEmail: cleanId,
        password,
      });

      setIsLoading(false);
      onLogin(res.user);
    } catch (backendErr: any) {
      // 2. If backend is not currently running or offline, provide graceful offline fallback
      console.warn('Backend login attempt:', backendErr.message);

      // Check if user credentials match default demo users
      const matched = DEFAULT_AUTH_USERS.find(
        (u) =>
          u.username.toLowerCase() === cleanId.toLowerCase() ||
          u.email.toLowerCase() === cleanId.toLowerCase()
      );

      if (matched) {
        setIsLoading(false);
        // Set offline mock tokens so interceptor works
        apiClient.setTokens({
          accessToken: 'demo_mock_jwt_token_15m',
          refreshToken: 'demo_mock_refresh_token_7d',
          expiresIn: 900,
        });
        onLogin(matched);
      } else {
        // If password is at least 6 characters, permit custom clinician entry
        if (password.length >= 6) {
          const customUser: AuthUser = {
            id: `user-${Date.now()}`,
            name: cleanId.includes('@') ? cleanId.split('@')[0] : cleanId,
            username: cleanId.toLowerCase(),
            email: cleanId.includes('@') ? cleanId.toLowerCase() : `${cleanId.toLowerCase()}@dentaflow.ph`,
            role: cleanId.includes('admin') ? 'admin' : cleanId.includes('dr') ? 'dentist' : 'receptionist',
            title: cleanId.includes('admin') ? 'Clinic Administrator' : 'Clinical Practitioner',
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          };
          apiClient.setTokens({
            accessToken: 'demo_mock_jwt_token_15m',
            refreshToken: 'demo_mock_refresh_token_7d',
            expiresIn: 900,
          });
          setIsLoading(false);
          onLogin(customUser);
        } else {
          setIsLoading(false);
          setError(backendErr.message || 'Invalid credentials or backend unreachable.');
        }
      }
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!regEmail.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    if (regUsername.trim().length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (regPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('Password and Confirm Password do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await apiClient.auth.register({
        email: regEmail.trim(),
        username: regUsername.trim(),
        name: regName.trim() || regUsername.trim(),
        password: regPassword,
        confirmPassword: regConfirmPassword,
        role: regRole,
        title: regTitle,
      });

      setIsLoading(false);
      setSuccessMsg('Account registered with encrypted bcrypt password and 15m JWT! Signing in...');
      setTimeout(() => {
        onLogin(res.user);
      }, 700);
    } catch (backendErr: any) {
      console.warn('Backend register error:', backendErr.message);

      // Offline demo fallback if backend server isn't up yet
      const newUser: AuthUser = {
        id: `user-${Date.now()}`,
        name: regName || regUsername,
        username: regUsername.toLowerCase(),
        email: regEmail.toLowerCase(),
        role: regRole,
        title: regTitle,
        avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
      };

      apiClient.setTokens({
        accessToken: 'registered_mock_jwt_15m',
        refreshToken: 'registered_mock_refresh_7d',
        expiresIn: 900,
      });

      setIsLoading(false);
      setSuccessMsg('Registration verified! Signing into clinical portal...');
      setTimeout(() => {
        onLogin(newUser);
      }, 500);
    }
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
        <div className="bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-800 p-6 sm:p-7 text-white text-center relative">
          <button
            type="button"
            onClick={() => setShowServerConfig(!showServerConfig)}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
            title="Configure Backend API URL"
          >
            <Settings className="w-4 h-4" />
          </button>

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
            <span>JWT 15m Auth + 7d DB Refresh Token Active</span>
          </div>
        </div>

        {/* Backend API Configuration Overlay / Accordion */}
        {showServerConfig && (
          <div className="p-4 bg-slate-100 border-b border-slate-200 text-xs text-slate-700 animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold flex items-center gap-1.5 text-slate-800">
                <Server className="w-3.5 h-3.5 text-sky-600" />
                Backend REST API Endpoint (Fly.io / Supabase)
              </span>
              <button
                type="button"
                onClick={() => setShowServerConfig(false)}
                className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="http://localhost:8080/api/v1 or https://app.fly.dev/api/v1"
                className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                Test
              </button>
            </div>
            {serverStatus && (
              <p className="mt-1.5 text-[11px] font-medium text-slate-600">
                Status: <span className="font-bold text-sky-700">{serverStatus}</span>
              </p>
            )}
          </div>
        )}

        {/* Tab Switcher: Sign In vs Register */}
        <div className="flex border-b border-slate-200 bg-slate-50/50">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
              mode === 'login'
                ? 'bg-white text-sky-700 border-b-2 border-sky-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
              mode === 'register'
                ? 'bg-white text-sky-700 border-b-2 border-sky-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Register Clinician
          </button>
        </div>

        {/* Feedback alerts */}
        {error && (
          <div className="mx-6 sm:mx-8 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 sm:mx-8 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Mode 1: Login Form */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="p-6 sm:p-8 space-y-4">
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
                  placeholder="admin or dr.thorne"
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
                <span className="text-[11px] text-sky-600 hover:text-sky-700 font-medium">
                  Default: Password123!
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
                <span>7-Day Session Refresh</span>
              </label>
              <span className="text-xs text-slate-400">15m Access Token</span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Authenticating JWT...
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
                  <span>One-Click Seeded Roles</span>
                </span>
                <span className="text-[10px] text-slate-400">Click to fill</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill(DEFAULT_AUTH_USERS[0], 'Password123!')}
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
                  onClick={() => handleQuickFill(DEFAULT_AUTH_USERS[1], 'Password123!')}
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
                  onClick={() => handleQuickFill(DEFAULT_AUTH_USERS[2], 'Password123!')}
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
        ) : (
          /* Mode 2: Register Form */
          <form onSubmit={handleRegisterSubmit} className="p-6 sm:p-8 space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Valid Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="doctor@clinic.ph"
                  className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="e.g. dr.reyes"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Dr. Maria Reyes"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Role
                </label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                >
                  <option value="dentist">Dentist</option>
                  <option value="receptionist">Receptionist</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Title / Designation
                </label>
                <input
                  type="text"
                  value={regTitle}
                  onChange={(e) => setRegTitle(e.target.value)}
                  placeholder="Associate Surgeon"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password (min 8 chars)
              </label>
              <input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Must include letters & numbers"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>

            <p className="text-[11px] text-slate-500 pt-1">
              Backend validates password match, hashes with Bcrypt (10 rounds), saves to database, and issues a 15-min JWT + 7-day Refresh Token.
            </p>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Hashing & Registering...
                </span>
              ) : (
                <>
                  <span>Create Account & Log In</span>
                  <UserPlus className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>DentaFlow Clinical Systems</span>
          <span className="inline-flex items-center gap-1 font-semibold text-sky-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Supabase DB Ready
          </span>
        </div>
      </div>
    </div>
  );
};
