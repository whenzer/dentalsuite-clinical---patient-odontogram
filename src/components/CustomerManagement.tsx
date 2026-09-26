import React, { useState, useMemo } from 'react';
import {
  Customer,
  Appointment,
  AttachedFile,
  RecommendedService,
  TreatmentLog,
  MaintenanceDue,
  DentalPhoto,
  BeforeAfterPair,
  ToothNumber,
  TeethChartState,
  TreatmentDetermination,
  UrgencyLevel,
} from '../types';
import { createDefaultTeethChart } from '../data/mockData';
import { generateRecommendedServices } from '../utils/dentalRules';
import { INITIAL_TREATMENT_DETERMINATIONS } from '../data/adminMasterData';
import {
  formatPHP,
  formatPHPRange,
  getTreatmentUrgency,
  sortTreatmentsByUrgency,
  findDetermination,
  URGENCY_TIERS,
} from '../utils/urgencyRules';
import { AttachedFilesSection } from './AttachedFilesSection';
import { DentalChartingTab } from './DentalChartingTab';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  AlertTriangle,
  CheckCircle2,
  Camera,
  FileText,
  HeartPulse,
  ChevronDown,
  ChevronUp,
  Clock,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Layers,
  CalendarCheck,
  Stethoscope,
  Filter,
  Presentation,
  Check,
  Sparkles,
  Sliders,
  Trash2,
  Upload,
  X,
  ArrowRightLeft,
  LayoutGrid,
  Tv,
  Video,
  Package,
} from 'lucide-react';

interface CustomerManagementProps {
  customers: Customer[];
  selectedCustomerId?: string;
  appointments?: Appointment[];
  determinations?: TreatmentDetermination[];
  onSelectCustomer: (id: string) => void;
  onAddNewCustomer: (customer: Customer) => void;
  onUpdateAttachedFiles?: (files: AttachedFile[]) => void;
  onUpdateRecommendations?: (recs: RecommendedService[]) => void;
  onAddTreatmentLog?: (log: TreatmentLog) => void;
  onUpdateCleaningDues?: (dues: MaintenanceDue[]) => void;
  onSavePhoto?: (photo: DentalPhoto) => void;
  onDeletePhoto?: (photoId: string) => void;
  onSaveBeforeAfterPair?: (pair: BeforeAfterPair) => void;
  onUpdateBeforeAfterPairs?: (pairs: BeforeAfterPair[]) => void;
  onOpenPresentation?: () => void;
  onNavigateToTab?: (tab: string) => void;
  onUpdateChart?: (updatedChart: TeethChartState) => void;
}

export type PatientTab =
  | 'charting'
  | 'dues'
  | 'treatments'
  | 'photography'
  | 'attachedFiles'
  | 'carePlans';

export const CustomerManagement: React.FC<CustomerManagementProps> = ({
  customers,
  selectedCustomerId,
  appointments = [],
  determinations = INITIAL_TREATMENT_DETERMINATIONS,
  onSelectCustomer,
  onAddNewCustomer,
  onUpdateAttachedFiles,
  onUpdateRecommendations,
  onAddTreatmentLog,
  onUpdateCleaningDues,
  onSavePhoto,
  onDeletePhoto,
  onSaveBeforeAfterPair,
  onUpdateBeforeAfterPairs,
  onOpenPresentation,
  onNavigateToTab,
  onUpdateChart,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<
    'all' | 'today_schedule' | 'overdue' | 'due_soon' | 'has_files'
  >('all');
  const [sortBy, setSortBy] = useState<'schedule_closest' | 'name' | 'overdue'>('schedule_closest');
  const [showAddModal, setShowAddModal] = useState(false);

  // Master Determination Table Picker Modal State
  const [showDeterminationPicker, setShowDeterminationPicker] = useState(false);
  const [detPickerCategory, setDetPickerCategory] = useState<'all' | UrgencyLevel>('all');

  // Single tab display state for patient view: opens clicked tab as a div and closes other open tabs
  const [activePatientTab, setActivePatientTab] = useState<PatientTab>('charting');

  const jumpToSection = (section: PatientTab) => {
    setActivePatientTab(section);
  };

  // Add Customer Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('1990-01-01');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Female');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [medicalAlerts, setMedicalAlerts] = useState('');
  const [allergies, setAllergies] = useState('');
  const [insurance, setInsurance] = useState('');

  // Modals for Care Plans, Treatment History, and Photos
  const [showAddRecModal, setShowAddRecModal] = useState(false);
  const [recTitle, setRecTitle] = useState('');
  const [recReason, setRecReason] = useState('');
  const [recCategory, setRecCategory] = useState('Restorative');
  const [recPriority, setRecPriority] = useState<'urgent' | 'high' | 'routine'>('high');
  const [recFee, setRecFee] = useState(2500); // Standard PHP starting fee
  const [recTeeth, setRecTeeth] = useState('');
  const [selectedDetIdForModal, setSelectedDetIdForModal] = useState<string>('');

  const [showAddLogModal, setShowAddLogModal] = useState(false);
  const [logProcedure, setLogProcedure] = useState('');
  const [logCategory, setLogCategory] = useState<
    'Preventive' | 'Restorative' | 'Endodontic' | 'Periodontic' | 'Oral Surgery' | 'Cosmetic' | 'Orthodontic'
  >('Restorative');
  const [logDoctor, setLogDoctor] = useState('Dr. Marcus Vance, DDS');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [logTeeth, setLogTeeth] = useState('');
  const [logCost, setLogCost] = useState(250);
  const [logNotes, setLogNotes] = useState('');

  const [showAddPhotoModal, setShowAddPhotoModal] = useState(false);
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoCategory, setPhotoCategory] = useState<
    'intraoral' | 'extraoral' | 'xray' | 'pre_op' | 'post_op' | 'smile' | 'other'
  >('intraoral');
  const [photoStage, setPhotoStage] = useState<'before' | 'after' | 'standard'>('before');
  const [photoUrl, setPhotoUrl] = useState('https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800&auto=format&fit=crop&q=60');
  const [photoTeeth, setPhotoTeeth] = useState('');

  // Before & After Group State & Controls
  const [activeGroupIndex, setActiveGroupIndex] = useState<number>(0);
  const [comparisonViewMode, setComparisonViewMode] = useState<'side_by_side' | 'slider'>('side_by_side');
  const [sliderPosition, setSliderPosition] = useState(50);
  const [photoFilterCategory, setPhotoFilterCategory] = useState<string>('all');

  // Selected customer object
  const selectedCustomer = selectedCustomerId
    ? customers.find((c) => c.id === selectedCustomerId)
    : undefined;

  // Helper to find closest appointment for a customer
  const getCustomerScheduleInfo = (customerId: string) => {
    const custAppts = appointments.filter((a) => a.customerId === customerId);
    if (custAppts.length === 0) return null;

    const todayStr = '2026-09-03';

    // Prioritize today's appointments first
    const todayAppts = custAppts.filter((a) => a.date === todayStr);
    if (todayAppts.length > 0) {
      const inProg = todayAppts.find((a) => a.status === 'in_progress');
      if (inProg) return { appointment: inProg, proximityScore: 0, label: `Today ${inProg.startTime} (In Progress)` };

      const upcomingToday = todayAppts
        .filter((a) => a.status === 'scheduled' || a.status === 'confirmed')
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      if (upcomingToday.length > 0) {
        const first = upcomingToday[0];
        return {
          appointment: first,
          proximityScore: 10 + parseInt(first.startTime.replace(':', ''), 10),
          label: `Today ${first.startTime} (${first.procedureCategory})`,
        };
      }

      const anyToday = todayAppts[0];
      return { appointment: anyToday, proximityScore: 50, label: `Today ${anyToday.startTime}` };
    }

    // Future appointments
    const futureAppts = custAppts
      .filter((a) => a.date > todayStr && a.status !== 'cancelled')
      .sort((a, b) => a.date.localeCompare(b.date));
    if (futureAppts.length > 0) {
      const next = futureAppts[0];
      return {
        appointment: next,
        proximityScore: 1000,
        label: `${next.date} at ${next.startTime}`,
      };
    }

    // Past appointments
    const pastAppts = custAppts
      .filter((a) => a.date < todayStr && a.status !== 'cancelled')
      .sort((a, b) => b.date.localeCompare(a.date));
    if (pastAppts.length > 0) {
      return { appointment: pastAppts[0], proximityScore: 9000, label: `Last visit: ${pastAppts[0].date}` };
    }

    return null;
  };

  // Filtered and Sorted Customers for Selection Screen
  const processedCustomers = useMemo(() => {
    let list = customers.filter((c) => {
      const full = `${c.firstName} ${c.lastName}`.toLowerCase();
      const matchSearch =
        full.includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.id.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      const cleaningDue = c.cleaningDues?.find((d) => d.type.includes('Cleaning'));
      const isOverdue = cleaningDue?.status === 'overdue';
      const isDueSoon = cleaningDue?.status === 'due_soon';
      const hasFiles = (c.attachedFiles && c.attachedFiles.length > 0) || false;
      const scheduleInfo = getCustomerScheduleInfo(c.id);
      const isTodaySchedule = scheduleInfo && scheduleInfo.label.startsWith('Today');

      if (filterType === 'today_schedule') return !!isTodaySchedule;
      if (filterType === 'overdue') return isOverdue;
      if (filterType === 'due_soon') return isDueSoon;
      if (filterType === 'has_files') return hasFiles;

      return true;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === 'schedule_closest') {
        const schedA = getCustomerScheduleInfo(a.id);
        const schedB = getCustomerScheduleInfo(b.id);
        const scoreA = schedA !== null ? schedA.proximityScore : 99999;
        const scoreB = schedB !== null ? schedB.proximityScore : 99999;
        if (scoreA !== scoreB) {
          return scoreA - scoreB;
        }
        return `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`);
      }

      if (sortBy === 'overdue') {
        const dueA = a.cleaningDues?.find((d) => d.type.includes('Cleaning'))?.status === 'overdue';
        const dueB = b.cleaningDues?.find((d) => d.type.includes('Cleaning'))?.status === 'overdue';
        if (dueA && !dueB) return -1;
        if (!dueA && dueB) return 1;
        return `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`);
      }

      return `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`);
    });

    return list;
  }, [customers, searchTerm, filterType, sortBy, appointments]);

  const handleCreateCustomer = () => {
    if (!firstName.trim() || !lastName.trim()) return;

    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dob,
      gender,
      phone: phone || '(555) 000-0000',
      email: email || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      registeredDate: new Date().toISOString().split('T')[0],
      medicalAlerts: medicalAlerts ? medicalAlerts.split(',').map((s) => s.trim()) : [],
      allergies: allergies ? allergies.split(',').map((s) => s.trim()) : [],
      insuranceProvider: insurance || 'Private Insurance',
      teethChart: createDefaultTeethChart(),
      teethSnapshots: [],
      cleaningDues: [
        {
          type: 'Prophylaxis (Cleaning)',
          intervalMonths: 6,
          lastDoneDate: '2026-03-01',
          nextDueDate: '2026-09-01',
          status: 'overdue',
        },
      ],
      attachedFiles: [],
      treatmentLogs: [],
      recommendedServices: [],
      photos: [],
      beforeAfterPairs: [],
    };

    onAddNewCustomer(newCust);
    setShowAddModal(false);
    setFirstName('');
    setLastName('');
    setPhone('');
    setEmail('');
    setMedicalAlerts('');
    setAllergies('');
    setInsurance('');
  };

  const handleUnselect = () => {
    onSelectCustomer('');
  };

  // Care Plan Handlers
  const handleToggleScheduleRec = (recId: string) => {
    if (!selectedCustomer) return;
    const currentRecs = selectedCustomer.recommendedServices || [];
    const updated = currentRecs.map((r) =>
      r.id === recId ? { ...r, addedToSchedule: !r.addedToSchedule } : r
    );
    if (onUpdateRecommendations) {
      onUpdateRecommendations(updated);
    }
  };

  const handleAddDeterminationToCarePlan = (det: TreatmentDetermination) => {
    if (!selectedCustomer) return;

    const newRec: RecommendedService = {
      id: `rec-det-${Date.now()}`,
      customerId: selectedCustomer.id,
      title: det.treatmentName,
      category:
        det.urgencyGroup === 'Emergency'
          ? 'Emergency Care'
          : det.urgencyGroup === 'LongProcedure'
          ? 'Specialized Restorative'
          : 'Preventive & Maintenance',
      priority:
        det.urgencyGroup === 'Emergency'
          ? 'urgent'
          : det.urgencyGroup === 'LongProcedure'
          ? 'high'
          : 'routine',
      suggestedNextVisitTimeframe:
        det.urgencyGroup === 'Emergency'
          ? 'Immediate / Today'
          : det.urgencyGroup === 'LongProcedure'
          ? 'Next 1-2 Weeks'
          : 'Routine Recall',
      estimatedFee: Math.round((det.minAmountPhp + det.maxAmountPhp) / 2),
      reason: det.indication || det.description || 'Recommended from clinic determination master protocol.',
      relatedTeeth: [],
      addedToSchedule: true,
      preemptive: det.urgencyGroup === 'MaintenanceElective',
      urgencyGroup: det.urgencyGroup,
      determinationId: det.id,
      minAmountPhp: det.minAmountPhp,
      maxAmountPhp: det.maxAmountPhp,
      durationMinutes: Math.round((det.minDurationMinutes + det.maxDurationMinutes) / 2),
      consumables: det.commonlyUsedConsumables,
    };

    const currentRecs = selectedCustomer.recommendedServices || [];
    const updated = [newRec, ...currentRecs];
    if (onUpdateRecommendations) {
      onUpdateRecommendations(updated);
    }
    setShowDeterminationPicker(false);
  };

  const handleAddRecSubmit = () => {
    if (!selectedCustomer || !recTitle.trim()) return;
    const parsedTeeth = recTeeth
      ? (recTeeth.split(',').map((t) => parseInt(t.trim(), 10)).filter((n) => !isNaN(n)) as ToothNumber[])
      : [];

    const matchedDet = findDetermination(recTitle, determinations);

    const newRec: RecommendedService = {
      id: `rec-${Date.now()}`,
      customerId: selectedCustomer.id,
      title: recTitle.trim(),
      category: recCategory,
      priority: recPriority,
      suggestedNextVisitTimeframe: recPriority === 'urgent' ? 'Within 1-2 weeks' : 'Next 6-Month Visit',
      estimatedFee: Number(recFee) || (matchedDet ? Math.round((matchedDet.minAmountPhp + matchedDet.maxAmountPhp) / 2) : 2500),
      reason: recReason.trim() || (matchedDet?.indication || 'Clinically indicated based on dental examination'),
      relatedTeeth: parsedTeeth,
      addedToSchedule: false,
      preemptive: recPriority === 'routine',
      urgencyGroup: matchedDet?.urgencyGroup,
      determinationId: matchedDet?.id,
      minAmountPhp: matchedDet?.minAmountPhp,
      maxAmountPhp: matchedDet?.maxAmountPhp,
      durationMinutes: matchedDet ? Math.round((matchedDet.minDurationMinutes + matchedDet.maxDurationMinutes) / 2) : 45,
      consumables: matchedDet?.commonlyUsedConsumables,
    };

    const currentRecs = selectedCustomer.recommendedServices || [];
    const updated = [newRec, ...currentRecs];
    if (onUpdateRecommendations) {
      onUpdateRecommendations(updated);
    }
    setShowAddRecModal(false);
    setRecTitle('');
    setRecReason('');
    setRecTeeth('');
    setRecFee(2500);
  };

  const handleDeleteRec = (recId: string) => {
    if (!selectedCustomer) return;
    const currentRecs = selectedCustomer.recommendedServices || [];
    const updated = currentRecs.filter((r) => r.id !== recId);
    if (onUpdateRecommendations) {
      onUpdateRecommendations(updated);
    }
  };

  const handleAutoAnalyzeExam = () => {
    if (!selectedCustomer) return;
    const computed = generateRecommendedServices(
      selectedCustomer.teethChart,
      selectedCustomer.cleaningDues || [],
      selectedCustomer.id
    );
    if (onUpdateRecommendations) {
      onUpdateRecommendations(computed);
    }
  };

  // Treatment Log Handlers
  const handleAddLogSubmit = () => {
    if (!selectedCustomer || !logProcedure.trim()) return;
    const parsedTeeth = logTeeth
      ? (logTeeth.split(',').map((t) => parseInt(t.trim(), 10)).filter((n) => !isNaN(n)) as ToothNumber[])
      : [];

    const matchedDet = findDetermination(logProcedure, determinations);

    const newLog: TreatmentLog = {
      id: `log-${Date.now()}`,
      customerId: selectedCustomer.id,
      procedureName: logProcedure.trim(),
      category: logCategory,
      date: logDate,
      doctorName: logDoctor,
      teethInvolved: parsedTeeth,
      clinicalNotes: logNotes.trim() || (matchedDet ? `Clinical protocol completed according to standard master guidelines. ${matchedDet.description || ''}` : 'Procedure completed successfully without complications.'),
      cost: Number(logCost) || (matchedDet ? Math.round((matchedDet.minAmountPhp + matchedDet.maxAmountPhp) / 2) : 2500),
      status: 'Completed',
      urgencyGroup: matchedDet?.urgencyGroup,
      determinationId: matchedDet?.id,
      minAmountPhp: matchedDet?.minAmountPhp,
      maxAmountPhp: matchedDet?.maxAmountPhp,
      durationMinutes: matchedDet ? Math.round((matchedDet.minDurationMinutes + matchedDet.maxDurationMinutes) / 2) : 45,
      consumables: matchedDet?.commonlyUsedConsumables,
    };

    if (onAddTreatmentLog) {
      onAddTreatmentLog(newLog);
    }
    setShowAddLogModal(false);
    setLogProcedure('');
    setLogNotes('');
    setLogTeeth('');
    setLogCost(2500);
  };

  const handleQuickProphylaxisToday = () => {
    if (!selectedCustomer) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const prophyDet = findDetermination('Oral Prophylaxis', determinations);

    const newLog: TreatmentLog = {
      id: `log-clean-${Date.now()}`,
      customerId: selectedCustomer.id,
      procedureName: 'Comprehensive Oral Prophylaxis & Polish',
      category: 'Preventive',
      date: todayStr,
      doctorName: 'Lisa Ray, RDH',
      teethInvolved: [],
      clinicalNotes: 'Supra/subgingival ultrasonic scaling, bacterial tartar clearing, prophy paste polish, and 5% sodium fluoride varnish.',
      cost: 1800,
      status: 'Completed',
      urgencyGroup: 'MaintenanceElective',
      durationMinutes: 30,
      consumables: prophyDet?.commonlyUsedConsumables,
    };

    if (onAddTreatmentLog) {
      onAddTreatmentLog(newLog);
    }

    if (onUpdateCleaningDues && selectedCustomer.cleaningDues) {
      const sixMonths = new Date();
      sixMonths.setMonth(sixMonths.getMonth() + 6);
      const nextDueStr = sixMonths.toISOString().split('T')[0];

      const updatedDues = selectedCustomer.cleaningDues.map((d) => {
        if (d.type.includes('Cleaning') || d.type.includes('Prophylaxis')) {
          return {
            ...d,
            lastDoneDate: todayStr,
            nextDueDate: nextDueStr,
            status: 'up_to_date' as const,
          };
        }
        return d;
      });
      onUpdateCleaningDues(updatedDues);
    }
  };

  // Photo Handlers
  const handleAddPhotoSubmit = () => {
    if (!selectedCustomer || !photoCaption.trim()) return;
    const parsedTeeth = photoTeeth
      ? (photoTeeth.split(',').map((t) => parseInt(t.trim(), 10)).filter((n) => !isNaN(n)) as ToothNumber[])
      : [];

    const newPhoto: DentalPhoto = {
      id: `photo-${Date.now()}`,
      customerId: selectedCustomer.id,
      caption: photoCaption.trim(),
      category: photoCategory,
      stage: photoStage,
      url: photoUrl,
      takenAt: new Date().toISOString().split('T')[0],
      relatedTeeth: parsedTeeth,
    };

    if (onSavePhoto) {
      onSavePhoto(newPhoto);
    }
    setShowAddPhotoModal(false);
    setPhotoCaption('');
    setPhotoTeeth('');
  };

  // =========================================================================
  // B&A GROUPS LOGIC: Right-Clicking Files & Setting as Before / After
  // =========================================================================
  const effectivePairs: BeforeAfterPair[] = useMemo(() => {
    if (!selectedCustomer) return [];
    if (selectedCustomer.beforeAfterPairs && selectedCustomer.beforeAfterPairs.length > 0) {
      return selectedCustomer.beforeAfterPairs;
    }
    // Default initial pair if customer has photos
    if (selectedCustomer.photos && selectedCustomer.photos.length >= 2) {
      return [
        {
          id: `ba-default-${selectedCustomer.id}`,
          customerId: selectedCustomer.id,
          title: 'Group 1: Clinical Transformation',
          beforePhotoId: selectedCustomer.photos[0].id,
          afterPhotoId: selectedCustomer.photos[1].id,
          dateCreated: '2026-09-01',
          notes: 'Pre-operative and post-operative clinical comparison',
        },
      ];
    }
    return [
      {
        id: `ba-new-${selectedCustomer.id}`,
        customerId: selectedCustomer.id,
        title: 'Group 1: Initial Examination Comparison',
        beforePhotoId: selectedCustomer.photos?.[0]?.id || '',
        afterPhotoId: '',
        dateCreated: '2026-09-01',
        notes: 'Clinical comparison pair',
      },
    ];
  }, [selectedCustomer]);

  const recommendations = useMemo(() => {
    return selectedCustomer?.recommendedServices || [];
  }, [selectedCustomer?.recommendedServices]);

  const sortedRecommendations = useMemo(() => {
    return sortTreatmentsByUrgency(recommendations);
  }, [recommendations]);

  const treatmentLogs = useMemo(() => {
    return selectedCustomer?.treatmentLogs || [];
  }, [selectedCustomer?.treatmentLogs]);

  const sortedTreatmentLogs = useMemo(() => {
    return sortTreatmentsByUrgency(treatmentLogs);
  }, [treatmentLogs]);

  const safeGroupIndex = Math.min(
    activeGroupIndex,
    Math.max(0, effectivePairs.length - 1)
  );
  const currentPair = effectivePairs[safeGroupIndex] || null;

  // Resolve image for Before or After from Photos OR from Files
  const resolveImageObj = (idOrUrl: string) => {
    if (!idOrUrl || !selectedCustomer) return null;
    const photo = (selectedCustomer.photos || []).find(
      (p) => p.id === idOrUrl || p.url === idOrUrl
    );
    if (photo) {
      return {
        id: photo.id,
        url: photo.url,
        title: photo.caption,
        date: photo.takenAt,
        category: photo.category,
      };
    }
    const file = (selectedCustomer.attachedFiles || []).find(
      (f) => f.id === idOrUrl || f.url === idOrUrl
    );
    if (file) {
      return {
        id: file.id,
        url: file.url,
        title: file.name,
        date: file.uploadDate,
        category: file.category,
      };
    }
    return null;
  };

  const currentBeforeObj = currentPair ? resolveImageObj(currentPair.beforePhotoId) : null;
  const currentAfterObj = currentPair ? resolveImageObj(currentPair.afterPhotoId) : null;

  // Handler for setting a file as Before or After in a group
  const handleSetFileAsBeforeAfter = (
    file: AttachedFile,
    role: 'before' | 'after',
    groupIndex: number | 'new'
  ) => {
    if (!selectedCustomer) return;

    // Ensure photo exists in customer photos for consistency
    const existingPhoto = (selectedCustomer.photos || []).find((p) => p.url === file.url || p.id === file.id);
    if (!existingPhoto && onSavePhoto) {
      const newPhoto: DentalPhoto = {
        id: `photo-${file.id}`,
        customerId: selectedCustomer.id,
        caption: file.name,
        category: file.category === 'xray' ? 'xray' : 'intraoral',
        stage: role,
        url: file.url,
        takenAt: file.uploadDate,
        relatedTeeth: file.relatedTeeth,
      };
      onSavePhoto(newPhoto);
    }

    let updatedPairs: BeforeAfterPair[] = [...effectivePairs];

    if (groupIndex === 'new') {
      const newPair: BeforeAfterPair = {
        id: `ba-${Date.now()}`,
        customerId: selectedCustomer.id,
        title: `Group ${effectivePairs.length + 1}: ${file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')}`,
        beforePhotoId: role === 'before' ? file.id : '',
        afterPhotoId: role === 'after' ? file.id : '',
        dateCreated: new Date().toISOString().split('T')[0],
        notes: `Clinical case group created from Files`,
        relatedTeeth: file.relatedTeeth,
      };
      updatedPairs = [...updatedPairs, newPair];
      if (onUpdateBeforeAfterPairs) {
        onUpdateBeforeAfterPairs(updatedPairs);
      }
      setActiveGroupIndex(updatedPairs.length - 1);
    } else {
      const targetIdx = groupIndex;
      updatedPairs = updatedPairs.map((p, idx) => {
        if (idx === targetIdx) {
          return {
            ...p,
            beforePhotoId: role === 'before' ? file.id : p.beforePhotoId,
            afterPhotoId: role === 'after' ? file.id : p.afterPhotoId,
          };
        }
        return p;
      });
      if (onUpdateBeforeAfterPairs) {
        onUpdateBeforeAfterPairs(updatedPairs);
      }
      setActiveGroupIndex(targetIdx);
    }

    // Switch to Clinical Photography tab so user sees the change
    setActivePatientTab('photography');
  };

  const handleCreateNewPairGroup = () => {
    if (!selectedCustomer) return;
    const newPair: BeforeAfterPair = {
      id: `ba-${Date.now()}`,
      customerId: selectedCustomer.id,
      title: `Group ${effectivePairs.length + 1}: New Clinical Comparison`,
      beforePhotoId: '',
      afterPhotoId: '',
      dateCreated: new Date().toISOString().split('T')[0],
      notes: 'Select images from Files or Photos to set Before and After',
    };
    const updated = [...effectivePairs, newPair];
    if (onUpdateBeforeAfterPairs) {
      onUpdateBeforeAfterPairs(updated);
    }
    setActiveGroupIndex(updated.length - 1);
  };

  const handleDeleteCurrentPair = () => {
    if (!selectedCustomer || effectivePairs.length <= 1) return;
    if (window.confirm(`Delete comparison Group ${safeGroupIndex + 1}?`)) {
      const updated = effectivePairs.filter((_, idx) => idx !== safeGroupIndex);
      if (onUpdateBeforeAfterPairs) {
        onUpdateBeforeAfterPairs(updated);
      }
      setActiveGroupIndex(Math.max(0, safeGroupIndex - 1));
    }
  };

  // =========================================================================
  // VIEW 1: PATIENT SELECTION QUEUE (When no patient is selected)
  // =========================================================================
  if (!selectedCustomer) {
    return (
      <div className="space-y-4">
        {/* Selection Queue Header */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-600" />
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Patient Selection Queue
              </h2>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800">
                {processedCustomers.length} Patients
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Sorted by appointment proximity to prioritize active clinical operations. Select a patient to open their medical chart, care plans, and records.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Patient</span>
          </button>
        </div>

        {/* Search, Filter Tabs & Sort Controls */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, ID, phone, or email..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs text-slate-600 shrink-0">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-semibold text-slate-700">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="schedule_closest">Closest to Schedule Time (Priority)</option>
                  <option value="name">Patient Name (A-Z)</option>
                  <option value="overdue">Hygiene Overdue First</option>
                </select>
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                filterType === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({customers.length})
            </button>
            <button
              onClick={() => setFilterType('today_schedule')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                filterType === 'today_schedule'
                  ? 'bg-sky-700 text-white'
                  : 'bg-sky-50 text-sky-800 hover:bg-sky-100'
              }`}
            >
              <Clock className="w-3 h-3 text-sky-600" />
              <span>Today's Schedule Priority</span>
            </button>
            <button
              onClick={() => setFilterType('overdue')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                filterType === 'overdue'
                  ? 'bg-rose-700 text-white'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-rose-600" />
              <span>Hygiene Overdue</span>
            </button>
            <button
              onClick={() => setFilterType('due_soon')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                filterType === 'due_soon'
                  ? 'bg-amber-700 text-white'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              <CalendarCheck className="w-3 h-3 text-amber-600" />
              <span>Recall Due Soon</span>
            </button>
            <button
              onClick={() => setFilterType('has_files')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                filterType === 'has_files'
                  ? 'bg-purple-700 text-white'
                  : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
              }`}
            >
              <Layers className="w-3 h-3 text-purple-600" />
              <span>Has Files</span>
            </button>
          </div>
        </div>

        {/* Patient Selection Queue Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {processedCustomers.map((customer) => {
            const cleaningDue = customer.cleaningDues?.find((d) => d.type.includes('Cleaning'));
            const isOverdue = cleaningDue?.status === 'overdue';
            const isDueSoon = cleaningDue?.status === 'due_soon';
            const filesCount = customer.attachedFiles?.length || 0;
            const recsCount = customer.recommendedServices?.length || 0;
            const visitsCount = customer.treatmentLogs?.length || 0;
            const scheduleInfo = getCustomerScheduleInfo(customer.id);
            const isToday = scheduleInfo && scheduleInfo.label.startsWith('Today');

            return (
              <div
                key={customer.id}
                onClick={() => onSelectCustomer(customer.id)}
                className={`group relative p-4 rounded-xl border transition-all cursor-pointer bg-white text-left shadow-2xs hover:shadow-md ${
                  isToday
                    ? 'border-sky-300 ring-2 ring-sky-400/20 bg-gradient-to-b from-sky-50/40 to-white'
                    : 'border-slate-200 hover:border-sky-300'
                }`}
              >
                {/* Proximity Schedule Badge */}
                {scheduleInfo && (
                  <div className="mb-2.5 flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md ${
                        scheduleInfo.label.includes('In Progress')
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse'
                          : isToday
                          ? 'bg-sky-100 text-sky-800 border border-sky-300'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      <span>{scheduleInfo.label}</span>
                    </span>

                    <span className="text-[10px] font-semibold text-slate-400 font-mono">
                      #{customer.id.replace('cust-', '')}
                    </span>
                  </div>
                )}

                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 group-hover:bg-sky-600 group-hover:text-white text-slate-700 font-bold text-sm flex items-center justify-center transition-colors shadow-2xs">
                      {customer.firstName[0]}
                      {customer.lastName[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm group-hover:text-sky-700 transition-colors">
                        {customer.firstName} {customer.lastName}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        DOB: {customer.dob} · {customer.gender}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {customer.phone}
                    </span>
                    <span className="font-medium text-slate-600 truncate max-w-[120px]">
                      {customer.insuranceProvider || 'Private Pay'}
                    </span>
                  </div>

                  {/* Badges / Clinical Indicators */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {isOverdue ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        <AlertTriangle className="w-3 h-3" /> Recall Overdue
                      </span>
                    ) : isDueSoon ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <CalendarCheck className="w-3 h-3" /> Recall Due Soon
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Recall Current
                      </span>
                    )}

                    {filesCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        <Layers className="w-3 h-3" /> {filesCount} Files
                      </span>
                    )}

                    {recsCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                        <Stethoscope className="w-3 h-3" /> {recsCount} Care Plans
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    {visitsCount} Prior Visits
                  </span>
                  <span className="font-bold text-sky-600 flex items-center gap-1 text-[11px] group-hover:translate-x-0.5 transition-transform">
                    <span>Open Patient File</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {processedCustomers.length === 0 && (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
            <Users className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-700 text-sm">No Patients Found</h3>
            <p className="text-xs text-slate-500">
              Try adjusting your search terms or filter selection.
            </p>
          </div>
        )}

        {/* REGISTER PATIENT MODAL */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <h3 className="text-sm font-bold text-slate-900">
                  Register New Patient
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                      placeholder="Jane"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                      placeholder="(555) 000-0000"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                      placeholder="patient@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Medical Alerts (comma separated)</label>
                  <input
                    type="text"
                    value={medicalAlerts}
                    onChange={(e) => setMedicalAlerts(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    placeholder="e.g. High Blood Pressure, Bruxism"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Allergies (comma separated)</label>
                  <input
                    type="text"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    placeholder="e.g. Penicillin, Latex"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dental Insurance</label>
                  <input
                    type="text"
                    value={insurance}
                    onChange={(e) => setInsurance(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    placeholder="e.g. Delta Dental Premier"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateCustomer}
                  disabled={!firstName.trim() || !lastName.trim()}
                  className="px-4 py-2 font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-lg disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
                >
                  Create Patient Record
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: ACTIVE PATIENT PROFILE (Patient is Selected)
  // 1. "Put medical conditions at the very top below patient information within that div but expandable"
  // 2. "Rename attached clinical files to just files"
  // 3. "On the files if its an image if you right click you may set it as before or after (grouped based on how many 2 pairs we have)"
  // 4. "then on the Before and After we can see how its grouped (side by side) with buttons next and previous to navigate to the next group"
  // =========================================================================
  const cleaningDue = selectedCustomer.cleaningDues?.find((d) => d.type.includes('Cleaning'));
  const isOverdue = cleaningDue?.status === 'overdue';
  const isDueSoon = cleaningDue?.status === 'due_soon';
  const scheduleInfo = getCustomerScheduleInfo(selectedCustomer.id);

  const totalRecFee = recommendations.reduce((sum, r) => sum + (r.estimatedFee || 0), 0);
  const scheduledRecs = recommendations.filter((r) => r.addedToSchedule);
  const scheduledRecFee = scheduledRecs.reduce((sum, r) => sum + (r.estimatedFee || 0), 0);
  
  const emergencyRecCount = recommendations.filter((r) => {
    const urg = r.urgencyGroup ? URGENCY_TIERS[r.urgencyGroup] : getTreatmentUrgency(r.title);
    return urg.rank === 1 || r.priority === 'urgent';
  }).length;

  const longProcRecCount = recommendations.filter((r) => {
    const urg = r.urgencyGroup ? URGENCY_TIERS[r.urgencyGroup] : getTreatmentUrgency(r.title);
    return urg.rank === 2;
  }).length;

  const photos = selectedCustomer.photos || [];

  const filteredPhotos = photos.filter((p) => {
    if (photoFilterCategory === 'all') return true;
    return p.category === photoFilterCategory;
  });

  const totalGroups = effectivePairs.length;

  return (
    <div className="space-y-4">
      {/* ===================================================================== */}
      {/* PATIENT PROFILE HEADER BAR                                            */}
      {/* Contains Demographics + MEDICAL CONDITIONS AT VERY TOP WITHIN THIS DIV*/}
      {/* ===================================================================== */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-3">
        {/* Row 1: Demographics, Back button, and Present Case */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {/* Back Button to Unselect Patient and Return to Queue */}
            <button
              type="button"
              onClick={handleUnselect}
              aria-label="Back to patient selection queue"
              title="Back to patient selection queue"
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 hover:text-sky-700 shadow-2xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-bold text-slate-700">Back</span>
            </button>

            <div className="w-12 h-12 rounded-xl bg-sky-600 text-white font-bold text-base flex items-center justify-center shrink-0 shadow-2xs">
              {selectedCustomer.firstName[0]}
              {selectedCustomer.lastName[0]}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-none">
                  {selectedCustomer.firstName} {selectedCustomer.lastName}
                </h2>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  ID: #{selectedCustomer.id.replace('cust-', '')}
                </span>
                {scheduleInfo && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200">
                    <Clock className="w-3.5 h-3.5 text-sky-600" />
                    <span>{scheduleInfo.label}</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5 flex-wrap font-normal">
                <span>DOB: {selectedCustomer.dob}</span>
                <span>•</span>
                <span>Gender: {selectedCustomer.gender}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {selectedCustomer.phone}
                </span>
                {selectedCustomer.email && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" />
                      {selectedCustomer.email}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                Insurance Carrier
              </span>
              <p className="text-xs font-bold text-slate-800">
                {selectedCustomer.insuranceProvider || 'Self-Pay / Private'}
              </p>
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* MEDICAL CONDITIONS & ALLERGIES - DIRECTLY DISPLAYED (NO EXPAND BTN)   */}
        {/* ===================================================================== */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <HeartPulse className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="text-xs font-bold text-slate-800">
              Medical Conditions & Known Allergies
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
              {selectedCustomer.medicalAlerts.length + selectedCustomer.allergies.length} entries
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50/90 p-3 rounded-xl border border-slate-200">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <span>Medical Alerts & Systemic Conditions</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {selectedCustomer.medicalAlerts.length > 0 ? (
                  selectedCustomer.medicalAlerts.map((alert, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-900 border border-rose-300 font-semibold text-[11px]"
                    >
                      {alert}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 italic text-xs">No systemic conditions recorded.</span>
                )}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Known Drug & Material Allergies
              </p>
              <div className="flex flex-wrap gap-1.5">
                {selectedCustomer.allergies.length > 0 ? (
                  selectedCustomer.allergies.map((allergy, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 font-semibold text-[11px]"
                    >
                      {allergy}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 italic text-xs">No known allergies recorded.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* PATIENT NAVIGATION BAR - 6 SINGLE TABS                                */}
      {/* 1. Charting                                                           */}
      {/* 2. Preventive Hygiene & Recalls                                       */}
      {/* 3. Treatment History                                                  */}
      {/* 4. Clinical Photgraphy                                                */}
      {/* 5. Files                                                              */}
      {/* 6. Careplans                                                          */}
      {/* ===================================================================== */}
      <div className="bg-white border border-slate-200 rounded-xl p-2 sm:p-2.5 shadow-2xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {/* 1. Charting */}
          <button
            type="button"
            onClick={() => setActivePatientTab('charting')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              activePatientTab === 'charting'
                ? 'bg-sky-600 text-white border-sky-600 shadow-md ring-2 ring-sky-300'
                : 'bg-slate-50 hover:bg-sky-50/70 border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <Stethoscope className={`w-4 h-4 ${activePatientTab === 'charting' ? 'text-white' : 'text-sky-600'}`} />
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  activePatientTab === 'charting'
                    ? 'bg-white/20 text-white'
                    : 'bg-sky-100 text-sky-800'
                }`}
              >
                32 Teeth
              </span>
            </div>
            <p className={`font-bold text-xs mt-1.5 ${activePatientTab === 'charting' ? 'text-white' : 'text-slate-900'}`}>
              Charting
            </p>
            <p className={`text-[10px] ${activePatientTab === 'charting' ? 'text-sky-100' : 'text-slate-500'}`}>
              4 Quadrants · 5 Surfaces
            </p>
          </button>

          {/* 2. Preventive Hygiene & Recalls */}
          <button
            type="button"
            onClick={() => setActivePatientTab('dues')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              activePatientTab === 'dues'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300'
                : 'bg-slate-50 hover:bg-emerald-50/70 border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <Clock className={`w-4 h-4 ${activePatientTab === 'dues' ? 'text-white' : 'text-emerald-600'}`} />
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  activePatientTab === 'dues'
                    ? 'bg-white/20 text-white'
                    : isOverdue
                    ? 'bg-rose-100 text-rose-800'
                    : isDueSoon
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {isOverdue ? 'Overdue' : isDueSoon ? 'Due Soon' : 'Up-to-Date'}
              </span>
            </div>
            <p className={`font-bold text-xs mt-1.5 ${activePatientTab === 'dues' ? 'text-white' : 'text-slate-900'}`}>
              Preventive Hygiene & Recalls
            </p>
            <p className={`text-[10px] ${activePatientTab === 'dues' ? 'text-emerald-100' : 'text-slate-500'}`}>
              {selectedCustomer.cleaningDues?.length || 0} Schedules
            </p>
          </button>

          {/* 3. Treatment History */}
          <button
            type="button"
            onClick={() => setActivePatientTab('treatments')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              activePatientTab === 'treatments'
                ? 'bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-300'
                : 'bg-slate-50 hover:bg-purple-50/70 border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <FileText className={`w-4 h-4 ${activePatientTab === 'treatments' ? 'text-white' : 'text-purple-600'}`} />
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  activePatientTab === 'treatments'
                    ? 'bg-white/20 text-white'
                    : 'bg-purple-100 text-purple-800'
                }`}
              >
                {treatmentLogs.length} Visits
              </span>
            </div>
            <p className={`font-bold text-xs mt-1.5 ${activePatientTab === 'treatments' ? 'text-white' : 'text-slate-900'}`}>
              Treatment History
            </p>
            <p className={`text-[10px] ${activePatientTab === 'treatments' ? 'text-purple-100' : 'text-slate-500'}`}>
              Clinical Logs & Notes
            </p>
          </button>

          {/* 4. Clinical Photgraphy */}
          <button
            type="button"
            onClick={() => setActivePatientTab('photography')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              activePatientTab === 'photography'
                ? 'bg-teal-600 text-white border-teal-600 shadow-md ring-2 ring-teal-300'
                : 'bg-slate-50 hover:bg-teal-50/70 border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <Camera className={`w-4 h-4 ${activePatientTab === 'photography' ? 'text-white' : 'text-teal-600'}`} />
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  activePatientTab === 'photography'
                    ? 'bg-white/20 text-white'
                    : 'bg-teal-100 text-teal-800'
                }`}
              >
                {effectivePairs.length} Groups
              </span>
            </div>
            <p className={`font-bold text-xs mt-1.5 ${activePatientTab === 'photography' ? 'text-white' : 'text-slate-900'}`}>
              Clinical Photgraphy
            </p>
            <p className={`text-[10px] ${activePatientTab === 'photography' ? 'text-teal-100' : 'text-slate-500'}`}>
              {photos.length} Photos · Compare
            </p>
          </button>

          {/* 5. Files */}
          <button
            type="button"
            onClick={() => setActivePatientTab('attachedFiles')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              activePatientTab === 'attachedFiles'
                ? 'bg-sky-600 text-white border-sky-600 shadow-md ring-2 ring-sky-300'
                : 'bg-slate-50 hover:bg-sky-50/70 border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <Layers className={`w-4 h-4 ${activePatientTab === 'attachedFiles' ? 'text-white' : 'text-sky-600'}`} />
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  activePatientTab === 'attachedFiles'
                    ? 'bg-white/20 text-white'
                    : 'bg-sky-100 text-sky-800'
                }`}
              >
                {(selectedCustomer.attachedFiles?.length || 0) + photos.length} Files
              </span>
            </div>
            <p className={`font-bold text-xs mt-1.5 ${activePatientTab === 'attachedFiles' ? 'text-white' : 'text-slate-900'}`}>
              Files
            </p>
            <p className={`text-[10px] ${activePatientTab === 'attachedFiles' ? 'text-sky-100' : 'text-slate-500'}`}>
              Scans, X-rays & Photos
            </p>
          </button>

          {/* 6. Careplans */}
          <button
            type="button"
            onClick={() => setActivePatientTab('carePlans')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              activePatientTab === 'carePlans'
                ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-300'
                : 'bg-slate-50 hover:bg-amber-50/70 border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <Stethoscope className={`w-4 h-4 ${activePatientTab === 'carePlans' ? 'text-white' : 'text-amber-600'}`} />
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  activePatientTab === 'carePlans'
                    ? 'bg-white/20 text-white'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {recommendations.length} Plans
              </span>
            </div>
            <p className={`font-bold text-xs mt-1.5 ${activePatientTab === 'carePlans' ? 'text-white' : 'text-slate-900'}`}>
              Careplans
            </p>
            <p className={`text-[10px] ${activePatientTab === 'carePlans' ? 'text-amber-100' : 'text-slate-500'}`}>
              ${totalRecFee.toLocaleString()} Total Estimate
            </p>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SINGLE TAB DISPLAY - TAB 1: CHARTING                                  */}
      {/* ===================================================================== */}
      {activePatientTab === 'charting' && (
        <div id="section-charting" className="animate-in fade-in duration-150">
          <DentalChartingTab
            customer={selectedCustomer}
            onUpdateChart={onUpdateChart}
          />
        </div>
      )}

      {/* ===================================================================== */}
      {/* SINGLE TAB DISPLAY - TAB 2: PREVENTIVE HYGIENE & RECALLS              */}
      {/* ===================================================================== */}
      {activePatientTab === 'dues' && (
        <div id="section-dues" className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs animate-in fade-in duration-150">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-800">
                Preventive Hygiene & Recalls
              </span>
              {isOverdue ? (
                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  Recall Overdue
                </span>
              ) : isDueSoon ? (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Recall Due Soon
                </span>
              ) : (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Recall Up-to-Date
                </span>
              )}
            </div>
          </div>

          <div className="p-4 bg-white space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedCustomer.cleaningDues?.map((due, idx) => (
                <div
                  key={`${due.type}-${idx}`}
                  className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{due.type}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        due.status === 'overdue'
                          ? 'bg-rose-100 text-rose-800'
                          : due.status === 'due_soon'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {due.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span>Interval: Every {due.intervalMonths} Months</span>
                    <span>Next Due: {due.nextDueDate}</span>
                  </div>
                  {due.lastDoneDate && (
                    <p className="text-[10px] text-slate-400">
                      Last Completed: {due.lastDoneDate}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SINGLE TAB DISPLAY - TAB 3: TREATMENT HISTORY & COMPLETED VISITS      */}
      {/* ===================================================================== */}
      {activePatientTab === 'treatments' && (
        <div id="section-treatments" className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs animate-in fade-in duration-150">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-bold text-slate-800">
                Treatment History & Completed Visits
              </span>
              <span className="text-[11px] text-slate-500 font-normal">
                ({treatmentLogs.length} completed records)
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-5 bg-white space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-slate-500">
                Detailed clinical history of past operations, attending doctors, and operatory notes.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleQuickProphylaxisToday}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Log Hygiene Prophylaxis Today</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddLogModal(true)}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Completed Treatment</span>
                </button>
              </div>
            </div>

            {treatmentLogs.length > 0 ? (
              <div className="space-y-2.5 text-xs">
                {sortedTreatmentLogs.map((log) => {
                  const urg = log.urgencyGroup
                    ? URGENCY_TIERS[log.urgencyGroup]
                    : getTreatmentUrgency(log.procedureName);
                  const det = findDetermination(log.procedureName, determinations);

                  return (
                    <div
                      key={log.id}
                      className={`p-3.5 rounded-xl border transition-all space-y-2 ${
                        urg.rank === 1
                          ? 'border-rose-300 bg-rose-50/25 ring-1 ring-rose-200'
                          : urg.rank === 2
                          ? 'border-amber-200 bg-amber-50/20'
                          : 'border-slate-200 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${urg.badgeClass}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${urg.dotClass}`} />
                            {urg.label}
                          </span>
                          <span className="font-extrabold text-slate-900 text-sm">
                            {log.procedureName}
                          </span>
                          <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            {log.category}
                          </span>
                          {log.teethInvolved && log.teethInvolved.length > 0 && (
                            <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                              Teeth: #{log.teethInvolved.join(', #')}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          {log.cost !== undefined && log.cost > 0 && (
                            <span className="font-black text-slate-900 text-xs">
                              {formatPHP(log.cost)} PHP
                            </span>
                          )}
                          <span className="text-slate-500 font-mono text-[11px]">
                            {log.date}
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {log.clinicalNotes}
                      </p>

                      {/* Determination Details: Duration & Consumables */}
                      {det && (
                        <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-[10px]">
                          <div className="flex items-center gap-3 text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>Chair Time: {det.minDurationMinutes}–{det.maxDurationMinutes} mins</span>
                            </span>
                            <span>Standard Determination: {formatPHPRange(det.minAmountPhp, det.maxAmountPhp)} PHP</span>
                          </div>

                          {det.commonlyUsedConsumables && det.commonlyUsedConsumables.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="text-slate-400 font-bold uppercase text-[9px]">Consumables:</span>
                              {det.commonlyUsedConsumables.map((c, i) => (
                                <span key={i} className="px-1.5 py-0.2 bg-white rounded border border-slate-200 text-slate-600 font-medium">
                                  {c.consumableName.split(' ')[0]} ({c.standardDosage})
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/60">
                        <span>Attending: {log.doctorName || 'Attending Dentist'}</span>
                        <span className="uppercase text-[10px] font-bold text-slate-500">
                          Status: {log.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <FileText className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="font-bold text-slate-700 text-xs">No Prior Treatment Logs Recorded</p>
                <p className="text-[11px] text-slate-500">
                  Click "Log Completed Treatment" to add a new visit record.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SINGLE TAB DISPLAY - TAB 4: CLINICAL PHOTOGRAPHY & BEFORE/AFTER       */}
      {/* ===================================================================== */}
      {activePatientTab === 'photography' && (
        <div id="section-photography" className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs animate-in fade-in duration-150">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center gap-2 flex-wrap">
              <Camera className="w-4 h-4 text-teal-600" />
              <span className="text-xs font-bold text-slate-800">
                Clinical Photography & Before/After Gallery
              </span>
              <span className="text-[11px] text-slate-500 font-normal">
                ({photos.length} photos · {totalGroups} comparison {totalGroups === 1 ? 'group' : 'groups'})
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-5 bg-white space-y-5">
            {/* =============================================================== */}
            {/* BEFORE & AFTER SIDE-BY-SIDE COMPARISON WITH NEXT/PREVIOUS NAV   */}
            {/* =============================================================== */}
            <div className="bg-slate-900 rounded-2xl p-4 sm:p-5 text-white space-y-4 shadow-md">
              {/* Group Navigation Top Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                    <ArrowRightLeft className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm sm:text-base text-white">
                        Before & After Comparison
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Group {safeGroupIndex + 1} of {totalGroups}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {currentPair?.title || `Group ${safeGroupIndex + 1} Comparison`}
                    </p>
                  </div>
                </div>

                {/* Next / Previous and Group Selector Controls */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Previous Button */}
                  <button
                    type="button"
                    onClick={() => setActiveGroupIndex((prev) => Math.max(0, prev - 1))}
                    disabled={safeGroupIndex === 0}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center gap-1 transition-colors border border-slate-700 cursor-pointer"
                    title="Navigate to previous group pair"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  {/* Group Indicator Pills */}
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                    {effectivePairs.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveGroupIndex(idx)}
                        className={`px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                          safeGroupIndex === idx
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        Group {idx + 1}
                      </button>
                    ))}
                  </div>

                  {/* Next Button */}
                  <button
                    type="button"
                    onClick={() => setActiveGroupIndex((prev) => Math.min(totalGroups - 1, prev + 1))}
                    disabled={safeGroupIndex >= totalGroups - 1}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center gap-1 transition-colors border border-slate-700 cursor-pointer"
                    title="Navigate to next group pair"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {/* View Mode Toggle: Side-by-Side vs Slider */}
                  <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700 ml-1">
                    <button
                      type="button"
                      onClick={() => setComparisonViewMode('side_by_side')}
                      className={`p-1.5 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                        comparisonViewMode === 'side_by_side'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Side-by-Side View"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-[10px]">Side-by-Side</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setComparisonViewMode('slider')}
                      className={`p-1.5 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                        comparisonViewMode === 'slider'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Split Slider View"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-[10px]">Split Slider</span>
                    </button>
                  </div>

                  {/* Add New Group Button */}
                  <button
                    type="button"
                    onClick={handleCreateNewPairGroup}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                    title="Create new comparison group pair"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* COMPARISON VIEW: SIDE-BY-SIDE (PRIMARY) */}
              {comparisonViewMode === 'side_by_side' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* BEFORE COLUMN */}
                  <div className="bg-slate-950 rounded-xl p-3.5 border border-slate-800 flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-extrabold tracking-wider uppercase bg-rose-600 text-white shadow-xs">
                        BEFORE
                      </span>
                      {currentBeforeObj?.date && (
                        <span className="text-[11px] text-slate-400 font-mono">
                          {currentBeforeObj.date}
                        </span>
                      )}
                    </div>

                    <div className="relative h-64 sm:h-72 w-full rounded-lg overflow-hidden bg-black flex items-center justify-center border border-slate-800/80">
                      {currentBeforeObj ? (
                        <img
                          src={currentBeforeObj.url}
                          alt="Before treatment"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-6 space-y-2">
                          <Camera className="w-8 h-8 text-slate-600 mx-auto" />
                          <p className="font-bold text-xs text-slate-400">
                            No "Before" image assigned to Group {safeGroupIndex + 1}
                          </p>
                          <p className="text-[10px] text-slate-500 max-w-xs">
                            Right-click any image in the Files section below and select "Set as Before", or upload a new photo.
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-200 truncate">
                        {currentBeforeObj ? currentBeforeObj.title : 'Unassigned Before Image'}
                      </p>
                      {currentPair?.relatedTeeth && currentPair.relatedTeeth.length > 0 && (
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Related Teeth: #{currentPair.relatedTeeth.join(', #')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* AFTER COLUMN */}
                  <div className="bg-slate-950 rounded-xl p-3.5 border border-slate-800 flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-extrabold tracking-wider uppercase bg-emerald-600 text-white shadow-xs">
                        AFTER
                      </span>
                      {currentAfterObj?.date && (
                        <span className="text-[11px] text-slate-400 font-mono">
                          {currentAfterObj.date}
                        </span>
                      )}
                    </div>

                    <div className="relative h-64 sm:h-72 w-full rounded-lg overflow-hidden bg-black flex items-center justify-center border border-slate-800/80">
                      {currentAfterObj ? (
                        <img
                          src={currentAfterObj.url}
                          alt="After treatment"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-6 space-y-2">
                          <Camera className="w-8 h-8 text-slate-600 mx-auto" />
                          <p className="font-bold text-xs text-slate-400">
                            No "After" image assigned to Group {safeGroupIndex + 1}
                          </p>
                          <p className="text-[10px] text-slate-500 max-w-xs">
                            Right-click any image in the Files section below and select "Set as After", or upload a new photo.
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-200 truncate">
                        {currentAfterObj ? currentAfterObj.title : 'Unassigned After Image'}
                      </p>
                      <p className="text-[10px] text-emerald-400 mt-0.5">
                        {currentPair?.notes || 'Clinical outcome verification'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* COMPARISON VIEW: INTERACTIVE SPLIT SLIDER */
                <div className="space-y-2">
                  {currentBeforeObj && currentAfterObj ? (
                    <div className="relative h-64 sm:h-80 w-full rounded-xl overflow-hidden select-none bg-black border border-slate-800">
                      {/* After Image (Background) */}
                      <img
                        src={currentAfterObj.url}
                        alt="After clinical outcome"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3 bg-emerald-600/90 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-1 rounded shadow-xs">
                        AFTER: {currentAfterObj.title}
                      </div>

                      {/* Before Image (Clipped by Slider) */}
                      <div
                        className="absolute inset-0 overflow-hidden"
                        style={{ width: `${sliderPosition}%` }}
                      >
                        <img
                          src={currentBeforeObj.url}
                          alt="Before treatment"
                          className="absolute inset-0 w-full h-full object-cover max-w-none"
                          style={{ width: '100%', height: '100%' }}
                        />
                        <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-1 rounded shadow-xs">
                          BEFORE: {currentBeforeObj.title}
                        </div>
                      </div>

                      {/* Split Handle */}
                      <div
                        className="absolute top-0 bottom-0 w-1 bg-white shadow-xl cursor-ew-resize flex items-center justify-center -ml-0.5"
                        style={{ left: `${sliderPosition}%` }}
                      >
                        <div className="w-6 h-6 rounded-full bg-white text-slate-900 shadow-md flex items-center justify-center text-[10px] font-bold">
                          ↔
                        </div>
                      </div>

                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={sliderPosition}
                        onChange={(e) => setSliderPosition(Number(e.target.value))}
                        className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-20"
                      />
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                      <Sliders className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-xs font-bold text-slate-300">
                        Both Before and After images are required for split slider
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Right-click images in Files to populate both slots for Group {safeGroupIndex + 1}.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Group Footer & Bottom Navigation */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-300">
                    Group {safeGroupIndex + 1} of {totalGroups}:
                  </span>
                  <span className="text-slate-400 truncate max-w-xs">
                    {currentPair?.notes || 'Clinical evaluation comparison'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {effectivePairs.length > 1 && (
                    <button
                      type="button"
                      onClick={handleDeleteCurrentPair}
                      className="text-xs text-slate-400 hover:text-rose-400 transition-colors cursor-pointer mr-2"
                    >
                      Delete Group
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setActiveGroupIndex((prev) => Math.max(0, prev - 1))}
                    disabled={safeGroupIndex === 0}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    ← Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveGroupIndex((prev) => Math.min(totalGroups - 1, prev + 1))}
                    disabled={safeGroupIndex >= totalGroups - 1}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Next →
                  </button>
                </div>
              </div>
            </div>

            {/* Photos Filter & Upload Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setPhotoFilterCategory('all')}
                  className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer ${
                    photoFilterCategory === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({photos.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoFilterCategory('intraoral')}
                  className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer ${
                    photoFilterCategory === 'intraoral'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  Intraoral
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoFilterCategory('extraoral')}
                  className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer ${
                    photoFilterCategory === 'extraoral'
                      ? 'bg-sky-700 text-white'
                      : 'bg-sky-50 text-sky-800 hover:bg-sky-100'
                  }`}
                >
                  Extraoral
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoFilterCategory('xray')}
                  className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer ${
                    photoFilterCategory === 'xray'
                      ? 'bg-purple-700 text-white'
                      : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
                  }`}
                >
                  X-Rays
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddPhotoModal(true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Photo</span>
                </button>
              </div>
            </div>

            {/* Photos Grid */}
            {filteredPhotos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {filteredPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="group relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 flex flex-col"
                  >
                    <div className="aspect-square relative overflow-hidden bg-slate-100">
                      <img
                        src={photo.url}
                        alt={photo.caption}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <span
                        className={`absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          photo.stage === 'before'
                            ? 'bg-rose-900/80 text-white'
                            : photo.stage === 'after'
                            ? 'bg-emerald-800/80 text-white'
                            : 'bg-slate-800/80 text-white'
                        }`}
                      >
                        {photo.stage}
                      </span>
                    </div>

                    <div className="p-2.5 space-y-1">
                      <p className="font-bold text-slate-900 text-xs truncate">
                        {photo.caption}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span className="capitalize">{photo.category}</span>
                        <span>{photo.takenAt}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <Camera className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="font-bold text-slate-700 text-xs">No Clinical Photos Recorded</p>
                <p className="text-[11px] text-slate-500">
                  Click "Upload Photo" to attach dental images to this patient's chart.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SINGLE TAB DISPLAY - TAB 5: FILES                                     */}
      {/* Supports Right-Click on Images to Set as Before or After              */}
      {/* ===================================================================== */}
      {activePatientTab === 'attachedFiles' && (
        <div id="section-attachedFiles" className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs animate-in fade-in duration-150">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-600" />
              <span className="text-xs font-bold text-slate-800">
                Files
              </span>
              <span className="text-[11px] text-slate-500 font-normal">
                ({selectedCustomer.attachedFiles?.length || 0} files: 3D scans, X-rays, photos, documents)
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-5 bg-white">
            <AttachedFilesSection
              customer={selectedCustomer}
              hideHeaderTitle={true}
              beforeAfterPairs={effectivePairs}
              onSetFileAsBeforeAfter={handleSetFileAsBeforeAfter}
              onUpdateAttachedFiles={(files) => {
                if (onUpdateAttachedFiles) {
                  onUpdateAttachedFiles(files);
                }
              }}
            />
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SINGLE TAB DISPLAY - TAB 6: CAREPLANS & PROPOSED TREATMENTS           */}
      {/* ===================================================================== */}
      {activePatientTab === 'carePlans' && (
        <div id="section-carePlans" className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs animate-in fade-in duration-150">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center gap-2 flex-wrap">
              <Stethoscope className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold text-slate-800">
                Careplans & Proposed Treatments
              </span>
              <span className="text-[11px] text-slate-500 font-normal">
                ({recommendations.length} planned · {formatPHP(totalRecFee)} PHP)
              </span>
              {emergencyRecCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-800 bg-rose-100 px-2 py-0.5 rounded border border-rose-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                  {emergencyRecCount} Emergency (Top Priority)
                </span>
              )}
              {longProcRecCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                  <Clock className="w-3 h-3 text-amber-600" />
                  {longProcRecCount} Priority Long (1hr+)
                </span>
              )}
            </div>
          </div>

          <div className="p-4 sm:p-5 bg-white space-y-4">
            {/* Top Action & KPI Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Total Estimated Plan
                  </span>
                  <span className="font-black text-slate-900 text-sm">
                    {formatPHP(totalRecFee)} <span className="text-xs font-semibold text-slate-500">PHP</span>
                  </span>
                </div>
                <div className="border-l border-slate-200 pl-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Scheduled for Next Visit
                  </span>
                  <span className="font-black text-sky-700 text-sm">
                    {formatPHP(scheduledRecFee)} PHP ({scheduledRecs.length} items)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowDeterminationPicker(true)}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white border border-sky-600 text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Browse the 21 standard dental treatments and add with determination pricing & consumables"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Determination Table Presets</span>
                </button>

                <button
                  type="button"
                  onClick={handleAutoAnalyzeExam}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                  title="Auto-compute recommendations from current teeth chart & hygiene status"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Auto-Analyze Exam</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddRecModal(true)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Custom Proposed Treatment</span>
                </button>
              </div>
            </div>

            {/* List of Proposed Care Plan Items (Sorted by Urgency: Emergency -> Long Procedures -> Maintenance/Elective) */}
            {sortedRecommendations.length > 0 ? (
              <div className="space-y-3 text-xs">
                {sortedRecommendations.map((rec) => {
                  const isScheduled = !!rec.addedToSchedule;
                  const urg = rec.urgencyGroup
                    ? URGENCY_TIERS[rec.urgencyGroup]
                    : getTreatmentUrgency(rec.title);
                  const det = findDetermination(rec.title, determinations);

                  return (
                    <div
                      key={rec.id}
                      className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
                        isScheduled
                          ? 'border-sky-400 bg-sky-50/40 ring-1 ring-sky-200'
                          : urg.rank === 1
                          ? 'border-rose-300 bg-rose-50/20 ring-1 ring-rose-200/70 shadow-2xs'
                          : urg.rank === 2
                          ? 'border-amber-200 bg-amber-50/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Urgency Badge (Rank 1: Emergency, Rank 2: Long Procedure, Rank 3: Maintenance) */}
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${urg.badgeClass}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${urg.dotClass}`} />
                              {urg.label}
                            </span>

                            <span className="font-black text-slate-900 text-sm">
                              {rec.title}
                            </span>

                            <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              {rec.category}
                            </span>

                            {rec.relatedTeeth && rec.relatedTeeth.length > 0 && (
                              <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                Tooth #{rec.relatedTeeth.join(', #')}
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-600 leading-relaxed">{rec.reason}</p>
                        </div>

                        {/* Right: Price & Schedule Controls */}
                        <div className="flex items-center gap-3 self-end sm:self-start shrink-0">
                          <div className="text-right">
                            <span className="font-black text-slate-900 text-sm block">
                              {formatPHP(rec.estimatedFee)} PHP
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold block">
                              Patient Fee
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleScheduleRec(rec.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                              isScheduled
                                ? 'bg-sky-600 text-white shadow-2xs hover:bg-sky-700'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                            }`}
                          >
                            <Check className={`w-3.5 h-3.5 ${isScheduled ? 'text-white' : 'text-slate-400'}`} />
                            <span>{isScheduled ? 'Scheduled' : 'Add to Next Visit'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteRec(rec.id)}
                            title="Remove recommendation"
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Determination Details: Range, Chair Time & Consumables */}
                      {det && (
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                            <div className="flex items-center gap-3">
                              <span className="text-slate-500 font-semibold">
                                Determination Range:{' '}
                                <strong className="text-slate-900 font-black">
                                  {formatPHPRange(det.minAmountPhp, det.maxAmountPhp)} PHP
                                </strong>
                              </span>
                              <span className="text-slate-500 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>Chair Duration: <strong>{det.minDurationMinutes}–{det.maxDurationMinutes} mins</strong></span>
                              </span>
                            </div>

                            <span className="text-[10px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                              {urg.tagline}
                            </span>
                          </div>

                          {/* Commonly Used Consumables with Brand, Dosage, and UOM */}
                          {det.commonlyUsedConsumables && det.commonlyUsedConsumables.length > 0 && (
                            <div className="pt-2 border-t border-slate-200/60">
                              <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                <Package className="w-3 h-3 text-sky-600" />
                                <span>Commonly Used Consumables (Dosage & Pricing):</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {det.commonlyUsedConsumables.map((c, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] text-slate-700 shadow-2xs"
                                    title={`${c.consumableName} (${c.brand})`}
                                  >
                                    <span className="font-bold text-slate-900">
                                      {c.consumableName.split(' ')[0]}
                                    </span>
                                    <span className="text-slate-500 font-medium">
                                      ({c.brand.split(' ')[0]})
                                    </span>
                                    <span className="px-1 py-0.2 rounded bg-sky-50 text-sky-800 font-mono font-bold text-[9px]">
                                      {c.standardDosage}
                                    </span>
                                    <span className="font-bold text-emerald-700 font-mono">
                                      · {formatPHP(c.unitPricePhp)} / {c.uom}
                                    </span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <Stethoscope className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="font-bold text-slate-700 text-xs">No Care Plan Items Currently Formulated</p>
                <p className="text-[11px] text-slate-500">
                  Click "Determination Table Presets" or "Auto-Analyze Exam" to populate clinical treatments.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: ADD PROPOSED CARE PLAN PROCEDURE                               */}
      {/* ===================================================================== */}
      {showAddRecModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                Add Proposed Care Plan Procedure
              </h3>
              <button
                type="button"
                onClick={() => setShowAddRecModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Procedure Title *
                </label>
                <input
                  type="text"
                  value={recTitle}
                  onChange={(e) => setRecTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  placeholder="e.g. Composite Resin Restoration (Tooth #3)"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={recCategory}
                    onChange={(e) => setRecCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg cursor-pointer"
                  >
                    <option value="Restorative">Restorative</option>
                    <option value="Endodontics">Endodontics</option>
                    <option value="Periodontics">Periodontics</option>
                    <option value="Preventive">Preventive</option>
                    <option value="Prosthodontics">Prosthodontics</option>
                    <option value="Cosmetic">Cosmetic</option>
                    <option value="Orthodontics">Orthodontics</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={recPriority}
                    onChange={(e) => setRecPriority(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg cursor-pointer"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="routine">Routine</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estimated Fee ($)</label>
                  <input
                    type="number"
                    value={recFee}
                    onChange={(e) => setRecFee(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    placeholder="250"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Teeth (e.g. 3, 4)</label>
                  <input
                    type="text"
                    value={recTeeth}
                    onChange={(e) => setRecTeeth(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    placeholder="3, 4"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Clinical Rationale / Reason</label>
                <textarea
                  rows={2}
                  value={recReason}
                  onChange={(e) => setRecReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  placeholder="e.g. Deep occlusal carious lesion approaching dentin"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowAddRecModal(false)}
                className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddRecSubmit}
                disabled={!recTitle.trim()}
                className="px-4 py-2 font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
              >
                Add to Care Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: LOG COMPLETED TREATMENT VISIT                                  */}
      {/* ===================================================================== */}
      {showAddLogModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                Log Completed Treatment Record
              </h3>
              <button
                type="button"
                onClick={() => setShowAddLogModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Procedure Name *</label>
                <input
                  type="text"
                  value={logProcedure}
                  onChange={(e) => setLogProcedure(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  placeholder="e.g. MO Composite Restoration"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={logCategory}
                    onChange={(e) => setLogCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg cursor-pointer"
                  >
                    <option value="Restorative">Restorative</option>
                    <option value="Endodontic">Endodontic</option>
                    <option value="Periodontic">Periodontic</option>
                    <option value="Preventive">Preventive</option>
                    <option value="Oral Surgery">Oral Surgery</option>
                    <option value="Cosmetic">Cosmetic</option>
                    <option value="Orthodontic">Orthodontic</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date of Visit</label>
                  <input
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Attending Doctor</label>
                  <input
                    type="text"
                    value={logDoctor}
                    onChange={(e) => setLogDoctor(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Teeth (e.g. 14)</label>
                  <input
                    type="text"
                    value={logTeeth}
                    onChange={(e) => setLogTeeth(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    placeholder="14"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Cost / Fee ($)</label>
                <input
                  type="number"
                  value={logCost}
                  onChange={(e) => setLogCost(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  placeholder="250"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Clinical Notes</label>
                <textarea
                  rows={2}
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  placeholder="Notes on anesthesia, tooth isolation, restorative material, and patient tolerance..."
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowAddLogModal(false)}
                className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddLogSubmit}
                disabled={!logProcedure.trim()}
                className="px-4 py-2 font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
              >
                Save Treatment Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: UPLOAD / ATTACH DENTAL PHOTO                                   */}
      {/* ===================================================================== */}
      {showAddPhotoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                Upload Dental Photo
              </h3>
              <button
                type="button"
                onClick={() => setShowAddPhotoModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Photo Caption / Title *</label>
                <input
                  type="text"
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  placeholder="e.g. Anterior Smile View - Pre-Op"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={photoCategory}
                    onChange={(e) => setPhotoCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg cursor-pointer"
                  >
                    <option value="intraoral">Intraoral</option>
                    <option value="extraoral">Extraoral</option>
                    <option value="xray">X-Ray / Radiograph</option>
                    <option value="smile">Smile View</option>
                    <option value="pre_op">Pre-Operative</option>
                    <option value="post_op">Post-Operative</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stage</label>
                  <select
                    value={photoStage}
                    onChange={(e) => setPhotoStage(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg cursor-pointer"
                  >
                    <option value="before">Before</option>
                    <option value="after">After</option>
                    <option value="standard">Standard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Teeth Numbers (optional)</label>
                <input
                  type="text"
                  value={photoTeeth}
                  onChange={(e) => setPhotoTeeth(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  placeholder="e.g. 8, 9"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Photo Image URL</label>
                <input
                  type="text"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowAddPhotoModal(false)}
                className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddPhotoSubmit}
                disabled={!photoCaption.trim()}
                className="px-4 py-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
              >
                Attach Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
