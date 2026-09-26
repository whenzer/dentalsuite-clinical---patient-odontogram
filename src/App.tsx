import React, { useState, useEffect } from 'react';
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
} from './utils/storage';
import { generateRecommendedServices, evaluateMaintenanceDues } from './utils/dentalRules';
import { Sidebar, Header } from './components/Navbar';
import { CustomerManagement } from './components/CustomerManagement';
import { Odontogram } from './components/Odontogram';
import { PhotographyView } from './components/PhotographyView';
import { TreatmentLogsView } from './components/TreatmentLogsView';
import { RecommendedServicesView } from './components/RecommendedServicesView';
import { PatientPresentationView } from './components/PatientPresentationView';
import { CalendarView } from './components/CalendarView';
import { LoginPage } from './components/LoginPage';
import { AdminView } from './components/AdminView';
import { Users, ArrowRight } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => loadCurrentUser());
  const [customers, setCustomers] = useState<Customer[]>(() => loadCustomers());
  const [appointments, setAppointments] = useState<Appointment[]>(() => loadAppointments());
  const [chairs, setChairs] = useState<DentalChair[]>(() => loadChairs());
  const [shifts, setShifts] = useState<StaffShift[]>(() => loadShifts());
  const [consumables, setConsumables] = useState<ConsumableItem[]>(() => loadConsumables());
  const [determinations, setDeterminations] = useState<TreatmentDetermination[]>(() => loadDeterminations());
  const [selectedCustomerId, setSelCustId] = useState<string>(() => getSelectedCustomerId());
  const [activeTab, setActiveTab] = useState<string>('calendar');
  const [isPresentationOpen, setIsPresentationOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Authentication handlers
  const handleLogin = (user: AuthUser) => {
    setCurrentUser(user);
    saveCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    saveCurrentUser(null);
  };

  // Admin state save handlers
  const handleSaveChairs = (newChairs: DentalChair[]) => {
    setChairs(newChairs);
    saveChairs(newChairs);
  };

  const handleSaveShifts = (newShifts: StaffShift[]) => {
    setShifts(newShifts);
    saveShifts(newShifts);
  };

  const handleSaveConsumables = (newConsumables: ConsumableItem[]) => {
    setConsumables(newConsumables);
    saveConsumables(newConsumables);
  };

  const handleSaveDeterminations = (newDets: TreatmentDetermination[]) => {
    setDeterminations(newDets);
    saveDeterminations(newDets);
  };

  // Sync selected customer in storage
  const handleSelectCustomer = (id: string) => {
    setSelCustId(id);
    setSelectedCustomerId(id);
    if (!id && activeTab !== 'calendar' && activeTab !== 'admin') {
      setActiveTab('customers');
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

  const handleSaveSnapshot = (snapshot: TeethSnapshot) => {
    updateCurrentCustomer((c) => ({
      teethSnapshots: [...(c.teethSnapshots || []), snapshot],
    }));
  };

  const handleSavePhoto = (photo: DentalPhoto) => {
    updateCurrentCustomer((c) => ({
      photos: [photo, ...(c.photos || [])],
    }));
  };

  const handleDeletePhoto = (photoId: string) => {
    updateCurrentCustomer((c) => ({
      photos: (c.photos || []).filter((p) => p.id !== photoId),
      beforeAfterPairs: (c.beforeAfterPairs || []).filter(
        (ba) => ba.beforePhotoId !== photoId && ba.afterPhotoId !== photoId
      ),
    }));
  };

  const handleSaveBeforeAfterPair = (pair: BeforeAfterPair) => {
    updateCurrentCustomer((c) => ({
      beforeAfterPairs: [pair, ...(c.beforeAfterPairs || [])],
    }));
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
  };

  const handleUpdateCleaningDues = (dues: MaintenanceDue[]) => {
    updateCurrentCustomer(() => ({
      cleaningDues: evaluateMaintenanceDues(dues),
    }));
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
  };

  // Appointment & Scheduling Handlers
  const handleSaveAppointment = (appointment: Appointment, isReschedule?: boolean) => {
    setAppointments((prev) => {
      const exists = prev.some((a) => a.id === appointment.id);
      let updated: Appointment[];
      if (exists) {
        updated = prev.map((a) => (a.id === appointment.id ? appointment : a));
      } else {
        updated = [appointment, ...prev];
      }
      saveAppointments(updated);
      return updated;
    });
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
  };

  const handleUpdateAppointmentStatus = (apptId: string, status: Appointment['status']) => {
    setAppointments((prev) => {
      const updated = prev.map((a) => (a.id === apptId ? { ...a, status } : a));
      saveAppointments(updated);
      return updated;
    });
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
                  nextDueDate: '2027-03-03', // 6 months recall
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
  };

  const handleResetData = () => {
    if (window.confirm('Reset dental clinic demo records & appointments to defaults?')) {
      const defs = resetToDefaults();
      setCustomers(defs);
      handleSelectCustomer('');
      const appts = loadAppointments();
      setAppointments(appts);
    }
  };

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const activeCustomer = selectedCustomerId
    ? customers.find((c) => c.id === selectedCustomerId)
    : undefined;

  return (
    <div className="flex h-screen w-full bg-slate-100 text-slate-800 font-sans antialiased overflow-hidden">
      {/* Left Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
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
          onTabChange={setActiveTab}
          customers={customers}
          selectedCustomerId={selectedCustomerId}
          onSelectCustomer={handleSelectCustomer}
          onOpenPresentation={() => setIsPresentationOpen(true)}
          onResetData={handleResetData}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          currentUser={currentUser}
          onLogout={handleLogout}
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
                  setActiveTab('customers');
                }}
                onNavigateToPhotos={() => setActiveTab('photography')}
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
                onNavigateToTab={setActiveTab}
                onUpdateChart={handleUpdateChart}
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

            {/* Tabs requiring an active selected patient */}
            {activeTab !== 'calendar' && activeTab !== 'customers' && activeTab !== 'admin' && (
              activeCustomer ? (
                <>
                  {activeTab === 'teeth_chart' && (
                    <Odontogram
                      customer={activeCustomer}
                      onUpdateChart={handleUpdateChart}
                      onSaveSnapshot={handleSaveSnapshot}
                      onOpenPresentation={() => setIsPresentationOpen(true)}
                      onNavigateToPhotos={() => setActiveTab('photography')}
                    />
                  )}

                  {activeTab === 'photography' && (
                    <PhotographyView
                      customer={activeCustomer}
                      onSavePhoto={handleSavePhoto}
                      onDeletePhoto={handleDeletePhoto}
                      onSaveBeforeAfterPair={handleSaveBeforeAfterPair}
                    />
                  )}

                  {activeTab === 'treatment_logs' && (
                    <TreatmentLogsView
                      customer={activeCustomer}
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
                    onClick={() => setActiveTab('customers')}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors inline-flex items-center gap-2"
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
    </div>
  );
}

