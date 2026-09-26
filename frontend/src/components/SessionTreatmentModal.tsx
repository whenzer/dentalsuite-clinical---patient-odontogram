import React, { useState } from 'react';
import {
  Appointment,
  Customer,
  TreatmentLog,
  DentalPhoto,
  BeforeAfterPair,
  ToothNumber,
} from '../types';
import {
  X,
  CheckCircle2,
  FileText,
  Camera,
  Upload,
  Plus,
  Trash2,
  User,
  Calendar,
  Layers,
  DollarSign,
  AlertCircle,
  Clock,
} from 'lucide-react';

interface SessionTreatmentModalProps {
  appointment: Appointment;
  customer: Customer;
  onClose: () => void;
  onSaveSession: (data: {
    treatmentLog: TreatmentLog;
    newPhotos: DentalPhoto[];
    newBeforeAfterPair?: BeforeAfterPair;
    appointmentId: string;
    completedAt: string;
  }) => void;
}

export const SessionTreatmentModal: React.FC<SessionTreatmentModalProps> = ({
  appointment,
  customer,
  onClose,
  onSaveSession,
}) => {
  // Treatment Log state
  const [procedureName, setProcedureName] = useState(
    appointment.procedureName || ''
  );
  const [category, setCategory] = useState<TreatmentLog['category']>(
    (appointment.procedureCategory as TreatmentLog['category']) || 'Restorative'
  );
  const [doctorName, setDoctorName] = useState(appointment.doctorName);
  const [selectedTeeth, setSelectedTeeth] = useState<ToothNumber[]>(
    appointment.relatedTeeth || [14]
  );
  const [clinicalNotes, setClinicalNotes] = useState(
    appointment.notes || ''
  );
  const [cost, setCost] = useState<number>(380);

  // Photo Ops state
  const [sessionPhotos, setSessionPhotos] = useState<
    Array<{
      id: string;
      url: string;
      caption: string;
      category: DentalPhoto['category'];
      stage: 'before' | 'after' | 'standard';
    }>
  >([]);

  const [createBAPair, setCreateBAPair] = useState<boolean>(false);
  const [baTitle, setBaTitle] = useState(
    `Today's Clinical Case: ${appointment.procedureName}`
  );

  // Tooth toggle handler
  const toggleTooth = (num: ToothNumber) => {
    if (selectedTeeth.includes(num)) {
      setSelectedTeeth(selectedTeeth.filter((t) => t !== num));
    } else {
      setSelectedTeeth([...selectedTeeth, num].sort((a, b) => a - b));
    }
  };

  // Quick preset clinical notes
  const quickPhrases = [
    '2% Lidocaine 1:100k epi administered.',
    'Decayed dentin excavated to hard sound base.',
    'Etched 15s, bonding agent applied, light-cured 20s.',
    'Occlusion checked with 40µm articulation paper.',
    'Patient tolerated procedure well without complications.',
    'Post-op care instructions given to patient.',
  ];

  const handleAddPhrase = (phrase: string) => {
    setClinicalNotes((prev) => (prev ? `${prev} ${phrase}` : phrase));
  };

  // Add custom photo op
  const handleRemovePhoto = (id: string) => {
    setSessionPhotos(sessionPhotos.filter((p) => p.id !== id));
  };

  // File upload for custom camera photo
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setSessionPhotos([
            ...sessionPhotos,
            {
              id: `photo-upload-${Date.now()}`,
              url: reader.result,
              caption: `Live intraoral snapshot: ${file.name}`,
              category: 'intraoral',
              stage: 'after',
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    const now = new Date();
    const timestamp = `${appointment.date} ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const newTreatmentLog: TreatmentLog = {
      id: `treat-${Date.now()}`,
      customerId: customer.id,
      date: appointment.date,
      doctorName,
      category,
      procedureName,
      teethInvolved: selectedTeeth,
      clinicalNotes,
      cost,
      status: 'Completed',
    };

    const newPhotos: DentalPhoto[] = sessionPhotos.map((p) => ({
      id: p.id,
      customerId: customer.id,
      url: p.url,
      caption: p.caption,
      category: p.category,
      takenAt: timestamp,
      relatedTeeth: selectedTeeth,
      stage: p.stage,
    }));

    let newBeforeAfterPair: BeforeAfterPair | undefined;
    const prePhoto = sessionPhotos.find((p) => p.stage === 'before');
    const postPhoto = sessionPhotos.find((p) => p.stage === 'after');

    if (createBAPair && prePhoto && postPhoto) {
      newBeforeAfterPair = {
        id: `ba-session-${Date.now()}`,
        customerId: customer.id,
        title: baTitle,
        beforePhotoId: prePhoto.id,
        afterPhotoId: postPhoto.id,
        dateCreated: appointment.date,
        notes: `Documented during calendar session on ${appointment.date}. Teeth: #${selectedTeeth.join(
          ', #'
        )}`,
        relatedTeeth: selectedTeeth,
      };
    }

    onSaveSession({
      treatmentLog: newTreatmentLog,
      newPhotos,
      newBeforeAfterPair,
      appointmentId: appointment.id,
      completedAt: timestamp,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">
                  Log Treatment Session & Photo Ops
                </h3>
                <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                  Calendar Sync
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Record completed clinical operation to patient details, history, and photo portfolio.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {/* Patient / Appointment Context Banner */}
          <div className="bg-sky-50 rounded-xl p-4 border border-sky-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-sky-200 text-sky-800 font-bold flex items-center justify-center shrink-0">
                {customer.firstName.charAt(0)}
                {customer.lastName.charAt(0)}
              </div>
              <div>
                <div className="font-bold text-sky-950 text-sm">
                  {customer.firstName} {customer.lastName}
                </div>
                <div className="text-sky-700">
                  Operatory: {appointment.operatory} • Provider: {appointment.doctorName}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="font-bold text-sky-900 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {appointment.date} @ {appointment.startTime}
              </span>
              <span className="text-[11px] text-sky-600 font-medium">
                Duration: {appointment.durationMinutes} min
              </span>
            </div>
          </div>

          {/* Clinical Procedure Form */}
          <div className="space-y-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
            <div className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-sky-600" />
              <span>Clinical Procedure Operation</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Procedure Name
                </label>
                <input
                  type="text"
                  value={procedureName}
                  onChange={(e) => setProcedureName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                >
                  <option value="Preventive">Preventive</option>
                  <option value="Restorative">Restorative</option>
                  <option value="Endodontic">Endodontic</option>
                  <option value="Periodontic">Periodontic</option>
                  <option value="Oral Surgery">Oral Surgery</option>
                  <option value="Cosmetic">Cosmetic</option>
                  <option value="Orthodontic">Orthodontic</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Doctor / Provider</label>
                <input
                  type="text"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Fee / Production Value ($)
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
                  <input
                    type="number"
                    value={cost}
                    onChange={(e) => setCost(Number(e.target.value))}
                    className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
            </div>

            {/* Interactive Teeth Involved Selector (1-32) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Teeth Involved in Operation ({selectedTeeth.length} Selected)
                </label>
                <div className="flex items-center gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setSelectedTeeth([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])}
                    className="text-sky-600 hover:underline px-1"
                  >
                    Upper Arch
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setSelectedTeeth([17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32])}
                    className="text-sky-600 hover:underline px-1"
                  >
                    Lower Arch
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setSelectedTeeth([])}
                    className="text-slate-500 hover:underline px-1"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Upper Arch (1-16) */}
              <div className="mb-1.5">
                <div className="text-[10px] font-semibold text-slate-400 mb-0.5">Upper Arch (1-16):</div>
                <div className="flex flex-wrap gap-1">
                  {Array.from({ length: 16 }, (_, i) => i + 1).map((tooth) => {
                    const isSelected = selectedTeeth.includes(tooth);
                    return (
                      <button
                        key={tooth}
                        type="button"
                        onClick={() => toggleTooth(tooth)}
                        className={`w-7 h-7 text-xs font-bold rounded-md transition-colors ${
                          isSelected
                            ? 'bg-sky-600 text-white shadow-xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {tooth}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Lower Arch (32-17) */}
              <div>
                <div className="text-[10px] font-semibold text-slate-400 mb-0.5">Lower Arch (32-17):</div>
                <div className="flex flex-wrap gap-1">
                  {Array.from({ length: 16 }, (_, i) => 32 - i).map((tooth) => {
                    const isSelected = selectedTeeth.includes(tooth);
                    return (
                      <button
                        key={tooth}
                        type="button"
                        onClick={() => toggleTooth(tooth)}
                        className={`w-7 h-7 text-xs font-bold rounded-md transition-colors ${
                          isSelected
                            ? 'bg-sky-600 text-white shadow-xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {tooth}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Clinical Notes & Quick Chips */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Clinical Notes & Findings
                </label>
                <span className="text-[10px] text-slate-400">Click phrase to append</span>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {quickPhrases.map((phrase, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddPhrase(phrase)}
                    className="text-[10px] px-2 py-0.5 bg-white border border-slate-200 rounded-md text-slate-600 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 transition-colors"
                  >
                    + {phrase.slice(0, 32)}...
                  </button>
                ))}
              </div>
              <textarea
                rows={3}
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 leading-relaxed"
              />
            </div>
          </div>

          {/* Photo Ops Studio Section */}
          <div className="space-y-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-indigo-600" />
                <span>Session Photo Ops & Intraoral Documentation ({sessionPhotos.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload File</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>

            {/* Photo Cards Grid */}
            {sessionPhotos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sessionPhotos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="bg-white p-3 rounded-xl border border-slate-200 flex space-x-3 items-center shadow-2xs relative group"
                  >
                    <div className="w-20 h-16 rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-slate-200">
                      <img
                        src={photo.url}
                        alt="Photo Op"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                            photo.stage === 'before'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {photo.stage}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-mono">
                          {photo.category}
                        </span>
                      </div>
                      <input
                        type="text"
                        value={photo.caption}
                        onChange={(e) => {
                          const updated = [...sessionPhotos];
                          updated[index].caption = e.target.value;
                          setSessionPhotos(updated);
                        }}
                        className="w-full text-xs text-slate-700 border-b border-transparent focus:border-sky-500 focus:outline-hidden py-0.5"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(photo.id)}
                      className="text-slate-300 hover:text-rose-500 p-1"
                      title="Remove photo op"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-white rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
                No photo ops attached yet. Click above presets or upload a clinical photo op.
              </div>
            )}

            {/* Auto-create Before & After Pair toggle */}
            {sessionPhotos.length >= 2 && (
              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    Bundle into Before & After Case Pair
                  </span>
                  <input
                    type="text"
                    value={baTitle}
                    onChange={(e) => setBaTitle(e.target.value)}
                    className="mt-1 text-xs text-indigo-900 bg-white border border-indigo-200 rounded-md px-2 py-1 w-full max-w-md"
                  />
                </div>
                <input
                  type="checkbox"
                  checked={createBAPair}
                  onChange={(e) => setCreateBAPair(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Updates patient chart, treatment history, and completes appointment</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save & Complete Session</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
