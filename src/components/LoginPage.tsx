import React, { useState, useEffect } from 'react';
import { AuthUser } from '../types';
import { apiClient } from '../services/apiClient';
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
  Building2,
  Phone,
  MapPin,
  FileText,
  UserCheck,
  Server,
  Settings,
  RefreshCw,
  Info,
} from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: AuthUser) => void;
  initialMode?: 'staff' | 'clinic';
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, initialMode = 'staff' }) => {
  // Main portal mode: 'staff' (login only) or 'clinic' (login & registration)
  const [portalMode, setPortalMode] = useState<'staff' | 'clinic'>(initialMode);

  // Clinic sub-mode: 'login' or 'register'
  const [clinicSubMode, setClinicSubMode] = useState<'login' | 'register'>('login');

  // Staff Login fields
  const [staffIdentifier, setStaffIdentifier] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [showStaffPassword, setShowStaffPassword] = useState(false);

  // Clinic Login fields
  const [clinicEmail, setClinicEmail] = useState('');
  const [clinicPassword, setClinicPassword] = useState('');
  const [showClinicPassword, setShowClinicPassword] = useState(false);

  // Clinic Registration fields
  const [regClinicName, setRegClinicName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regRegNumber, setRegRegNumber] = useState('');
  const [regOwnerName, setRegOwnerName] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Server connection check
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'offline'>('checking');
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [serverUrl, setServerUrl] = useState(() => apiClient.getBaseUrl());

  const checkConnection = async () => {
    setBackendStatus('checking');
    try {
      await apiClient.checkHealth();
      setBackendStatus('connected');
    } catch {
      setBackendStatus('offline');
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const handleSaveServerUrl = (e: React.FormEvent) => {
    e.preventDefault();
    apiClient.setBaseUrl(serverUrl);
    setShowServerConfig(false);
    checkConnection();
  };

  // 1. Staff Login Submit
  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanId = staffIdentifier.trim();
    if (!cleanId) {
      setError('Please enter your staff username or email.');
      return;
    }
    if (!staffPassword) {
      setError('Please enter your staff password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiClient.auth.loginStaff({
        usernameOrEmail: cleanId,
        password: staffPassword,
      });

      const user: AuthUser = {
        id: res.user.id,
        name: res.user.name,
        username: res.user.username,
        email: res.user.email,
        role: res.user.role,
        title: res.user.title || 'Staff Practitioner',
        avatarUrl: res.user.avatarUrl,
        clinicId: res.user.clinicId,
        clinicName: res.user.clinicName,
        accountType: 'staff',
        permissions: res.user.permissions || [],
      };

      onLogin(user);
    } catch (err: any) {
      setError(err.message || 'Staff login failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Clinic Login Submit
  const handleClinicLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = clinicEmail.trim();
    if (!cleanEmail) {
      setError('Please enter your clinic email.');
      return;
    }
    if (!clinicPassword) {
      setError('Please enter your clinic password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiClient.auth.loginClinic({
        email: cleanEmail,
        password: clinicPassword,
      });

      const user: AuthUser = {
        id: res.clinic.id,
        name: res.clinic.name,
        username: res.clinic.email,
        email: res.clinic.email,
        role: 'clinic_admin',
        title: 'Clinic Administrator',
        clinicId: res.clinic.id,
        clinicName: res.clinic.name,
        accountType: 'clinic',
        permissions: ['all'],
      };

      onLogin(user);
    } catch (err: any) {
      setError(err.message || 'Clinic login failed. Please verify your clinic email and password.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Clinic Registration Submit
  const handleClinicRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!regClinicName.trim()) {
      setError('Please provide the clinic or practice name.');
      return;
    }
    if (!regEmail.trim()) {
      setError('Please provide the official clinic email.');
      return;
    }
    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiClient.auth.registerClinic({
        clinicName: regClinicName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        confirmPassword: regConfirmPassword,
        phone: regPhone.trim(),
        address: regAddress.trim(),
        registrationNumber: regRegNumber.trim(),
        ownerName: regOwnerName.trim(),
      });

      const user: AuthUser = {
        id: res.clinic.id,
        name: res.clinic.name,
        username: res.clinic.email,
        email: res.clinic.email,
        role: 'clinic_admin',
        title: 'Clinic Administrator',
        clinicId: res.clinic.id,
        clinicName: res.clinic.name,
        accountType: 'clinic',
        permissions: ['all'],
      };

      onLogin(user);
    } catch (err: any) {
      setError(err.message || 'Clinic registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans">
      {/* Background Decorative Mesh Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-sky-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar with System Branding & Connection Status */}
      <header className="relative z-10 max-w-6xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">DentalSuite</h1>
            <p className="text-[11px] text-slate-400">Enterprise Clinical Odontogram & Management</p>
          </div>
        </div>

        {/* Backend Endpoint Status */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                backendStatus === 'connected'
                  ? 'bg-emerald-400 animate-pulse'
                  : backendStatus === 'checking'
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-rose-400'
              }`}
            />
            <span className="text-[11px] font-medium text-slate-300 hidden sm:inline">
              {backendStatus === 'connected'
                ? 'Backend Live'
                : backendStatus === 'checking'
                ? 'Connecting...'
                : 'Offline'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowServerConfig(!showServerConfig)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-700"
            title="Configure Backend Server URL"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Server Config Drawer */}
      {showServerConfig && (
        <div className="relative z-20 max-w-md w-full mx-auto my-3 p-4 bg-slate-800/95 border border-slate-700 rounded-2xl backdrop-blur-md shadow-xl animate-fadeIn">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-sky-400" />
              API Server Configuration
            </span>
            <button
              onClick={() => setShowServerConfig(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <form onSubmit={handleSaveServerUrl} className="space-y-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Backend Base URL</label>
              <input
                type="text"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="https://dentalsuite-backend.fly.dev/api/v1"
                className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setServerUrl('https://dentalsuite-backend.fly.dev/api/v1');
                }}
                className="text-[11px] text-sky-400 hover:underline cursor-pointer"
              >
                Reset to Fly.dev
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={checkConnection}
                  className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-xs font-medium rounded-lg text-slate-200"
                >
                  Test
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-xs font-bold rounded-lg text-white"
                >
                  Save URL
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Main Auth Container */}
      <main className="relative z-10 max-w-xl w-full mx-auto my-6">
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
          {/* Top Portal Switcher (Staff vs Clinic) */}
          <div className="flex items-center p-1 bg-slate-900/80 rounded-2xl border border-slate-700/80">
            <button
              type="button"
              onClick={() => {
                setPortalMode('staff');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                portalMode === 'staff'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>Staff Login</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPortalMode('clinic');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                portalMode === 'clinic'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Clinic Portal</span>
            </button>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* MODE 1: STAFF PORTAL (Login only) */}
          {portalMode === 'staff' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Staff Sign In</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Access the clinical charting suite, interactive odontogram, and appointments
                </p>
              </div>

              {/* Informative banner on staff account provisioning */}
              <div className="p-3.5 rounded-xl bg-sky-950/50 border border-sky-800/50 text-sky-200 text-xs flex items-start gap-2.5">
                <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-semibold text-sky-100">Clinic-Provisioned Accounts</div>
                  <div className="text-[11px] text-sky-300/80 leading-relaxed">
                    Staff accounts are managed directly by your Clinic Administrator. If you need login credentials, please request your clinic manager to register your account.
                  </div>
                </div>
              </div>

              <form onSubmit={handleStaffLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Username or Email
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. dr_smith or staff@clinic.com"
                      value={staffIdentifier}
                      onChange={(e) => setStaffIdentifier(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-900/90 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showStaffPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter your staff password"
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-900/90 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowStaffPassword(!showStaffPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                    >
                      {showStaffPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Clinical Suite</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-400">Need to register a new clinic? </span>
                <button
                  type="button"
                  onClick={() => {
                    setPortalMode('clinic');
                    setClinicSubMode('register');
                  }}
                  className="text-xs font-bold text-sky-400 hover:text-sky-300 underline cursor-pointer"
                >
                  Register your Clinic here
                </button>
              </div>
            </div>
          )}

          {/* MODE 2: CLINIC PORTAL (Login or Register) */}
          {portalMode === 'clinic' && (
            <div className="space-y-5">
              {/* Sub tabs: Login vs Register */}
              <div className="flex border-b border-slate-700 pb-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setClinicSubMode('login');
                    setError(null);
                  }}
                  className={`text-xs font-bold pb-2 transition-all border-b-2 cursor-pointer ${
                    clinicSubMode === 'login'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Clinic Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setClinicSubMode('register');
                    setError(null);
                  }}
                  className={`text-xs font-bold pb-2 transition-all border-b-2 cursor-pointer ${
                    clinicSubMode === 'register'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Register New Clinic
                </button>
              </div>

              {clinicSubMode === 'login' ? (
                /* Clinic Login Form */
                <form onSubmit={handleClinicLogin} className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Clinic Administrator Login</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Sign in to manage practice settings, register staff, and assign access permissions
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Clinic Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        required
                        placeholder="admin@metrodental.com"
                        value={clinicEmail}
                        onChange={(e) => setClinicEmail(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-900/90 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type={showClinicPassword ? 'text' : 'password'}
                        required
                        placeholder="Enter clinic password"
                        value={clinicPassword}
                        onChange={(e) => setClinicPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-900/90 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowClinicPassword(!showClinicPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                      >
                        {showClinicPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying Clinic...</span>
                      </>
                    ) : (
                      <>
                        <span>Enter Clinic Management Portal</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <span className="text-xs text-slate-400">Don't have a clinic account? </span>
                    <button
                      type="button"
                      onClick={() => setClinicSubMode('register')}
                      className="text-xs font-bold text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                    >
                      Register your practice now
                    </button>
                  </div>
                </form>
              ) : (
                /* Clinic Registration Form */
                <form onSubmit={handleClinicRegister} className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Register Dental Clinic</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Establish your clinic tenant, invite practitioners, and maintain full data privacy
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Clinic / Practice Name <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Apex Family Dental Specialists"
                          value={regClinicName}
                          onChange={(e) => setRegClinicName(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 text-xs bg-slate-900/90 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Official Clinic Email <span className="text-rose-400">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                          <input
                            type="email"
                            required
                            placeholder="admin@apexdental.com"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 text-xs bg-slate-900/90 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Practice Contact Phone
                        </label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                          <input
                            type="text"
                            placeholder="+1 (555) 019-2834"
                            value={regPhone}
                            onChange={(e) => setRegPhone(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 text-xs bg-slate-900/90 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Password <span className="text-rose-400">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                          <input
                            type={showRegPassword ? 'text' : 'password'}
                            required
                            placeholder="Min 6 characters"
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            className="w-full pl-10 pr-9 py-2 text-xs bg-slate-900/90 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegPassword(!showRegPassword)}
                            className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-200"
                          >
                            {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Confirm Password <span className="text-rose-400">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                          <input
                            type={showRegPassword ? 'text' : 'password'}
                            required
                            placeholder="Re-type password"
                            value={regConfirmPassword}
                            onChange={(e) => setRegConfirmPassword(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 text-xs bg-slate-900/90 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Owner / Lead Dentist
                        </label>
                        <div className="relative">
                          <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                          <input
                            type="text"
                            placeholder="Dr. Alexander Wright, DDS"
                            value={regOwnerName}
                            onChange={(e) => setRegOwnerName(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 text-xs bg-slate-900/90 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Clinic License / Reg #
                        </label>
                        <div className="relative">
                          <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                          <input
                            type="text"
                            placeholder="DOH-CL-8291"
                            value={regRegNumber}
                            onChange={(e) => setRegRegNumber(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 text-xs bg-slate-900/90 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Physical Practice Address
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                        <input
                          type="text"
                          placeholder="Suite 400, 120 Medical Plaza Way"
                          value={regAddress}
                          onChange={(e) => setRegAddress(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 text-xs bg-slate-900/90 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Provisioning Clinic...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Clinic Account</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <span className="text-xs text-slate-400">Already registered your practice? </span>
                    <button
                      type="button"
                      onClick={() => setClinicSubMode('login')}
                      className="text-xs font-bold text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                    >
                      Sign in here
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center text-xs text-slate-500 py-2">
        <span>DentalSuite Production Platform • Multi-Tenant Protected & Encrypted</span>
      </footer>
    </div>
  );
};
