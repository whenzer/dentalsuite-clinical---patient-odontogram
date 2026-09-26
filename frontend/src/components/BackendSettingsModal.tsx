import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import {
  Server,
  Database,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  KeyRound,
  Radio,
} from 'lucide-react';

interface BackendSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncTrigger: () => Promise<void>;
  isConnected: boolean;
}

export const BackendSettingsModal: React.FC<BackendSettingsModalProps> = ({
  isOpen,
  onClose,
  onSyncTrigger,
  isConnected,
}) => {
  const [apiUrl, setApiUrl] = useState(() => apiClient.getBaseUrl());
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    setApiUrl(apiClient.getBaseUrl());
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async () => {
    setIsTesting(true);
    setTestStatus(null);
    try {
      apiClient.setBaseUrl(apiUrl);
      const res = await apiClient.checkHealth();
      setTestStatus(`Success! Connected to ${res.service} (v${res.version})`);
    } catch (e: any) {
      setTestStatus(`Connection error: ${e.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveAndSync = async () => {
    apiClient.setBaseUrl(apiUrl);
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      await onSyncTrigger();
      setSyncMessage('Database sync complete! Records refreshed.');
    } catch (e: any) {
      setSyncMessage(`Sync warning: ${e.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const token = apiClient.getAccessToken();
  const refreshToken = apiClient.getRefreshToken();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-400/30">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Backend & Cloud Database</h3>
              <p className="text-xs text-slate-400">
                NestJS REST API · TypeORM · Supabase PostgreSQL · WebSockets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-sm">
          {/* Status Overview Card */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
                <span>REST API Status</span>
                <Server className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                <span className="font-bold text-slate-800 text-xs">
                  {isConnected ? 'Connected & Live' : 'Local Cache Active'}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
                <span>Database Engine</span>
                <Database className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="font-bold text-slate-800 text-xs">Supabase (PostgreSQL)</span>
              </div>
            </div>
          </div>

          {/* Authentication Security Status */}
          <div className="p-3.5 rounded-xl border border-sky-100 bg-sky-50/60 text-xs text-sky-950 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-sky-900">
              <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
              <span>JWT Dual-Token Security Architecture</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Short-lived <span className="font-semibold text-slate-900">15-minute Access Token</span> verified via middleware, paired with a <span className="font-semibold text-slate-900">7-Day Rotated Refresh Token</span> stored securely with SHA-256 hashing in Supabase.
            </p>
            <div className="flex items-center gap-4 text-[11px] pt-1">
              <span className="flex items-center gap-1 text-slate-600">
                <KeyRound className="w-3 h-3 text-emerald-600" />
                Access Token: <span className="font-semibold text-emerald-700">{token ? 'Active (15m)' : 'None'}</span>
              </span>
              <span className="flex items-center gap-1 text-slate-600">
                <RefreshCw className="w-3 h-3 text-sky-600" />
                Refresh Token: <span className="font-semibold text-sky-700">{refreshToken ? 'Active (7d)' : 'None'}</span>
              </span>
            </div>
          </div>

          {/* API Base URL Setting */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Backend REST API Base URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="e.g. /api/v1 or https://your-backend.fly.dev/api/v1"
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
              <button
                type="button"
                onClick={handleTest}
                disabled={isTesting}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isTesting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Radio className="w-3.5 h-3.5" />
                )}
                Test
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Live production backend: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">https://dentalsuite-backend.fly.dev/api/v1</code>
            </p>
          </div>

          {testStatus && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                testStatus.startsWith('Success')
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {testStatus.startsWith('Success') ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{testStatus}</span>
            </div>
          )}

          {syncMessage && (
            <div className="p-3 rounded-xl bg-sky-50 text-sky-800 border border-sky-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
              <span>{syncMessage}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSaveAndSync}
            disabled={isSyncing}
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Synchronizing Database...
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                Save URL & Sync Database
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
