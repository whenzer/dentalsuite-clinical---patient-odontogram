import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Customer,
  DentalPhoto,
  BeforeAfterPair,
  MaintenanceDue,
  RecommendedService,
  TeethChartState,
  TeethSnapshot,
  TreatmentLog,
  Appointment,
  AppointmentReminderLog,
  AttachedFile,
  AuthUser,
  DentalChair,
  StaffShift,
  ConsumableItem,
  TreatmentDetermination,
} from './types';
import {
  loadCustomers,
  saveCustomers,
  loadAppointments,
  saveAppointments,
  getSelectedCustomerId,
  setSelectedCustomerId,
  resetToDefaults,
  loadChairs,
  saveChairs,
  loadShifts,
  saveShifts,
  loadConsumables,
  saveConsumables,
  loadDeterminations,
  saveDeterminations,
  loadCurrentUser,
  saveCurrentUser,
  loadLastTopLevelTab,
  saveLastTopLevelTab,
  TopLevelTab,
} from './utils/storage';
import { generateRecommendedServices, evaluateMaintenanceDues } from './utils/dentalRules';
import { apiClient } from './services/apiClient';
import { realtimeClient } from './services/socketClient';
import { Sidebar, Header } from './components/Navbar';
import { CustomerManagement } from './components/CustomerManagement';
import { Odontogram } from './components/Odontogram';
import { PhotographyView } from './components/PhotographyView';
import { TreatmentLogsView } from './components/TreatmentLogsView';
import { RecommendedServicesView } from './components/RecommendedServicesView';
import { PatientPresentationView } from './components/PatientPresentationView';
import { CalendarView } from './components/CalendarView';
import { LoginPage } from './components/LoginPage';
import { ClinicManagementPortal } from './components/ClinicManagementPortal';
import { AdminView } from './components/AdminView';
import { BackendSettingsModal } from './components/BackendSettingsModal';
import { Users, ArrowRight } from 'lucide-react';

/**
 * Normalizes backend PatientEntity to frontend Customer model
 */
function mapPatientToCustomer(p: any): Customer {
  const chart: TeethChartState = {};
  for (let i = 1; i <= 32; i++) {
    const t = (p.teeth || []).find((rec: any) => rec.toothNumber === i);
    if (t) {
      chart[i] = {
        number: t.toothNumber,
        condition: t.condition,
        surfaces: t.surfaces || [],
        notes: t.notes,
        mobility: t.mobility,
        pocketDepthMm: t.pocketDepthMm,
        lastTreatedDate: t.lastTreatedDate,
        surfaceColors: t.surfaceColors,
      };
    } else {
      chart[i] = {
        number: i,
        condition: 'healthy',
        surfaces: [],
        mobility: 0,
        pocketDepthMm: 2,
      };
    }
  }

  return {
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    dob: p.dob,
    gender: p.gender,
    phone: p.phone,
    email: p.email,
    avatarUrl: p.avatarUrl,
    registeredDate: p.registeredDate,
    medicalAlerts: p.medicalAlerts || [],
    allergies: p.allergies || [],
    insuranceProvider: p.insuranceProvider,
    emergencyContact: p.emergencyContact,
    teethChart: chart,
    teethSnapshots: p.teethSnapshots || [],
    photos: p.photos || [],
    beforeAfterPairs: p.beforeAfterPairs || [],
    treatmentLogs: p.treatmentLogs || [],
    cleaningDues: p.cleaningDues || [],
    recommendedServices: p.recommendedServices || [],
    attachedFiles: p.attachedFiles || [],
  };
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => loadCurrentUser());
  const [customers, setCustomers] = useState<Customer[]>(() => loadCustomers());
  const [appointments, setAppointments] = useState<Appointment[]>(() => loadAppointments());
  const [chairs, setChairs] = useState<DentalChair[]>(() => loadChairs());
  const [shifts, setShifts] = useState<StaffShift[]>(() => loadShifts());
  const [consumables, setConsumables] = useState<ConsumableItem[]>(() => loadConsumables());
  const [determinations, setDeterminations] = useState<TreatmentDetermination[]>(() => loadDeterminations());
  const [selectedCustomerId, setSelCustId] = useState<string>(() => getSelectedCustomerId());
  const [activeTab, setActiveTab] = useState<string>(() => {
    const savedTab = loadLastTopLevelTab();
    const canAccessAdmin = currentUser?.permissions?.includes('admin_view') || currentUser?.role === 'admin';
    return savedTab === 'admin' && !canAccessAdmin ? 'calendar' : savedTab;
  });
  const [isPresentationOpen, setIsPresentationOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Backend connection & modal state
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const dirtyChartPatients = useRef(new Set<string>());
  const [isBackendSettingsOpen, setIsBackendSettingsOpen] = useState(false);

  // Synchronize state with NestJS + Supabase REST API
  const syncWithBackend = useCallback(async () => {
    try {
      await apiClient.checkHealth();
      setIsBackendConnected(true);

      const [patientsRes, apptsRes, chairsRes, shiftsRes, consumablesRes, detsRes] =
        await Promise.allSettled([
          apiClient.patients.getAll(),
          apiClient.appointments.getAll(),
          apiClient.admin.getChairs(),
          apiClient.admin.getShifts(),
          apiClient.admin.getConsumables(),
          apiClient.admin.getDeterminations(),
        ]);

      if (patientsRes.status === 'fulfilled' && Array.isArray(patientsRes.value)) {
        const mapped = patientsRes.value.map(mapPatientToCustomer);
        setCustomers((previous) => {
          // Keep the last known chart visible during a transient empty response.
          if (mapped.length === 0 && previous.length > 0) return previous;

          if (selectedCustomerId && mapped.length > 0 && !mapped.some((item) => item.id === selectedCustomerId)) {
            const fallbackId = mapped[0].id;
            setSelCustId(fallbackId);
            setSelectedCustomerId(fallbackId);
          }

          const merged = mapped.map((patient) => {
            const cached = previous.find((item) => item.id === patient.id);
            return dirtyChartPatients.current.has(patient.id) && cached
              ? { ...patient, teethChart: cached.teethChart }
              : patient;
          });
          saveCustomers(merged);
          return merged;
        });
      }
      if (apptsRes.status === 'fulfilled' && Array.isArray(apptsRes.value)) {
        setAppointments(apptsRes.value);
        saveAppointments(apptsRes.value);
      }
      if (chairsRes.status === 'fulfilled' && Array.isArray(chairsRes.value)) {
        setChairs(chairsRes.value);
        saveChairs(chairsRes.value);
      }
      if (shiftsRes.status === 'fulfilled' && Array.isArray(shiftsRes.value)) {
        setShifts(shiftsRes.value);
        saveShifts(shiftsRes.value);
      }
      if (consumablesRes.status === 'fulfilled' && Array.isArray(consumablesRes.value)) {
        setConsumables(consumablesRes.value);
        saveConsumables(consumablesRes.value);
      }
      if (detsRes.status === 'fulfilled' && Array.isArray(detsRes.value)) {
        setDeterminations(detsRes.value);
        saveDeterminations(detsRes.value);
      }
    } catch {
      setIsBackendConnected(false);
    }
  }, []);

  // Initial sync & token expiration listener
  useEffect(() => {
    if (!currentUser) return;

    syncWithBackend();

    // 7-day token expiration listener: prompt user to re-authenticate
    const unsubSession = apiClient.onSessionExpired(() => {
      console.warn('Session expired. Prompting login.');
      setCurrentUser(null);
      saveCurrentUser(null);
    });

    return () => {
      unsubSession();
    };
  }, [currentUser, syncWithBackend]);

  // Real-time WebSocket Gateway listener
  useEffect(() => {
    realtimeClient.connect();

    // 1. Live Odontogram updates from other clinical stations
    const unsubOdonto = realtimeClient.on('odontogram:updated', ({ patientId, chart }: any) => {
      setCustomers((prev) => {
        const updated = prev.map((c) => (c.id === patientId ? { ...c, teethChart: chart } : c));
        saveCustomers(updated);
        return updated;
      });
    });

    // 2. Live Appointment updates
    const unsubApptCreated = realtimeClient.on('appointment:created', ({ appointment }: any) => {
      setAppointments((prev) => {
        if (prev.some((a) => a.id === appointment.id)) return prev;
        return [appointment, ...prev];
      });
    });

    const unsubApptUpdated = realtimeClient.on('appointment:updated', ({ appointment }: any) => {
      setAppointments((prev) =>
        prev.map((a) => (a.id === appointment.id ? appointment : a))
      );
    });

    const unsubApptStatus = realtimeClient.on('appointment:status_changed', ({ appointment }: any) => {
      setAppointments((prev) =>
        prev.map((a) => (a.id === appointment.id ? appointment : a))
      );
    });

    // 3. Live Chair status changes
    const unsubChair = realtimeClient.on('chair:status_changed', ({ chairId, status, chair }: any) => {
      setChairs((prev) =>
        prev.map((c) => (c.id === chairId ? { ...c, status, ...chair } : c))
      );
    });

    return () => {
      unsubOdonto();
      unsubApptCreated();
      unsubApptUpdated();
      unsubApptStatus();
      unsubChair();
    };
  }, []);

  // Authentication handlers
  const handleLogin = (user: AuthUser) => {
    setCurrentUser(user);
    saveCurrentUser(user);
  };

  const handleLogout = () => {
    apiClient.auth.logout();
    setCurrentUser(null);
    saveCurrentUser(null);
  };

  const navigateToTab = (tab: string) => {
    setActiveTab(tab);
    if (
      tab === 'calendar' ||
      tab === 'customers' ||
      tab === 'admin' ||
      tab === 'odontogram' ||
      tab === 'photography' ||
      tab === 'treatments' ||
      tab === 'recommended_services'
    ) {
      saveLastTopLevelTab(tab as TopLevelTab);
    }
  };

  // Admin state save handlers + backend persistence
  const handleSaveChairs = async (newChairs: DentalChair[]) => {
    setChairs(newChairs);
    saveChairs(newChairs);
    try {
      const savedChairs = await apiClient.admin.saveChairs(newChairs);
      setChairs(savedChairs);
      saveChairs(savedChairs);
    } catch (err: any) {
      console.warn('Chairs sync note:', err.message);
    }
  };

  const handleSaveShifts = async (newShifts: StaffShift[]) => {
    setShifts(newShifts);
    saveShifts(newShifts);
    try {
      const savedShifts = await apiClient.admin.saveShifts(newShifts);
      setShifts(savedShifts);
      saveShifts(savedShifts);
    } catch (err: any) {
      console.warn('Shifts sync note:', err.message);
    }
  };

  const handleSaveConsumables = async (newConsumables: ConsumableItem[]) => {
    setConsumables(newConsumables);
    saveConsumables(newConsumables);
    try {
      const savedConsumables = await apiClient.admin.saveConsumables(newConsumables);
      setConsumables(savedConsumables);
      saveConsumables(savedConsumables);
    } catch (err: any) {
      console.warn('Consumables sync note:', err.message);
    }
  };

  const handleSaveDeterminations = async (newDets: TreatmentDetermination[]) => {
    setDeterminations(newDets);
    saveDeterminations(newDets);
    try {
      const savedDeterminations = await apiClient.admin.saveDeterminations(newDets);
      setDeterminations(savedDeterminations);
      saveDeterminations(savedDeterminations);
    } catch (err: any) {
      console.warn('Determinations sync note:', err.message);
    }
  };

  // Sync selected customer in storage
  const handleSelectCustomer = (id: string) => {
    setSelCustId(id);
    setSelectedCustomerId(id);
    if (!id && activeTab !== 'calendar' && activeTab !== 'admin') {
      navigateToTab('customers');
    }
  };

  // Helper to update active customer in state & persistence
  const updateCurrentCustomer = (
    updater: (current: Customer) => Partial<Customer>
  ) => {
    setCustomers((prevCustomers) => {
      const next = prevCustomers.map((c) => {
        if (c.id === selectedCustomerId) {
          const updatedProps = updater(c);
          const updatedCustomer: Customer = { ...c, ...updatedProps };
          // If teethChart or cleaningDues changed, automatically recalculate recommended services
          if (updatedProps.teethChart || updatedProps.cleaningDues) {
            updatedCustomer.recommendedServices = generateRecommendedServices(
              updatedCustomer.teethChart,
              updatedCustomer.cleaningDues || [],
              updatedCustomer.id
            );
          }
          return updatedCustomer;
        }
        return c;
      });
      saveCustomers(next);
      return next;
    });
  };

  // Handlers
  const handleUpdateChart = (updatedChart: TeethChartState) => {
    updateCurrentCustomer(() => ({ teethChart: updatedChart }));
  };

  const handleSaveChart = async (updatedChart: TeethChartState) => {
    if (selectedCustomerId) {
      const patientId = selectedCustomerId;
      dirtyChartPatients.current.add(patientId);
      await apiClient.odontogram.bulkUpdate(patientId, updatedChart).then(() => {
        dirtyChartPatients.current.delete(patientId);
      }).catch((err) => {
        console.warn('Odontogram backend note:', err.message);
        throw err;
      });
    }
  };

  const handleSaveSnapshot = (snapshot: TeethSnapshot) => {
    updateCurrentCustomer((c) => ({
      teethSnapshots: [...(c.teethSnapshots || []), snapshot],
    }));
    if (selectedCustomerId) {
      apiClient.odontogram
        .createSnapshot(selectedCustomerId, snapshot.visitTitle, snapshot.notes)
        .catch((err) => console.warn('Snapshot backend note:', err.message));
    }
  };

  const handleSavePhoto = (photo: DentalPhoto) => {
    updateCurrentCustomer((c) => ({
      photos: [photo, ...(c.photos || [])],
    }));
    if (selectedCustomerId) {
      apiClient.patients
        .addPhoto(selectedCustomerId, photo)
        .catch((err) => console.warn('Photo backend note:', err.message));
    }
  };

  const handleDeletePhoto = (photoId: string) => {
    updateCurrentCustomer((c) => ({
      photos: (c.photos || []).filter((p) => p.id !== photoId),
      beforeAfterPairs: (c.beforeAfterPairs || []).filter(
        (ba) => ba.beforePhotoId !== photoId && ba.afterPhotoId !== photoId
      ),
    }));
    apiClient.patients.deletePhoto(photoId).catch((err) => console.warn('Photo delete note:', err.message));
  };

  const handleSaveBeforeAfterPair = (pair: BeforeAfterPair) => {
    updateCurrentCustomer((c) => ({
      beforeAfterPairs: [pair, ...(c.beforeAfterPairs || [])],
    }));
    if (selectedCustomerId) {
      apiClient.patients
        .addBeforeAfterPair(selectedCustomerId, pair)
        .catch((err) => console.warn('Pair backend note:', err.message));
    }
  };

  const handleUpdateBeforeAfterPairs = (pairs: BeforeAfterPair[]) => {
    updateCurrentCustomer(() => ({
      beforeAfterPairs: pairs,
    }));
  };

  const handleAddTreatmentLog = (log: TreatmentLog) => {
    updateCurrentCustomer((c) => ({
      treatmentLogs: [log, ...(c.treatmentLogs || [])],
    }));
    apiClient.treatments.create(log).catch((err) => console.warn('Treatment backend note:', err.message));
  };

  const handleUpdateCleaningDues = (dues: MaintenanceDue[]) => {
    const evaluated = evaluateMaintenanceDues(dues);
    updateCurrentCustomer(() => ({
      cleaningDues: evaluated,
    }));
    if (selectedCustomerId) {
      apiClient.odontogram
        .updateMaintenanceDues(selectedCustomerId, evaluated)
        .catch((err) => console.warn('Cleaning dues backend note:', err.message));
    }
  };

  const handleUpdateRecommendations = (recs: RecommendedService[]) => {
    updateCurrentCustomer(() => ({
      recommendedServices: recs,
    }));
  };

  const handleUpdateAttachedFiles = (files: AttachedFile[]) => {
    updateCurrentCustomer(() => ({
      attachedFiles: files,
    }));
  };

  const handleAddNewCustomer = (newCustomer: Customer) => {
    const updated = [newCustomer, ...customers];
    setCustomers(updated);
    saveCustomers(updated);
    handleSelectCustomer(newCustomer.id);

    apiClient.patients
      .create({
        firstName: newCustomer.firstName,
        lastName: newCustomer.lastName,
        dob: newCustomer.dob,
        gender: newCustomer.gender,
        phone: newCustomer.phone,
        email: newCustomer.email,
        avatarUrl: newCustomer.avatarUrl,
        medicalAlerts: newCustomer.medicalAlerts,
        allergies: newCustomer.allergies,
        insuranceProvider: newCustomer.insuranceProvider,
        emergencyContact: newCustomer.emergencyContact,
      })
      .catch((err) => console.warn('Patient create backend note:', err.message));
  };

  // Appointment & Scheduling Handlers
  const handleSaveAppointment = async (appointment: Appointment, isReschedule?: boolean) => {
    try {
      let savedAppointment: Appointment;

      if (isReschedule) {
        savedAppointment = await apiClient.appointments.reschedule(
          appointment.id,
          appointment.date,
          appointment.startTime,
          appointment.durationMinutes,
        );
      } else {
        const { id: _localId, reminderLogs: _localReminderLogs, ...appointmentPayload } = appointment;
        const existing = appointments.some((item) => item.id === appointment.id);
        savedAppointment = existing
          ? await apiClient.appointments.update(appointment.id, appointmentPayload)
          : await apiClient.appointments.create(appointmentPayload);
      }

      setAppointments((prev) => {
        const exists = prev.some((item) => item.id === savedAppointment.id);
        const updated = exists
          ? prev.map((item) => (item.id === savedAppointment.id ? savedAppointment : item))
          : [savedAppointment, ...prev.filter((item) => item.id !== appointment.id)];
        saveAppointments(updated);
        return updated;
      });
    } catch (err: any) {
      console.warn(isReschedule ? 'Appointment reschedule note:' : 'Appointment save note:', err.message);
    }
  };

  const handleCancelAppointment = (apptId: string, reason: string) => {
    setAppointments((prev) => {
      const updated = prev.map((a) => {
        if (a.id === apptId) {
          const cancelLog: AppointmentReminderLog = {
            id: `rem-cancel-${Date.now()}`,
            type: a.reminderPreference === 'email' ? 'email' : 'sms',
            recipient: a.reminderPreference === 'email' ? a.customerEmail : a.customerPhone,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
            trigger: 'cancellation_notice',
            message: `DentalSuite: Appointment cancelled (${reason}). Reply or call to reschedule.`,
            status: 'delivered',
          };

          return {
            ...a,
            status: 'cancelled' as const,
            notes: a.notes ? `${a.notes} [Cancelled: ${reason}]` : `Cancelled: ${reason}`,
            reminderLogs: [...(a.reminderLogs || []), cancelLog],
          };
        }
        return a;
      });
      saveAppointments(updated);
      return updated;
    });

    apiClient.appointments
      .updateStatus(apptId, 'cancelled', reason)
      .catch((err) => console.warn('Appointment cancel note:', err.message));
  };

  const handleUpdateAppointmentStatus = (apptId: string, status: Appointment['status']) => {
    setAppointments((prev) => {
      const updated = prev.map((a) => (a.id === apptId ? { ...a, status } : a));
      saveAppointments(updated);
      return updated;
    });

    apiClient.appointments
      .updateStatus(apptId, status)
      .catch((err) => console.warn('Appointment status note:', err.message));
  };

  const handleAddReminderLog = (apptId: string, log: AppointmentReminderLog) => {
    setAppointments((prev) => {
      const updated = prev.map((a) =>
        a.id === apptId
          ? { ...a, reminderLogs: [...(a.reminderLogs || []), log] }
          : a
      );
      saveAppointments(updated);
      return updated;
    });
  };

  const handleToggleAutomatedReminders = (apptId: string, enabled: boolean) => {
    setAppointments((prev) => {
      const updated = prev.map((a) =>
        a.id === apptId ? { ...a, automatedRemindersEnabled: enabled } : a
      );
      saveAppointments(updated);
      return updated;
    });

    apiClient.appointments
      .update(apptId, { automatedRemindersEnabled: enabled })
      .catch((err) => console.warn('Reminders toggle note:', err.message));
  };

  // Complete clinical session: updates appointment to completed, logs treatment, saves photos & before/after pair to customer
  const handleCompleteClinicalSession = (data: {
    treatmentLog: TreatmentLog;
    newPhotos: DentalPhoto[];
    newBeforeAfterPair?: BeforeAfterPair;
    appointmentId: string;
    completedAt: string;
  }) => {
    // 1. Update appointment
    setAppointments((prev) => {
      const updated = prev.map((a) => {
        if (a.id === data.appointmentId) {
          return {
            ...a,
            status: 'completed' as const,
            treatmentLogId: data.treatmentLog.id,
            sessionPhotosCount: data.newPhotos.length,
          };
        }
        return a;
      });
      saveAppointments(updated);
      return updated;
    });

    apiClient.appointments
      .updateStatus(data.appointmentId, 'completed')
      .catch((err) => console.warn('Appointment complete note:', err.message));

    // 2. Update the patient record
    setCustomers((prevCustomers) => {
      const updated = prevCustomers.map((cust) => {
        if (cust.id === data.treatmentLog.customerId) {
          const updatedLogs = [data.treatmentLog, ...(cust.treatmentLogs || [])];
          const updatedPhotos = [...data.newPhotos, ...(cust.photos || [])];
          const updatedBAPairs = data.newBeforeAfterPair
            ? [data.newBeforeAfterPair, ...(cust.beforeAfterPairs || [])]
            : cust.beforeAfterPairs || [];

          // If procedure was cleaning or prophylaxis, update cleaning dues to up_to_date
          let updatedDues = cust.cleaningDues || [];
          if (
            data.treatmentLog.procedureName.toLowerCase().includes('clean') ||
            data.treatmentLog.procedureName.toLowerCase().includes('prophylaxis') ||
            data.treatmentLog.category === 'Preventive'
          ) {
            updatedDues = updatedDues.map((d) => {
              if (d.type.toLowerCase().includes('cleaning') || d.type.toLowerCase().includes('exam')) {
                return {
                  ...d,
                  lastCompletedDate: data.completedAt,
                  status: 'up_to_date' as const,
                  nextDueDate: '2027-03-03',
                };
              }
              return d;
            });
          }

          const newCust: Customer = {
            ...cust,
            lastVisitDate: data.completedAt,
            treatmentLogs: updatedLogs,
            photos: updatedPhotos,
            beforeAfterPairs: updatedBAPairs,
            cleaningDues: evaluateMaintenanceDues(updatedDues),
          };

          // Recalculate recommendations
          newCust.recommendedServices = generateRecommendedServices(
            newCust.teethChart,
            newCust.cleaningDues || [],
            newCust.id
          );

          return newCust;
        }
        return cust;
      });

      saveCustomers(updated);
      return updated;
    });

    apiClient.treatments.create(data.treatmentLog).catch((err) => {
      console.warn('Treatment create note:', err.message);
    });
  };

  const handleResetData = async () => {
    await syncWithBackend();
  };

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Clinic Organization Account -> Render dedicated Clinic Management Portal
  if (currentUser.accountType === 'clinic') {
    return (
      <ClinicManagementPortal
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchToStaffLogin={() => {
          handleLogout();
        }}
      />
    );
  }

  const activeCustomer = selectedCustomerId
    ? customers.find((c) => c.id === selectedCustomerId)
    : undefined;

  return (
    <div className="flex h-screen w-full bg-slate-100 text-slate-800 font-sans antialiased overflow-hidden">
      {/* Left Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={navigateToTab}
        customers={customers}
        appointments={appointments}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Column */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Header & Clinical Navigation */}
        <Header
          activeTab={activeTab}
          onTabChange={navigateToTab}
          customers={customers}
          selectedCustomerId={selectedCustomerId}
          onSelectCustomer={handleSelectCustomer}
          onOpenPresentation={() => setIsPresentationOpen(true)}
          onResetData={handleResetData}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          currentUser={currentUser}
          onLogout={handleLogout}
          isBackendConnected={isBackendConnected}
          onOpenBackendSettings={() => setIsBackendSettingsOpen(true)}
        />

        {/* Scrollable Main Content Canvas */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Calendar & Staff Scheduling Hub */}
            {activeTab === 'calendar' && (
              <CalendarView
                appointments={appointments}
                customers={customers}
                selectedCustomerId={selectedCustomerId}
                onSelectCustomer={handleSelectCustomer}
                onSaveAppointment={handleSaveAppointment}
                onCancelAppointment={handleCancelAppointment}
                onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
                onAddReminderLog={handleAddReminderLog}
                onToggleAutomatedReminders={handleToggleAutomatedReminders}
                onCompleteClinicalSession={handleCompleteClinicalSession}
                onNavigateToCustomer={(custId) => {
                  handleSelectCustomer(custId);
                  navigateToTab('customers');
                }}
                onNavigateToPhotos={() => navigateToTab('photography')}
              />
            )}

            {/* Patients Tab: Always accessible, renders Selection Screen or Profile */}
            {activeTab === 'customers' && (
              <CustomerManagement
                customers={customers}
                selectedCustomerId={selectedCustomerId}
                appointments={appointments}
                determinations={determinations}
                onSelectCustomer={handleSelectCustomer}
                onAddNewCustomer={handleAddNewCustomer}
                onUpdateAttachedFiles={handleUpdateAttachedFiles}
                onUpdateRecommendations={handleUpdateRecommendations}
                onAddTreatmentLog={handleAddTreatmentLog}
                onUpdateCleaningDues={handleUpdateCleaningDues}
                onSavePhoto={handleSavePhoto}
                onDeletePhoto={handleDeletePhoto}
                onSaveBeforeAfterPair={handleSaveBeforeAfterPair}
                onUpdateBeforeAfterPairs={handleUpdateBeforeAfterPairs}
                onOpenPresentation={() => setIsPresentationOpen(true)}
                onNavigateToTab={navigateToTab}
                onUpdateChart={handleUpdateChart}
                onSaveChart={handleSaveChart}
              />
            )}

            {/* Admin Tab: Chairs, Shifts, Consumables & Responsive Determination Table */}
            {activeTab === 'admin' && (
              <AdminView
                chairs={chairs}
                shifts={shifts}
                consumables={consumables}
                determinations={determinations}
                onSaveChairs={handleSaveChairs}
                onSaveShifts={handleSaveShifts}
                onSaveConsumables={handleSaveConsumables}
                onSaveDeterminations={handleSaveDeterminations}
              />
            )}

            {/* Patient Context Dependent Views */}
            {activeTab !== 'calendar' && activeTab !== 'customers' && activeTab !== 'admin' && (
              activeCustomer ? (
                <>
                  {activeTab === 'odontogram' && (
                    <Odontogram
                      customer={activeCustomer}
                      onUpdateChart={handleUpdateChart}
                      onSaveSnapshot={handleSaveSnapshot}
                    />
                  )}

                  {activeTab === 'photography' && (
                    <PhotographyView
                      customer={activeCustomer}
                      onSavePhoto={handleSavePhoto}
                      onDeletePhoto={handleDeletePhoto}
                      onSaveBeforeAfterPair={handleSaveBeforeAfterPair}
                      onUpdateBeforeAfterPairs={handleUpdateBeforeAfterPairs}
                    />
                  )}

                  {activeTab === 'treatments' && (
                    <TreatmentLogsView
                      customer={activeCustomer}
                      determinations={determinations}
                      onAddTreatmentLog={handleAddTreatmentLog}
                      onUpdateCleaningDues={handleUpdateCleaningDues}
                    />
                  )}

                  {activeTab === 'recommended_services' && (
                    <RecommendedServicesView
                      customer={activeCustomer}
                      onUpdateRecommendations={handleUpdateRecommendations}
                    />
                  )}
                </>
              ) : (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">
                    No Patient Selected
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Please select a patient from the patient queue to access their clinical photography, treatments, and care plans.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigateToTab('customers')}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors inline-flex items-center gap-2 cursor-pointer"
                  >
                    <span>Go to Patient Selection</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            )}
          </div>
        </main>
      </div>

      {/* Patient Presentation Mode Modal */}
      {isPresentationOpen && activeCustomer && (
        <PatientPresentationView
          customer={activeCustomer}
          onClose={() => setIsPresentationOpen(false)}
        />
      )}

      {/* Backend & Cloud Database Settings Modal */}
      <BackendSettingsModal
        isOpen={isBackendSettingsOpen}
        onClose={() => setIsBackendSettingsOpen(false)}
        onSyncTrigger={syncWithBackend}
        isConnected={isBackendConnected}
      />
    </div>
  );
}
