import React from 'react';
import { Customer, Appointment, AuthUser } from '../types';
import {
  Calendar,
  Users,
  Shield,
  LogOut,
  Presentation,
  RotateCcw,
  Menu,
  X,
  UserCheck,
} from 'lucide-react';

export const ToothIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M7 3C4.2 3 2 5.2 2 8c0 3.8 2 7 2.5 10.5.3 2.1 1.8 3.5 3.5 3.5 1.5 0 2.5-1 3.5-3 1 2 2 3 3.5 3 1.7 0 3.2-1.4 3.5-3.5C19 15 21 11.8 21 8c0-2.8-2.2-5-5-5-1.5 0-3 1-4 2-1-1-2.5-2-4-2z" />
    <path d="M12 7v4" />
  </svg>
);

export interface NavItemConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const NAV_ITEMS: NavItemConfig[] = [
  { id: 'calendar', label: 'Appointments', icon: Calendar },
  { id: 'customers', label: 'Patients', icon: Users },
  { id: 'admin', label: 'Admin', icon: Shield },
];

export interface HeaderProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  customers: Customer[];
  selectedCustomerId?: string;
  onSelectCustomer: (id: string) => void;
  onOpenPresentation: () => void;
  onResetData: () => void;
  onOpenMobileMenu: () => void;
  onNewTreatment?: () => void;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  isBackendConnected?: boolean;
  onOpenBackendSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab = 'calendar',
  onTabChange,
  customers,
  selectedCustomerId,
  onOpenPresentation,
  onResetData,
  onOpenMobileMenu,
  currentUser,
  onLogout,
  isBackendConnected = false,
  onOpenBackendSettings,
}) => {
  const selectedCustomer = selectedCustomerId
    ? customers.find((c) => c.id === selectedCustomerId)
    : undefined;

  const initials = currentUser?.name
    ? currentUser.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'EW';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center justify-between h-20">
        {/* Left Zone: Brand Wordmark */}
        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Open clinical navigation"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
              <ToothIcon className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-base sm:text-lg tracking-tight leading-none block">
                Denta<span className="text-sky-600">Flow</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                Clinical Suite · PHP
              </span>
            </div>
          </div>
        </div>

        {/* Center Zone: Large Icons with Smaller Text Label on the Bottom */}
        {onTabChange && (
          <nav className="hidden lg:flex items-center gap-2 mx-4">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => onTabChange(item.id)}
                  title={item.label}
                  className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl transition-all min-w-[84px] cursor-pointer ${
                    isActive
                      ? 'bg-sky-50 text-sky-700 border border-sky-200/80 shadow-2xs font-semibold'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent font-medium'
                  }`}
                >
                  <div
                    className={`p-1 transition-transform ${
                      isActive ? 'scale-105 text-sky-600' : 'text-slate-500'
                    }`}
                  >
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <span className="text-xs tracking-tight leading-tight mt-0.5 whitespace-nowrap">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Right Zone: Profile / Session Status indicator + Logout */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          {onOpenBackendSettings && (
            <button
              type="button"
              onClick={onOpenBackendSettings}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer border-slate-200 hover:border-sky-300 bg-slate-50 hover:bg-sky-50/50 text-slate-700 shadow-2xs"
              title="Cloud Database & REST API Status"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isBackendConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="text-[11px] font-semibold">
                {isBackendConnected ? 'Supabase Live' : 'Local Cache'}
              </span>
            </button>
          )}

          <div className="text-right hidden sm:block">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {currentUser?.title || 'Clinic Director'}
            </span>
            <span className="text-xs font-semibold text-slate-800">
              {currentUser?.name || 'Dr. Emily Watson'} · <span className="text-emerald-600 font-bold">Active</span>
            </span>
          </div>

          <div
            className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-extrabold text-slate-700 shadow-2xs"
            title={currentUser?.email}
          >
            {initials}
          </div>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              title="Sign Out of Clinic Suite"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export const Sidebar: React.FC<{
  activeTab: string;
  onTabChange: (tab: string) => void;
  customers: Customer[];
  appointments?: Appointment[];
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
}> = ({
  activeTab,
  onTabChange,
  appointments = [],
  isMobileOpen,
  onCloseMobile,
  currentUser,
  onLogout,
}) => {
  // Mobile / Off-canvas navigation with large icons and bottom labels
  if (!isMobileOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex lg:hidden">
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
        onClick={onCloseMobile}
      />
      <div className="relative w-72 max-w-[85vw] h-full bg-white shadow-2xl z-10 flex flex-col">
        {/* Mobile Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-xs">
              <ToothIcon className="w-5 h-5" />
            </div>
            <span className="font-bold text-slate-900 text-base">
              Denta<span className="text-sky-600">Flow</span>
            </span>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Navigation Grid: Large Icons on Top, Smaller Text Label on Bottom */}
        <div className="p-4 flex-1 overflow-y-auto">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Clinical Navigation
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    onCloseMobile();
                  }}
                  className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-sky-50 text-sky-700 border-sky-300 font-semibold shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-7 h-7 mb-1.5 text-sky-600" />
                  <span className="text-xs tracking-tight text-center leading-tight">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          {currentUser && (
            <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Logged in as
                </span>
                <span className="text-xs font-bold text-slate-800 block">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {currentUser.title}
                </span>
              </div>

              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    onCloseMobile();
                  }}
                  className="w-full py-2 px-3 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const Navbar: React.FC<HeaderProps> = (props) => {
  return <Header {...props} />;
};
