import React, { useState } from 'react';
import {
  DentalChair,
  StaffShift,
  ConsumableItem,
  TreatmentDetermination,
  ConsumableUsage,
  UrgencyLevel,
} from '../types';
import {
  formatPHP,
  formatPHPRange,
  URGENCY_TIERS,
  sortTreatmentsByUrgency,
} from '../utils/urgencyRules';
import {
  Shield,
  Armchair,
  Clock,
  DollarSign,
  Package,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  Sliders,
  Calendar,
  Layers,
  Sparkles,
  RefreshCw,
  Info,
} from 'lucide-react';

interface AdminViewProps {
  chairs: DentalChair[];
  shifts: StaffShift[];
  consumables: ConsumableItem[];
  determinations: TreatmentDetermination[];
  onSaveChairs: (chairs: DentalChair[]) => void;
  onSaveShifts: (shifts: StaffShift[]) => void;
  onSaveConsumables: (consumables: ConsumableItem[]) => void;
  onSaveDeterminations: (determinations: TreatmentDetermination[]) => void;
  onResetDefaults?: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  chairs,
  shifts,
  consumables,
  determinations,
  onSaveChairs,
  onSaveShifts,
  onSaveConsumables,
  onSaveDeterminations,
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<
    'determinations' | 'consumables' | 'chairs' | 'shifts'
  >('determinations');

  // Search & filter states
  const [detSearch, setDetSearch] = useState('');
  const [detUrgencyFilter, setDetUrgencyFilter] = useState<'all' | UrgencyLevel>('all');
  const [consumableSearch, setConsumableSearch] = useState('');
  const [consumableCategoryFilter, setConsumableCategoryFilter] = useState('all');

  // Chair Modal States
  const [chairModalOpen, setChairModalOpen] = useState(false);
  const [editingChair, setEditingChair] = useState<DentalChair | null>(null);
  const [chairForm, setChairForm] = useState<Omit<DentalChair, 'id'>>({
    name: '',
    room: '',
    type: 'General',
    status: 'operational',
    equipment: [],
    notes: '',
  });
  const [equipmentInput, setEquipmentInput] = useState('');

  // Shift Modal States
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<StaffShift | null>(null);
  const [shiftForm, setShiftForm] = useState<Omit<StaffShift, 'id'>>({
    doctorName: '',
    role: '',
    licenseNumber: '',
    chairId: chairs[0]?.id || '',
    chairName: chairs[0]?.name || '',
    timeIn: '08:00',
    timeOut: '17:00',
    daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    status: 'active',
    contactPhone: '',
  });

  // Consumable Modal States
  const [consumableModalOpen, setConsumableModalOpen] = useState(false);
  const [editingConsumable, setEditingConsumable] = useState<ConsumableItem | null>(null);
  const [consumableForm, setConsumableForm] = useState<Omit<ConsumableItem, 'id'>>({
    name: '',
    brand: '',
    dosage: '',
    uom: 'unit',
    pricePhp: 100,
    stockQuantity: 50,
    category: 'General Supplies',
  });

  // Determination Modal States
  const [detModalOpen, setDetModalOpen] = useState(false);
  const [editingDet, setEditingDet] = useState<TreatmentDetermination | null>(null);
  const [detForm, setDetForm] = useState<Omit<TreatmentDetermination, 'id'>>({
    treatmentName: '',
    urgencyGroup: 'MaintenanceElective',
    urgencyRank: 3,
    minAmountPhp: 1500,
    maxAmountPhp: 3500,
    minDurationMinutes: 30,
    maxDurationMinutes: 45,
    commonlyUsedConsumables: [],
    description: '',
    indication: '',
  });

  // -------------------------------------------------------------------------
  // CHAIR HANDLERS
  // -------------------------------------------------------------------------
  const handleOpenAddChair = () => {
    setEditingChair(null);
    setChairForm({
      name: `Operatory ${chairs.length + 1}`,
      room: `Suite 10${chairs.length + 1}`,
      type: 'General',
      status: 'operational',
      equipment: ['Ultrasonic Scaler', 'Intraoral Camera'],
      notes: '',
    });
    setEquipmentInput('');
    setChairModalOpen(true);
  };

  const handleOpenEditChair = (chair: DentalChair) => {
    setEditingChair(chair);
    setChairForm({
      name: chair.name,
      room: chair.room,
      type: chair.type,
      status: chair.status,
      equipment: [...chair.equipment],
      notes: chair.notes || '',
    });
    setEquipmentInput('');
    setChairModalOpen(true);
  };

  const handleSaveChairSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chairForm.name.trim()) return;

    if (editingChair) {
      const updated = chairs.map((c) =>
        c.id === editingChair.id ? { ...c, ...chairForm } : c
      );
      onSaveChairs(updated);
    } else {
      const newChair: DentalChair = {
        id: `chair-${Date.now()}`,
        ...chairForm,
      };
      onSaveChairs([...chairs, newChair]);
    }
    setChairModalOpen(false);
  };

  const handleDeleteChair = (chairId: string) => {
    if (chairs.length <= 1) {
      alert('You must have at least one clinical chair.');
      return;
    }
    if (confirm('Are you sure you want to remove this chair?')) {
      onSaveChairs(chairs.filter((c) => c.id !== chairId));
    }
  };

  const handleToggleChairStatus = (chairId: string) => {
    const updated = chairs.map((c) => {
      if (c.id === chairId) {
        const nextStatus =
          c.status === 'operational'
            ? 'maintenance'
            : c.status === 'maintenance'
            ? 'operational'
            : 'operational';
        return { ...c, status: nextStatus as DentalChair['status'] };
      }
      return c;
    });
    onSaveChairs(updated);
  };

  // -------------------------------------------------------------------------
  // SHIFT HANDLERS
  // -------------------------------------------------------------------------
  const handleOpenAddShift = () => {
    setEditingShift(null);
    setShiftForm({
      doctorName: '',
      role: 'Associate Dentist',
      licenseNumber: 'PRC-DENT-00000',
      chairId: chairs[0]?.id || '',
      chairName: chairs[0]?.name || '',
      timeIn: '08:00',
      timeOut: '17:00',
      daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      status: 'active',
      contactPhone: '',
    });
    setShiftModalOpen(true);
  };

  const handleOpenEditShift = (shift: StaffShift) => {
    setEditingShift(shift);
    setShiftForm({
      doctorName: shift.doctorName,
      role: shift.role,
      licenseNumber: shift.licenseNumber || '',
      chairId: shift.chairId,
      chairName: shift.chairName,
      timeIn: shift.timeIn,
      timeOut: shift.timeOut,
      daysOfWeek: [...shift.daysOfWeek],
      status: shift.status,
      contactPhone: shift.contactPhone || '',
    });
    setShiftModalOpen(true);
  };

  const handleSaveShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftForm.doctorName.trim()) return;

    const matchedChair = chairs.find((c) => c.id === shiftForm.chairId);
    const chairName = matchedChair ? matchedChair.name : shiftForm.chairName;

    if (editingShift) {
      const updated = shifts.map((s) =>
        s.id === editingShift.id ? { ...s, ...shiftForm, chairName } : s
      );
      onSaveShifts(updated);
    } else {
      const newShift: StaffShift = {
        id: `shift-${Date.now()}`,
        ...shiftForm,
        chairName,
      };
      onSaveShifts([...shifts, newShift]);
    }
    setShiftModalOpen(false);
  };

  const handleDeleteShift = (shiftId: string) => {
    if (confirm('Delete practitioner shift?')) {
      onSaveShifts(shifts.filter((s) => s.id !== shiftId));
    }
  };

  const toggleDayOfWeek = (day: string) => {
    const current = shiftForm.daysOfWeek;
    if (current.includes(day)) {
      if (current.length === 1) return;
      setShiftForm({ ...shiftForm, daysOfWeek: current.filter((d) => d !== day) });
    } else {
      setShiftForm({ ...shiftForm, daysOfWeek: [...current, day] });
    }
  };

  // -------------------------------------------------------------------------
  // CONSUMABLES HANDLERS
  // -------------------------------------------------------------------------
  const handleOpenAddConsumable = () => {
    setEditingConsumable(null);
    setConsumableForm({
      name: '',
      brand: '',
      dosage: '1 unit',
      uom: 'unit',
      pricePhp: 150,
      stockQuantity: 50,
      category: 'Restorative Resins',
    });
    setConsumableModalOpen(true);
  };

  const handleOpenEditConsumable = (item: ConsumableItem) => {
    setEditingConsumable(item);
    setConsumableForm({
      name: item.name,
      brand: item.brand,
      dosage: item.dosage,
      uom: item.uom,
      pricePhp: item.pricePhp,
      stockQuantity: item.stockQuantity,
      category: item.category,
    });
    setConsumableModalOpen(true);
  };

  const handleSaveConsumableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consumableForm.name.trim()) return;

    if (editingConsumable) {
      const updated = consumables.map((c) =>
        c.id === editingConsumable.id ? { ...c, ...consumableForm } : c
      );
      onSaveConsumables(updated);
    } else {
      const newItem: ConsumableItem = {
        id: `con-${Date.now()}`,
        ...consumableForm,
      };
      onSaveConsumables([...consumables, newItem]);
    }
    setConsumableModalOpen(false);
  };

  const handleDeleteConsumable = (id: string) => {
    if (confirm('Delete consumable from clinic inventory?')) {
      onSaveConsumables(consumables.filter((c) => c.id !== id));
    }
  };

  // -------------------------------------------------------------------------
  // DETERMINATION MASTER TABLE HANDLERS
  // -------------------------------------------------------------------------
  const handleOpenAddDetermination = () => {
    setEditingDet(null);
    setDetForm({
      treatmentName: '',
      urgencyGroup: 'MaintenanceElective',
      urgencyRank: 3,
      minAmountPhp: 1500,
      maxAmountPhp: 3500,
      minDurationMinutes: 30,
      maxDurationMinutes: 45,
      commonlyUsedConsumables: [],
      description: '',
      indication: '',
    });
    setDetModalOpen(true);
  };

  const handleOpenEditDetermination = (det: TreatmentDetermination) => {
    setEditingDet(det);
    setDetForm({
      treatmentName: det.treatmentName,
      urgencyGroup: det.urgencyGroup,
      urgencyRank: det.urgencyRank,
      minAmountPhp: det.minAmountPhp,
      maxAmountPhp: det.maxAmountPhp,
      minDurationMinutes: det.minDurationMinutes,
      maxDurationMinutes: det.maxDurationMinutes,
      commonlyUsedConsumables: [...det.commonlyUsedConsumables],
      description: det.description || '',
      indication: det.indication || '',
    });
    setDetModalOpen(true);
  };

  const handleSaveDetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!detForm.treatmentName.trim()) return;

    // Set rank based on urgency
    const rank: 1 | 2 | 3 =
      detForm.urgencyGroup === 'Emergency'
        ? 1
        : detForm.urgencyGroup === 'LongProcedure'
        ? 2
        : 3;

    const payload = {
      ...detForm,
      urgencyRank: rank,
      minAmountPhp: Number(detForm.minAmountPhp) || 0,
      maxAmountPhp: Number(detForm.maxAmountPhp) || 0,
      minDurationMinutes: Number(detForm.minDurationMinutes) || 15,
      maxDurationMinutes: Number(detForm.maxDurationMinutes) || 45,
    };

    if (editingDet) {
      const updated = determinations.map((d) =>
        d.id === editingDet.id ? { ...d, ...payload } : d
      );
      onSaveDeterminations(updated);
    } else {
      const newDet: TreatmentDetermination = {
        id: `det-${Date.now()}`,
        ...payload,
      };
      onSaveDeterminations([...determinations, newDet]);
    }
    setDetModalOpen(false);
  };

  const handleDeleteDet = (id: string) => {
    if (confirm('Delete this treatment determination rule?')) {
      onSaveDeterminations(determinations.filter((d) => d.id !== id));
    }
  };

  const handleAddConsumableToDet = (consumableId: string) => {
    const item = consumables.find((c) => c.id === consumableId);
    if (!item) return;

    if (detForm.commonlyUsedConsumables.some((c) => c.consumableId === consumableId)) {
      return; // already exists
    }

    const usage: ConsumableUsage = {
      consumableId: item.id,
      consumableName: item.name,
      brand: item.brand,
      standardDosage: item.dosage,
      uom: item.uom,
      unitPricePhp: item.pricePhp,
      defaultQuantity: 1,
    };

    setDetForm({
      ...detForm,
      commonlyUsedConsumables: [...detForm.commonlyUsedConsumables, usage],
    });
  };

  const handleRemoveConsumableFromDet = (consumableId: string) => {
    setDetForm({
      ...detForm,
      commonlyUsedConsumables: detForm.commonlyUsedConsumables.filter(
        (c) => c.consumableId !== consumableId
      ),
    });
  };

  // Filtered & Sorted Determinations
  const filteredDeterminations: TreatmentDetermination[] = sortTreatmentsByUrgency<TreatmentDetermination>(
    determinations.filter((d) => {
      if (detUrgencyFilter !== 'all' && d.urgencyGroup !== detUrgencyFilter) return false;
      if (detSearch.trim()) {
        const query = detSearch.toLowerCase();
        return (
          d.treatmentName.toLowerCase().includes(query) ||
          (d.description && d.description.toLowerCase().includes(query)) ||
          (d.indication && d.indication.toLowerCase().includes(query))
        );
      }
      return true;
    })
  );

  // Filtered Consumables
  const filteredConsumables = consumables.filter((c) => {
    if (
      consumableCategoryFilter !== 'all' &&
      c.category.toLowerCase() !== consumableCategoryFilter.toLowerCase()
    ) {
      return false;
    }
    if (consumableSearch.trim()) {
      const q = consumableSearch.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.brand.toLowerCase().includes(q) ||
        c.dosage.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const consumableCategories = Array.from(
    new Set(consumables.map((c) => c.category))
  );

  return (
    <div className="space-y-6 text-slate-800 animate-in fade-in duration-150">
      {/* Admin Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-sky-300 mb-2 border border-white/10">
              <Shield className="w-3.5 h-3.5 text-sky-400" />
              <span>Practice Administration & Master Configuration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Clinic Operations & Master Determination Matrix
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl">
              Configure clinic operatories (chairs), practitioner shifts & schedules, consumables catalog with dosage-based pricing, and treatment pricing determination rules (PHP).
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 text-center min-w-[100px]">
              <span className="text-[10px] uppercase font-bold text-sky-300 block tracking-wider">
                Total Chairs
              </span>
              <span className="text-2xl font-black text-white">{chairs.length}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 text-center min-w-[100px]">
              <span className="text-[10px] uppercase font-bold text-emerald-300 block tracking-wider">
                Active Shifts
              </span>
              <span className="text-2xl font-black text-white">
                {shifts.filter((s) => s.status === 'active').length}
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 text-center min-w-[110px]">
              <span className="text-[10px] uppercase font-bold text-amber-300 block tracking-wider">
                Treatments
              </span>
              <span className="text-2xl font-black text-white">
                {determinations.length}
              </span>
            </div>
          </div>
        </div>

        {/* Admin Navigation Pills */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/10 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveAdminTab('determinations')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeAdminTab === 'determinations'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'bg-white/10 text-slate-200 hover:bg-white/15'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Pricing & Determination Matrix ({determinations.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAdminTab('consumables')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeAdminTab === 'consumables'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'bg-white/10 text-slate-200 hover:bg-white/15'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Consumables & Dosage Master ({consumables.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAdminTab('chairs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeAdminTab === 'chairs'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'bg-white/10 text-slate-200 hover:bg-white/15'
            }`}
          >
            <Armchair className="w-4 h-4" />
            <span>Chairs & Operatories ({chairs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAdminTab('shifts')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeAdminTab === 'shifts'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'bg-white/10 text-slate-200 hover:bg-white/15'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Practitioners & Shifts ({shifts.length})</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SECTION 1: TREATMENT DETERMINATION MASTER TABLE                       */}
      {/* ===================================================================== */}
      {activeAdminTab === 'determinations' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-black text-slate-900">
                  Treatment Pricing, Duration & Consumables Determination Table
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Master clinical determination table linking Philippine Peso (PHP) pricing ranges, duration, urgency tiers, and required consumables per treatment.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenAddDetermination}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Treatment Determination</span>
              </button>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={detSearch}
                onChange={(e) => setDetSearch(e.target.value)}
                placeholder="Search treatment name, trauma, root canal, prophylaxis..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                <span>Urgency:</span>
              </span>
              {(['all', 'Emergency', 'LongProcedure', 'MaintenanceElective'] as const).map(
                (grp) => (
                  <button
                    key={grp}
                    type="button"
                    onClick={() => setDetUrgencyFilter(grp)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      detUrgencyFilter === grp
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {grp === 'all'
                      ? 'All Tiers'
                      : grp === 'Emergency'
                      ? '🚨 Emergency (Top Priority)'
                      : grp === 'LongProcedure'
                      ? '⏳ Long Procedures (1hr+)'
                      : '🛡️ Maintenance / Elective'}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Responsive Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Urgency & Rank</th>
                  <th className="py-3 px-4 min-w-[200px]">Operation / Treatment</th>
                  <th className="py-3 px-4">Price Range (PHP ₱)</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4 min-w-[280px]">Commonly Used Consumables</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredDeterminations.map((det) => {
                  const urg = URGENCY_TIERS[det.urgencyGroup];
                  return (
                    <tr
                      key={det.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        det.urgencyGroup === 'Emergency'
                          ? 'bg-rose-50/20'
                          : det.urgencyGroup === 'LongProcedure'
                          ? 'bg-amber-50/15'
                          : ''
                      }`}
                    >
                      {/* Urgency Badge */}
                      <td className="py-3 px-4 align-top">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${urg.badgeClass}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${urg.dotClass}`} />
                            {urg.label}
                          </span>
                          <span className="block text-[10px] text-slate-400 font-mono">
                            Priority #{det.urgencyRank}
                          </span>
                        </div>
                      </td>

                      {/* Operation Name & Indication */}
                      <td className="py-3 px-4 align-top">
                        <div className="font-black text-slate-900 text-sm">
                          {det.treatmentName}
                        </div>
                        {det.description && (
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                            {det.description}
                          </p>
                        )}
                        {det.indication && (
                          <div className="text-[10px] text-sky-700 font-medium mt-1">
                            Indication: {det.indication}
                          </div>
                        )}
                      </td>

                      {/* Price Range in PHP */}
                      <td className="py-3 px-4 align-top whitespace-nowrap">
                        <div className="font-extrabold text-slate-900 text-sm">
                          {formatPHPRange(det.minAmountPhp, det.maxAmountPhp)}
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-700 block">
                          Philippine Peso
                        </span>
                      </td>

                      {/* Operation Time */}
                      <td className="py-3 px-4 align-top whitespace-nowrap">
                        <div className="font-bold text-slate-800 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {det.minDurationMinutes} – {det.maxDurationMinutes} mins
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">Chair reservation</span>
                      </td>

                      {/* Consumables with dosage and brand */}
                      <td className="py-3 px-4 align-top">
                        {det.commonlyUsedConsumables && det.commonlyUsedConsumables.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {det.commonlyUsedConsumables.map((c, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] text-slate-700"
                                title={`${c.consumableName} (${c.brand}) - ${c.standardDosage} - ${formatPHP(c.unitPricePhp)} / ${c.uom}`}
                              >
                                <span className="font-semibold text-slate-900">
                                  {c.consumableName.split(' ')[0]}
                                </span>
                                <span className="text-slate-500">· {c.standardDosage}</span>
                                <span className="font-bold text-emerald-700">
                                  {formatPHP(c.unitPricePhp)}
                                </span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            No consumables assigned
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 align-top text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditDetermination(det)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
                            title="Edit treatment determination"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDet(det.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete determination"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION 2: CONSUMABLES MASTER TABLE                                   */}
      {/* ===================================================================== */}
      {activeAdminTab === 'consumables' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-sky-600" />
                <h2 className="text-base font-black text-slate-900">
                  Consumables, Dosage & Unit Pricing (PHP)
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Set brand names, dosage formulations, unit of measure (UOM), unit price depending on dosage, and current clinical inventory.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAddConsumable}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
            >
              <Plus className="w-4 h-4" />
              <span>Add Consumable</span>
            </button>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={consumableSearch}
                onChange={(e) => setConsumableSearch(e.target.value)}
                placeholder="Search consumable, brand, dosage (e.g. Lidocaine, 3M, 1.8 mL)..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                Category:
              </span>
              <select
                value={consumableCategoryFilter}
                onChange={(e) => setConsumableCategoryFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
              >
                <option value="all">All Categories ({consumables.length})</option>
                {consumableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Consumables Responsive Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Consumable Name</th>
                  <th className="py-3 px-4">Brand</th>
                  <th className="py-3 px-4">Dosage / Formulation</th>
                  <th className="py-3 px-4">UOM</th>
                  <th className="py-3 px-4">Price per Dosage (PHP ₱)</th>
                  <th className="py-3 px-4">Clinic Stock</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredConsumables.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-xs sm:text-sm">
                        {item.name}
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-700">{item.brand}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200 font-mono text-[11px] font-bold">
                        {item.dosage}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="capitalize text-slate-600 font-mono font-semibold">
                        {item.uom}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-slate-900 text-sm">
                        {formatPHP(item.pricePhp)}
                      </div>
                      <span className="text-[10px] text-slate-400">per {item.uom}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.stockQuantity <= 15
                            ? 'bg-rose-100 text-rose-800'
                            : item.stockQuantity <= 35
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {item.stockQuantity} in stock
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditConsumable(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteConsumable(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION 3: CHAIRS MANAGEMENT                                          */}
      {/* ===================================================================== */}
      {activeAdminTab === 'chairs' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Armchair className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-black text-slate-900">
                  Operatories & Dental Chairs Management
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage total operative dental chairs, clinical room suites, equipment capabilities, and operational maintenance status.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAddChair}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
            >
              <Plus className="w-4 h-4" />
              <span>Add Dental Chair</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {chairs.map((chair) => {
              const assignedShift = shifts.find((s) => s.chairId === chair.id);
              return (
                <div
                  key={chair.id}
                  className={`p-4 rounded-2xl border transition-all space-y-3 flex flex-col justify-between ${
                    chair.status === 'operational'
                      ? 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
                      : chair.status === 'in_use'
                      ? 'bg-amber-50/40 border-amber-300'
                      : 'bg-rose-50/40 border-rose-200'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          chair.status === 'operational'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : chair.status === 'in_use'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-rose-100 text-rose-800 border-rose-300'
                        }`}
                      >
                        {chair.status.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400 font-mono">
                        {chair.type}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">
                        {chair.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {chair.room}
                      </p>
                    </div>

                    {assignedShift && (
                      <div className="p-2 rounded-xl bg-white border border-slate-200/80 text-[11px] space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Assigned Practitioner:
                        </span>
                        <span className="font-bold text-slate-900 block truncate">
                          {assignedShift.doctorName}
                        </span>
                        <span className="text-slate-500 font-mono text-[10px] block">
                          {assignedShift.timeIn} – {assignedShift.timeOut}
                        </span>
                      </div>
                    )}

                    {chair.equipment && chair.equipment.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Equipment & Features:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {chair.equipment.map((eq, i) => (
                            <span
                              key={i}
                              className="text-[10px] px-1.5 py-0.5 bg-white rounded border border-slate-200 text-slate-600"
                            >
                              {eq}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleToggleChairStatus(chair.id)}
                      className="text-[10px] font-bold text-slate-600 hover:text-slate-900 underline cursor-pointer"
                    >
                      {chair.status === 'operational'
                        ? 'Set Maintenance'
                        : 'Set Operational'}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditChair(chair)}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteChair(chair.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION 4: SHIFTS & PRACTITIONERS MANAGEMENT                          */}
      {/* ===================================================================== */}
      {activeAdminTab === 'shifts' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <h2 className="text-base font-black text-slate-900">
                  Doctor & Practitioner Shifts Roster
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage practitioner roster, working hours (time in and time out), assigned operatory chairs, and active duty status.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAddShift}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
            >
              <Plus className="w-4 h-4" />
              <span>Add Practitioner Shift</span>
            </button>
          </div>

          {/* Shifts Responsive Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Doctor / Practitioner</th>
                  <th className="py-3 px-4">Role / Specialization</th>
                  <th className="py-3 px-4">Assigned Chair</th>
                  <th className="py-3 px-4">Working Hours (In / Out)</th>
                  <th className="py-3 px-4">Assigned Days</th>
                  <th className="py-3 px-4">Duty Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {shifts.map((shift) => (
                  <tr key={shift.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-slate-900 text-sm">
                        {shift.doctorName}
                      </div>
                      {shift.licenseNumber && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {shift.licenseNumber}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-slate-700 font-semibold">{shift.role}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 border border-sky-200 font-bold text-xs">
                        <Armchair className="w-3.5 h-3.5 text-sky-600" />
                        {shift.chairName}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-slate-900 text-xs flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {shift.timeIn} – {shift.timeOut}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">Regular clinic shift</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                          const isAssigned = shift.daysOfWeek.includes(day);
                          return (
                            <span
                              key={day}
                              className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                                isAssigned
                                  ? 'bg-slate-800 text-white'
                                  : 'bg-slate-100 text-slate-400'
                              }`}
                            >
                              {day}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          shift.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : shift.status === 'on_break'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            shift.status === 'active'
                              ? 'bg-emerald-500'
                              : shift.status === 'on_break'
                              ? 'bg-amber-500'
                              : 'bg-slate-400'
                          }`}
                        />
                        {shift.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditShift(shift)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteShift(shift.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: ADD / EDIT CHAIR                                               */}
      {/* ===================================================================== */}
      {chairModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingChair ? 'Edit Dental Chair' : 'Add New Dental Chair'}
              </h3>
              <button
                type="button"
                onClick={() => setChairModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveChairSubmit} className="p-4 sm:p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Chair / Operatory Name
                </label>
                <input
                  type="text"
                  value={chairForm.name}
                  onChange={(e) => setChairForm({ ...chairForm, name: e.target.value })}
                  placeholder="e.g. Operatory 5 (Orthodontics)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                    Room / Location
                  </label>
                  <input
                    type="text"
                    value={chairForm.room}
                    onChange={(e) => setChairForm({ ...chairForm, room: e.target.value })}
                    placeholder="Suite 105"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                    Operatory Specialty
                  </label>
                  <select
                    value={chairForm.type}
                    onChange={(e) =>
                      setChairForm({
                        ...chairForm,
                        type: e.target.value as DentalChair['type'],
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 cursor-pointer"
                  >
                    <option value="General">General Dentistry</option>
                    <option value="Restorative">Restorative & Endodontics</option>
                    <option value="Surgical">Oral Surgery & Trauma</option>
                    <option value="Hygiene">Hygiene & Preventive</option>
                    <option value="Orthodontic">Orthodontics & Aesthetics</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Operational Status
                </label>
                <select
                  value={chairForm.status}
                  onChange={(e) =>
                    setChairForm({
                      ...chairForm,
                      status: e.target.value as DentalChair['status'],
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 cursor-pointer"
                >
                  <option value="operational">Operational</option>
                  <option value="in_use">In Use / Active</option>
                  <option value="maintenance">Under Maintenance</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Equipment Tags (Comma-separated)
                </label>
                <input
                  type="text"
                  value={equipmentInput || chairForm.equipment.join(', ')}
                  onChange={(e) => {
                    setEquipmentInput(e.target.value);
                    setChairForm({
                      ...chairForm,
                      equipment: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    });
                  }}
                  placeholder="Intraoral Camera, Ultrasonic Scaler, Curing Light"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setChairModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  {editingChair ? 'Update Chair' : 'Create Chair'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: ADD / EDIT SHIFT                                               */}
      {/* ===================================================================== */}
      {shiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingShift ? 'Edit Practitioner Shift' : 'Add Practitioner Shift'}
              </h3>
              <button
                type="button"
                onClick={() => setShiftModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveShiftSubmit} className="p-4 sm:p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Practitioner / Doctor Name
                </label>
                <input
                  type="text"
                  value={shiftForm.doctorName}
                  onChange={(e) => setShiftForm({ ...shiftForm, doctorName: e.target.value })}
                  placeholder="Dr. Maria Cruz, DMD"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                    Role / Specialization
                  </label>
                  <input
                    type="text"
                    value={shiftForm.role}
                    onChange={(e) => setShiftForm({ ...shiftForm, role: e.target.value })}
                    placeholder="General Dentist / Prosthodontist"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                    PRC License Number
                  </label>
                  <input
                    type="text"
                    value={shiftForm.licenseNumber}
                    onChange={(e) =>
                      setShiftForm({ ...shiftForm, licenseNumber: e.target.value })
                    }
                    placeholder="PRC-DENT-00123"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Assigned Dental Chair / Operatory
                </label>
                <select
                  value={shiftForm.chairId}
                  onChange={(e) => {
                    const sel = chairs.find((c) => c.id === e.target.value);
                    setShiftForm({
                      ...shiftForm,
                      chairId: e.target.value,
                      chairName: sel ? sel.name : shiftForm.chairName,
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 cursor-pointer"
                >
                  {chairs.map((chair) => (
                    <option key={chair.id} value={chair.id}>
                      {chair.name} ({chair.room})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                    Time In (Go In)
                  </label>
                  <input
                    type="time"
                    value={shiftForm.timeIn}
                    onChange={(e) => setShiftForm({ ...shiftForm, timeIn: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 cursor-pointer"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                    Time Out (Go Out)
                  </label>
                  <input
                    type="time"
                    value={shiftForm.timeOut}
                    onChange={(e) => setShiftForm({ ...shiftForm, timeOut: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 cursor-pointer"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Assigned Working Days
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                    const active = shiftForm.daysOfWeek.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDayOfWeek(day)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          active
                            ? 'bg-amber-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShiftModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  {editingShift ? 'Save Shift Changes' : 'Create Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: ADD / EDIT CONSUMABLE                                          */}
      {/* ===================================================================== */}
      {consumableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingConsumable ? 'Edit Consumable Master Record' : 'Add New Consumable'}
              </h3>
              <button
                type="button"
                onClick={() => setConsumableModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConsumableSubmit} className="p-4 sm:p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Consumable Name
                </label>
                <input
                  type="text"
                  value={consumableForm.name}
                  onChange={(e) =>
                    setConsumableForm({ ...consumableForm, name: e.target.value })
                  }
                  placeholder="e.g. Lidocaine HCl 2% with Epinephrine"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    value={consumableForm.brand}
                    onChange={(e) =>
                      setConsumableForm({ ...consumableForm, brand: e.target.value })
                    }
                    placeholder="Septodont / 3M ESPE"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={consumableForm.category}
                    onChange={(e) =>
                      setConsumableForm({ ...consumableForm, category: e.target.value })
                    }
                    placeholder="Local Anesthesia / Restorative"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                    Dosage / Strength
                  </label>
                  <input
                    type="text"
                    value={consumableForm.dosage}
                    onChange={(e) =>
                      setConsumableForm({ ...consumableForm, dosage: e.target.value })
                    }
                    placeholder="1.8 mL / carpule or 4g syringe"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                    Unit of Measure (UOM)
                  </label>
                  <input
                    type="text"
                    value={consumableForm.uom}
                    onChange={(e) =>
                      setConsumableForm({ ...consumableForm, uom: e.target.value })
                    }
                    placeholder="carpule, syringe, bag, mL, unit"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                    Price per Dosage (PHP ₱)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={consumableForm.pricePhp}
                    onChange={(e) =>
                      setConsumableForm({
                        ...consumableForm,
                        pricePhp: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                    Current Clinic Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={consumableForm.stockQuantity}
                    onChange={(e) =>
                      setConsumableForm({
                        ...consumableForm,
                        stockQuantity: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setConsumableModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  {editingConsumable ? 'Save Consumable' : 'Add to Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: ADD / EDIT TREATMENT DETERMINATION                             */}
      {/* ===================================================================== */}
      {detModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingDet
                  ? 'Edit Treatment Determination Rule'
                  : 'Add Treatment Determination Rule'}
              </h3>
              <button
                type="button"
                onClick={() => setDetModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleSaveDetSubmit}
              className="p-4 sm:p-5 space-y-4 text-xs overflow-y-auto flex-1"
            >
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Operation / Treatment Name
                </label>
                <input
                  type="text"
                  value={detForm.treatmentName}
                  onChange={(e) =>
                    setDetForm({ ...detForm, treatmentName: e.target.value })
                  }
                  placeholder="e.g. Root Canal Treatment (RCT) or Oral Prophylaxis"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Urgency Classification (Clinical Priority)
                </label>
                <select
                  value={detForm.urgencyGroup}
                  onChange={(e) =>
                    setDetForm({
                      ...detForm,
                      urgencyGroup: e.target.value as UrgencyLevel,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 cursor-pointer"
                >
                  <option value="Emergency">🚨 Emergency Cases (Top Priority, Confirmation & Booking)</option>
                  <option value="LongProcedure">⏳ Long Procedures (Priority Cases) (1hr-longer)</option>
                  <option value="MaintenanceElective">🛡️ Maintenance / Elective Procedures (15-45 mins, 1hr MAX)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                    Min Amount (PHP ₱)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={detForm.minAmountPhp}
                    onChange={(e) =>
                      setDetForm({ ...detForm, minAmountPhp: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                    Max Amount (PHP ₱)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={detForm.maxAmountPhp}
                    onChange={(e) =>
                      setDetForm({ ...detForm, maxAmountPhp: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                    Min Operation Time (Minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={detForm.minDurationMinutes}
                    onChange={(e) =>
                      setDetForm({
                        ...detForm,
                        minDurationMinutes: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                    Max Operation Time (Minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={detForm.maxDurationMinutes}
                    onChange={(e) =>
                      setDetForm({
                        ...detForm,
                        maxDurationMinutes: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Commonly Used Consumables for Treatment
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <select
                      id="consumable-selector"
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 cursor-pointer"
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddConsumableToDet(e.target.value);
                          e.target.value = '';
                        }
                      }}
                    >
                      <option value="" disabled>
                        + Select consumable to link to this treatment...
                      </option>
                      {consumables.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.brand}) – {item.dosage} ({formatPHP(item.pricePhp)}/{item.uom})
                        </option>
                      ))}
                    </select>
                  </div>

                  {detForm.commonlyUsedConsumables.length > 0 ? (
                    <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50/50 p-2 space-y-1.5">
                      {detForm.commonlyUsedConsumables.map((c) => (
                        <div
                          key={c.consumableId}
                          className="flex items-center justify-between py-1 px-2 text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900">{c.consumableName}</span>
                            <span className="text-slate-500 text-[11px] block">
                              {c.brand} · {c.standardDosage} · {formatPHP(c.unitPricePhp)} / {c.uom}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveConsumableFromDet(c.consumableId)}
                            className="text-rose-600 hover:text-rose-800 text-[11px] font-bold p-1 cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">
                      No consumables attached yet. Select from the dropdown above.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Clinical Description & Protocol
                </label>
                <textarea
                  rows={2}
                  value={detForm.description}
                  onChange={(e) =>
                    setDetForm({ ...detForm, description: e.target.value })
                  }
                  placeholder="Operatory technique, clinical protocol, materials used..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDetModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  {editingDet ? 'Save Determination' : 'Create Determination'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
