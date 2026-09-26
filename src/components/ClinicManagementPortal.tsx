import React, { useState, useEffect } from 'react';
import { AuthUser, ClinicProfile, StaffMember } from '../types';
import { apiClient } from '../services/apiClient';
import {
  Building2,
  Users,
  UserPlus,
  Shield,
  KeyRound,
  LogOut,
  Mail,
  Phone,
  MapPin,
  FileText,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  Lock,
  Edit2,
  Trash2,
  Power,
  Sparkles,
  ExternalLink,
  Search,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';

interface ClinicManagementPortalProps {
  currentUser: AuthUser;
  onLogout: () => void;
  onSwitchToStaffLogin: () => void;
}

const AVAILABLE_PERMISSIONS = [
  { id: 'patients', label: 'Patient Records', desc: 'Browse, create, and manage patient files & medical alerts' },
  { id: 'appointments', label: 'Appointments & Calendar', desc: 'Schedule, reschedule, send automated reminders' },
  { id: 'charting', label: 'Odontogram & Charting', desc: 'Interactive 32-tooth odontogram, conditions, periodontal depths' },
  { id: 'treatments', label: 'Treatment Logs', desc: 'Log clinical treatments, procedures, and material usage' },
  { id: 'photography', label: 'Clinical Photography', desc: 'Capture intraoral scans, before/after comparisons' },
  { id: 'recommendations', label: 'Care Recommendations', desc: 'Automated next-visit rules, preemptive hygiene plans' },
  { id: 'presentation', label: 'Case Presentation Mode', desc: 'Full-screen patient education and treatment consent' },
  { id: 'inventory', label: 'Chairs & Consumables', desc: 'Manage operatory dental chairs & consumable stocks' },
  { id: 'admin_view', label: 'Clinic Admin View', desc: 'Master fee schedules, shift rosters, and determinations' },
];

const DEFAULT_ROLE_PERMS: Record<string, string[]> = {
  admin: ['patients', 'appointments', 'charting', 'treatments', 'photography', 'recommendations', 'presentation', 'inventory', 'admin_view'],
  dentist: ['patients', 'appointments', 'charting', 'treatments', 'photography', 'recommendations', 'presentation'],
  hygienist: ['patients', 'appointments', 'charting', 'treatments', 'photography'],
  receptionist: ['patients', 'appointments'],
  assistant: ['patients', 'appointments', 'charting', 'photography'],
};

export const ClinicManagementPortal: React.FC<ClinicManagementPortalProps> = ({
  currentUser,
  onLogout,
  onSwitchToStaffLogin,
}) => {
  const [clinic, setClinic] = useState<ClinicProfile | null>(null);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modals
  const [isRegisterStaffOpen, setIsRegisterStaffOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [isEditStaffOpen, setIsEditStaffOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  // New Staff Form state
  const [staffForm, setStaffForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'dentist',
    title: 'Associate Dental Surgeon',
    permissions: DEFAULT_ROLE_PERMS['dentist'],
  });
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [submittingStaff, setSubmittingStaff] = useState(false);

  // Reset Password form state
  const [newPassword, setNewPassword] = useState('');
  const [resettingPw, setResettingPw] = useState(false);

  // Edit Clinic Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    address: '',
    registrationNumber: '',
    ownerName: '',
  });

  // Fetch clinic profile & staff roster
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileRes, staffRes] = await Promise.allSettled([
        apiClient.clinic.getProfile(),
        apiClient.clinic.getStaff(),
      ]);

      if (profileRes.status === 'fulfilled') {
        setClinic(profileRes.value);
        setProfileForm({
          name: profileRes.value.name || '',
          phone: profileRes.value.phone || '',
          address: profileRes.value.address || '',
          registrationNumber: profileRes.value.registrationNumber || '',
          ownerName: profileRes.value.ownerName || '',
        });
      } else {
        // Fallback to current user info
        setClinic({
          id: currentUser.clinicId || currentUser.id,
          name: currentUser.clinicName || currentUser.name || 'Dental Clinic',
          email: currentUser.email,
        });
      }

      if (staffRes.status === 'fulfilled' && Array.isArray(staffRes.value)) {
        setStaffList(staffRes.value);
      } else {
        setStaffList([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load clinic data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRoleChangeInForm = (role: string) => {
    const defaultPerms = DEFAULT_ROLE_PERMS[role] || DEFAULT_ROLE_PERMS['dentist'];
    let defaultTitle = 'Dental Practitioner';
    if (role === 'admin') defaultTitle = 'Clinic Administrator';
    else if (role === 'dentist') defaultTitle = 'Associate Dental Surgeon';
    else if (role === 'hygienist') defaultTitle = 'Licensed Dental Hygienist';
    else if (role === 'receptionist') defaultTitle = 'Front Desk Coordinator';
    else if (role === 'assistant') defaultTitle = 'Certified Dental Assistant';

    setStaffForm((prev) => ({
      ...prev,
      role,
      title: defaultTitle,
      permissions: defaultPerms,
    }));
  };

  const togglePermission = (permId: string) => {
    setStaffForm((prev) => {
      const exists = prev.permissions.includes(permId);
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter((p) => p !== permId)
          : [...prev.permissions, permId],
      };
    });
  };

  const handleRegisterStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.name.trim() || !staffForm.username.trim() || !staffForm.email.trim() || !staffForm.password) {
      setError('Please fill in all required staff fields.');
      return;
    }
    if (staffForm.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmittingStaff(true);
    setError(null);
    try {
      await apiClient.clinic.registerStaff({
        name: staffForm.name.trim(),
        username: staffForm.username.trim(),
        email: staffForm.email.trim(),
        password: staffForm.password,
        role: staffForm.role,
        title: staffForm.title.trim(),
        permissions: staffForm.permissions,
      });

      setSuccessMsg(`Successfully registered ${staffForm.name} as ${staffForm.role}.`);
      setIsRegisterStaffOpen(false);
      setStaffForm({
        name: '',
        username: '',
        email: '',
        password: '',
        role: 'dentist',
        title: 'Associate Dental Surgeon',
        permissions: DEFAULT_ROLE_PERMS['dentist'],
      });
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to register staff.');
    } finally {
      setSubmittingStaff(false);
    }
  };

  // Quick action: Register current clinic administrator as an Admin Staff member
  const handleQuickRegisterMyself = () => {
    const ownerName = clinic?.ownerName || currentUser.name || 'Clinic Administrator';
    const emailPrefix = currentUser.email.split('@')[0] || 'admin';
    const cleanUsername = `${emailPrefix}_admin`.toLowerCase().replace(/[^a-z0-9_]/g, '');

    setStaffForm({
      name: ownerName,
      username: cleanUsername,
      email: currentUser.email,
      password: '',
      role: 'admin',
      title: 'Chief Medical Officer & Administrator',
      permissions: DEFAULT_ROLE_PERMS['admin'],
    });
    setIsRegisterStaffOpen(true);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const updated = await apiClient.clinic.updateProfile(profileForm);
      setClinic(updated);
      setSuccessMsg('Clinic practice details updated successfully.');
      setIsEditProfileOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    }
  };

  const handleToggleStaffStatus = async (staff: StaffMember) => {
    const newStatus = staff.status === 'active' ? 'inactive' : 'active';
    try {
      await apiClient.clinic.updateStaff(staff.id, { status: newStatus });
      setStaffList((prev) =>
        prev.map((s) => (s.id === staff.id ? { ...s, status: newStatus } : s))
      );
      setSuccessMsg(`Staff status updated to ${newStatus}.`);
    } catch (err: any) {
      setError(err.message || 'Failed to update status.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff || !newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setResettingPw(true);
    setError(null);
    try {
      await apiClient.clinic.resetStaffPassword(selectedStaff.id, newPassword);
      setSuccessMsg(`Password for ${selectedStaff.name} has been reset.`);
      setIsResetPasswordOpen(false);
      setNewPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setResettingPw(false);
    }
  };

  const handleDeleteStaff = async (staff: StaffMember) => {
    if (!window.confirm(`Are you sure you want to remove ${staff.name} (${staff.username}) from this clinic?`)) {
      return;
    }
    try {
      await apiClient.clinic.deleteStaff(staff.id);
      setStaffList((prev) => prev.filter((s) => s.id !== staff.id));
      setSuccessMsg(`Staff member ${staff.name} was removed.`);
    } catch (err: any) {
      setError(err.message || 'Failed to delete staff.');
    }
  };

  const handleEditStaffPermissions = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setStaffForm({
      name: staff.name,
      username: staff.username,
      email: staff.email,
      password: '',
      role: staff.role,
      title: staff.title,
      permissions: staff.permissions || [],
    });
    setIsEditStaffOpen(true);
  };

  const handleSaveStaffEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    try {
      await apiClient.clinic.updateStaff(selectedStaff.id, {
        name: staffForm.name,
        role: staffForm.role,
        title: staffForm.title,
        permissions: staffForm.permissions,
      });
      setSuccessMsg(`Updated role and access permissions for ${staffForm.name}.`);
      setIsEditStaffOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save staff updates.');
    }
  };

  const filteredStaff = staffList.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || s.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-base">DentalSuite</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60 uppercase tracking-wide">
                  Clinic Management
                </span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-1">
                {clinic?.name || currentUser.clinicName || 'Clinic Administration Portal'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onSwitchToStaffLogin}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200"
              title="Launch Clinical Suite login"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Launch Clinical Suite</span>
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border border-rose-200"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Alerts */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-xs text-rose-500 hover:text-rose-700 font-bold"
            >
              Dismiss
            </button>
          </div>
        )}
        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button
              onClick={() => setSuccessMsg(null)}
              className="text-xs text-emerald-500 hover:text-emerald-700 font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Clinical Suite Guidance Banner */}
        <div className="bg-gradient-to-r from-sky-600 via-indigo-600 to-indigo-700 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-semibold backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Access & Role Delegation</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              Ready to Treat Patients in the Clinical Suite?
            </h2>
            <p className="text-xs sm:text-sm text-sky-100 leading-relaxed">
              This Clinic Portal manages your medical practice and staff permissions. To open the 32-tooth interactive odontogram, calendar, and patient charting, log in using a <strong>Staff Account</strong>. As the clinic administrator, register your personal admin account below to begin.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleQuickRegisterMyself}
              className="px-4 py-2.5 bg-white text-indigo-700 hover:bg-sky-50 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-indigo-600" />
              <span>Register Myself as Admin Staff</span>
            </button>
            <button
              type="button"
              onClick={onSwitchToStaffLogin}
              className="px-4 py-2.5 bg-indigo-500/40 hover:bg-indigo-500/60 text-white font-semibold text-xs rounded-xl border border-white/20 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Go to Staff Login</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Practice Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Clinic Details */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-sky-600" />
                  <span>Practice Credentials</span>
                </h3>
                <p className="text-xs text-slate-500">Official clinic identity and contact info</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(true)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Edit Practice Details</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <Building2 className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-slate-500">Clinic Name</div>
                  <div className="text-sm font-semibold text-slate-800 truncate">
                    {clinic?.name || 'Not set'}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <Mail className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-slate-500">Official Email</div>
                  <div className="text-sm font-semibold text-slate-800 truncate">
                    {clinic?.email || currentUser.email}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <Phone className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-slate-500">Phone Number</div>
                  <div className="text-sm font-semibold text-slate-800 truncate">
                    {clinic?.phone || 'Not configured'}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-slate-500">Accreditation / License #</div>
                  <div className="text-sm font-semibold text-slate-800 truncate">
                    {clinic?.registrationNumber || 'Not provided'}
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2 flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-slate-500">Clinic Address</div>
                  <div className="text-sm font-semibold text-slate-800">
                    {clinic?.address || 'No physical address recorded'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics & Isolation info */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>Tenant Isolation</span>
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your clinic data is completely isolated. Only staff members registered by this clinic account can access patient charts, schedules, and clinical records.
              </p>
              <div className="p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-xl space-y-1">
                <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Exclusive Clinic Data Sandbox</span>
                </div>
                <div className="text-[11px] text-emerald-700">
                  Clinic ID: <span className="font-mono">{clinic?.id || currentUser.id}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Active Staff Members</span>
              <span className="font-bold text-slate-900 text-sm">{staffList.length}</span>
            </div>
          </div>
        </div>

        {/* Staff Members Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>Staff Roster & Access Controls</span>
              </h3>
              <p className="text-xs text-slate-500">
                Register practitioners, set individual roles, and assign granular feature access
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setStaffForm({
                    name: '',
                    username: '',
                    email: '',
                    password: '',
                    role: 'dentist',
                    title: 'Associate Dental Surgeon',
                    permissions: DEFAULT_ROLE_PERMS['dentist'],
                  });
                  setIsRegisterStaffOpen(true);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Register New Staff</span>
              </button>
              <button
                type="button"
                onClick={loadData}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                title="Refresh staff roster"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search staff by name, username, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500 shrink-0">Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="all">All Roles</option>
                <option value="dentist">Dentists</option>
                <option value="admin">Administrators</option>
                <option value="hygienist">Dental Hygienists</option>
                <option value="receptionist">Receptionists</option>
                <option value="assistant">Dental Assistants</option>
              </select>
            </div>
          </div>

          {/* Staff Table / List */}
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
              Loading clinic staff team...
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">No staff members found</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {searchQuery || roleFilter !== 'all'
                  ? 'No staff members match the current search filters.'
                  : 'Start by registering your clinical team. You can register yourself as an admin staff member, or add dentists, hygienists, and receptionists.'}
              </p>
              {!searchQuery && roleFilter === 'all' && (
                <button
                  type="button"
                  onClick={handleQuickRegisterMyself}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors inline-flex items-center gap-2 cursor-pointer mt-2"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register Myself as Admin Staff</span>
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredStaff.map((staff) => {
                const roleColors: Record<string, { bg: string; text: string; border: string }> = {
                  dentist: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
                  admin: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
                  hygienist: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
                  receptionist: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
                  assistant: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
                };
                const currentBadge = roleColors[staff.role] || roleColors.dentist;

                return (
                  <div
                    key={staff.id}
                    className="p-5 hover:bg-slate-50/60 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-sky-500 text-white font-bold flex items-center justify-center text-base shadow-xs shrink-0">
                        {staff.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">{staff.name}</span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${currentBadge.bg} ${currentBadge.text} ${currentBadge.border}`}
                          >
                            {staff.role}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                              staff.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            {staff.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        <div className="text-xs text-slate-500 flex items-center gap-3 flex-wrap">
                          <span className="font-medium text-slate-700">{staff.title || 'Staff Member'}</span>
                          <span>•</span>
                          <span>Username: <strong className="font-mono text-slate-800">{staff.username}</strong></span>
                          <span>•</span>
                          <span>Email: {staff.email}</span>
                        </div>

                        {/* Permissions Tags */}
                        <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] text-slate-400 font-medium">Access:</span>
                          {(staff.permissions || []).map((p) => {
                            const found = AVAILABLE_PERMISSIONS.find((ap) => ap.id === p);
                            return (
                              <span
                                key={p}
                                className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium"
                              >
                                {found?.label || p}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Staff Actions */}
                    <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditStaffPermissions(staff)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-white transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Edit Roles & Access"
                      >
                        <Shield className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Permissions</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStaff(staff);
                          setNewPassword('');
                          setIsResetPasswordOpen(true);
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-white transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Reset Staff Password"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                        <span>Reset PW</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleStaffStatus(staff)}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          staff.status === 'active'
                            ? 'border-slate-200 text-slate-500 hover:bg-amber-50 hover:text-amber-700'
                            : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={staff.status === 'active' ? 'Deactivate staff' : 'Activate staff'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteStaff(staff)}
                        className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Remove staff member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Modal: Register New Staff */}
      {isRegisterStaffOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full border border-slate-200 overflow-hidden animate-scaleUp my-8">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-indigo-600" />
                  <span>Register Clinic Staff Member</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Provision credentials and configure granular clinical access
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterStaffOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterStaff} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Emily Chen"
                    value={staffForm.name}
                    onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Username <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. emily_chen"
                    value={staffForm.username}
                    onChange={(e) => setStaffForm({ ...staffForm, username: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="emily@clinic.com"
                    value={staffForm.email}
                    onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showStaffPassword ? 'text' : 'password'}
                      required
                      placeholder="At least 6 characters"
                      value={staffForm.password}
                      onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                      className="w-full pl-3 pr-9 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowStaffPassword(!showStaffPassword)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                    >
                      {showStaffPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Role</label>
                  <select
                    value={staffForm.role}
                    onChange={(e) => handleRoleChangeInForm(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer bg-white"
                  >
                    <option value="dentist">Dentist / Surgeon (Full Charting)</option>
                    <option value="admin">Clinic Administrator (Full Access)</option>
                    <option value="hygienist">Dental Hygienist (Preventive/Periodontal)</option>
                    <option value="receptionist">Receptionist (Calendar & Check-in)</option>
                    <option value="assistant">Dental Assistant (Operatory Support)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Job Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Lead Orthodontist"
                    value={staffForm.title}
                    onChange={(e) => setStaffForm({ ...staffForm, title: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Granular Permissions Checkboxes */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800">
                    Granular Access Permissions
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {staffForm.permissions.length} selected
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  {AVAILABLE_PERMISSIONS.map((perm) => {
                    const checked = staffForm.permissions.includes(perm.id);
                    return (
                      <label
                        key={perm.id}
                        className={`flex items-start gap-2.5 p-2 rounded-lg border transition-colors cursor-pointer ${
                          checked
                            ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePermission(perm.id)}
                          className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold leading-tight">{perm.label}</div>
                          <div className="text-[10px] text-slate-500 line-clamp-1">{perm.desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRegisterStaffOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingStaff}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {submittingStaff ? 'Registering...' : 'Register Staff Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Permissions for Existing Staff */}
      {isEditStaffOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full border border-slate-200 overflow-hidden animate-scaleUp my-8">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  <span>Edit Role & Access: {selectedStaff.name}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Update role designation and feature permissions
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditStaffOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStaffEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={staffForm.name}
                    onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Role</label>
                  <select
                    value={staffForm.role}
                    onChange={(e) => handleRoleChangeInForm(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="dentist">Dentist</option>
                    <option value="admin">Clinic Administrator</option>
                    <option value="hygienist">Dental Hygienist</option>
                    <option value="receptionist">Receptionist</option>
                    <option value="assistant">Dental Assistant</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Job Title</label>
                  <input
                    type="text"
                    value={staffForm.title}
                    onChange={(e) => setStaffForm({ ...staffForm, title: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Assigned Feature Permissions
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  {AVAILABLE_PERMISSIONS.map((perm) => {
                    const checked = staffForm.permissions.includes(perm.id);
                    return (
                      <label
                        key={perm.id}
                        className={`flex items-start gap-2.5 p-2 rounded-lg border transition-colors cursor-pointer ${
                          checked
                            ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePermission(perm.id)}
                          className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold leading-tight">{perm.label}</div>
                          <div className="text-[10px] text-slate-500 line-clamp-1">{perm.desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditStaffOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Save Access Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Staff Password */}
      {isResetPasswordOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full border border-slate-200 overflow-hidden animate-scaleUp">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  <span>Reset Staff Password</span>
                </h3>
                <p className="text-xs text-slate-500">For {selectedStaff.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsResetPasswordOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsResetPasswordOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resettingPw}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {resettingPw ? 'Resetting...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Practice Details */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden animate-scaleUp">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-sky-600" />
                  <span>Update Practice Credentials</span>
                </h3>
                <p className="text-xs text-slate-500">Edit address, phone, and license details</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Practice / Clinic Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">License / Accreditation #</label>
                  <input
                    type="text"
                    value={profileForm.registrationNumber}
                    onChange={(e) => setProfileForm({ ...profileForm, registrationNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Owner / Chief Officer</label>
                <input
                  type="text"
                  value={profileForm.ownerName}
                  onChange={(e) => setProfileForm({ ...profileForm, ownerName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Physical Address</label>
                <textarea
                  rows={2}
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
