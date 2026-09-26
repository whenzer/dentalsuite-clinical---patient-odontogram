import React, { useState, useEffect } from 'react';
import { Customer, AttachedFile, ToothNumber, BeforeAfterPair } from '../types';
import {
  FileText,
  FileImage,
  Eye,
  Trash2,
  Plus,
  X,
  ZoomIn,
  ZoomOut,
  Sliders,
  RotateCw,
  Box,
  Layers,
  Search,
  Check,
  ArrowRightLeft,
  ChevronRight,
} from 'lucide-react';

interface AttachedFilesSectionProps {
  customer: Customer;
  onUpdateAttachedFiles: (files: AttachedFile[]) => void;
  hideHeaderTitle?: boolean;
  beforeAfterPairs?: BeforeAfterPair[];
  onSetFileAsBeforeAfter?: (
    file: AttachedFile,
    role: 'before' | 'after',
    groupIndex: number | 'new'
  ) => void;
}

export const AttachedFilesSection: React.FC<AttachedFilesSectionProps> = ({
  customer,
  onUpdateAttachedFiles,
  hideHeaderTitle = false,
  beforeAfterPairs = [],
  onSetFileAsBeforeAfter,
}) => {
  // Ensure photos on Before and After and all clinical photos show on Files
  const unifiedFiles: AttachedFile[] = React.useMemo(() => {
    const list: AttachedFile[] = [...(customer.attachedFiles || [])];
    const existingIds = new Set(list.map((f) => f.id));
    const existingUrls = new Set(list.map((f) => f.url));

    // Incorporate all patient photos (including Before & After photos)
    const patientPhotos = customer.photos || [];
    patientPhotos.forEach((photo) => {
      if (!existingIds.has(photo.id) && !existingUrls.has(photo.url)) {
        list.push({
          id: photo.id,
          name: photo.caption
            ? `${photo.caption.replace(/[/\\?%*:|"<>]/g, '_').slice(0, 36)}.jpg`
            : `Clinical_Photo_${photo.id}.jpg`,
          category: (photo.category === 'xray' ? 'xray' : 'picture') as 'xray' | 'picture',
          fileType: 'JPG',
          uploadDate: photo.takenAt?.split(' ')[0] || new Date().toISOString().split('T')[0],
          sizeBytes: 2450000,
          url: photo.url,
          thumbnailUrl: photo.url,
          notes: photo.caption || `${photo.stage?.toUpperCase() || 'Clinical'} Photo`,
          relatedTeeth: photo.relatedTeeth || [],
        });
        existingIds.add(photo.id);
        existingUrls.add(photo.url);
      }
    });

    return list;
  }, [customer.attachedFiles, customer.photos]);

  const files: AttachedFile[] = unifiedFiles;

  const [activeCategory, setActiveCategory] = useState<
    'all' | '3d_scan' | 'xray' | 'picture' | 'document'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFileForPreview, setSelectedFileForPreview] = useState<AttachedFile | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Context Menu State for Right-Clicking Images
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    file: AttachedFile;
  } | null>(null);
  const [actionToast, setActionToast] = useState<string | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (actionToast) {
      const timer = setTimeout(() => setActionToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [actionToast]);

  // Preview Viewer Controls
  const [xrayInverted, setXrayInverted] = useState(false);
  const [xrayContrastHigh, setXrayContrastHigh] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [isWireframe, setIsWireframe] = useState(false);
  const [modelRotation, setModelRotation] = useState(0);

  // New File Upload Form State
  const [newFileName, setNewFileName] = useState('');
  const [newCategory, setNewCategory] = useState<'3d_scan' | 'xray' | 'picture' | 'document'>('xray');
  const [newFileType, setNewFileType] = useState('PNG');
  const [newFileUrl, setNewFileUrl] = useState('');
  const [newFileNotes, setNewFileNotes] = useState('');
  const [newTeethInvolved, setNewTeethInvolved] = useState('');

  const isImageFile = (file: AttachedFile) => {
    if (file.category === 'picture' || file.category === 'xray') return true;
    const ext = (file.fileType || '').toUpperCase();
    if (['PNG', 'JPG', 'JPEG', 'WEBP', 'GIF', 'BMP', 'SVG'].includes(ext)) return true;
    if (
      file.url &&
      (file.url.includes('images.unsplash.com') ||
        file.url.startsWith('data:image') ||
        file.url.endsWith('.png') ||
        file.url.endsWith('.jpg') ||
        file.url.endsWith('.jpeg'))
    ) {
      return true;
    }
    return false;
  };

  const getFileGroupAssignment = (file: AttachedFile) => {
    const pairs = beforeAfterPairs.length > 0 ? beforeAfterPairs : customer.beforeAfterPairs || [];
    for (let i = 0; i < pairs.length; i++) {
      const p = pairs[i];
      if (p.beforePhotoId === file.id || p.beforePhotoId === file.url) {
        return { groupIndex: i, role: 'before' as const, groupTitle: p.title || `Group ${i + 1}` };
      }
      if (p.afterPhotoId === file.id || p.afterPhotoId === file.url) {
        return { groupIndex: i, role: 'after' as const, groupTitle: p.title || `Group ${i + 1}` };
      }
    }
    return null;
  };

  const handleContextMenu = (e: React.MouseEvent, file: AttachedFile) => {
    if (!isImageFile(file)) return;
    e.preventDefault();
    e.stopPropagation();

    // Prevent menu overflow offscreen
    const menuWidth = 280;
    const menuHeight = 360;
    const x = Math.min(e.clientX, window.innerWidth - menuWidth - 16);
    const y = Math.min(e.clientY, window.innerHeight - menuHeight - 16);

    setContextMenu({
      x: Math.max(16, x),
      y: Math.max(16, y),
      file,
    });
  };

  const handleAssignRole = (
    file: AttachedFile,
    role: 'before' | 'after',
    groupIndex: number | 'new'
  ) => {
    if (onSetFileAsBeforeAfter) {
      onSetFileAsBeforeAfter(file, role, groupIndex);
    }
    const currentPairs = beforeAfterPairs.length > 0 ? beforeAfterPairs : customer.beforeAfterPairs || [];
    const groupNum = groupIndex === 'new' ? currentPairs.length + 1 : groupIndex + 1;
    setActionToast(`✓ Set "${file.name}" as ${role.toUpperCase()} in Group ${groupNum}`);
    setContextMenu(null);
  };

  const filteredFiles = files.filter((f) => {
    const matchesCategory = activeCategory === 'all' || f.category === activeCategory;
    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.notes && f.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      f.fileType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.relatedTeeth && f.relatedTeeth.some((t) => t.toString().includes(searchQuery)));
    return matchesCategory && matchesSearch;
  });

  const count3D = files.filter((f) => f.category === '3d_scan').length;
  const countXray = files.filter((f) => f.category === 'xray').length;
  const countPicture = files.filter((f) => f.category === 'picture').length;
  const countDoc = files.filter((f) => f.category === 'document').length;

  const handleDeleteFile = (fileId: string) => {
    if (window.confirm('Are you sure you want to remove this file from the patient record?')) {
      const next = files.filter((f) => f.id !== fileId);
      onUpdateAttachedFiles(next);
      if (selectedFileForPreview?.id === fileId) {
        setSelectedFileForPreview(null);
      }
    }
  };

  const handleCreateFile = () => {
    if (!newFileName.trim()) return;

    let defaultUrl = newFileUrl.trim();
    if (!defaultUrl) {
      if (newCategory === '3d_scan') {
        defaultUrl = 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800&auto=format&fit=crop&q=80';
      } else if (newCategory === 'xray') {
        defaultUrl = 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1200&auto=format&fit=crop&q=80';
      } else if (newCategory === 'picture') {
        defaultUrl = 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800&auto=format&fit=crop&q=80';
      } else {
        defaultUrl = '#';
      }
    }

    const teethArr: ToothNumber[] = newTeethInvolved
      ? (newTeethInvolved
          .split(',')
          .map((s) => parseInt(s.trim(), 10))
          .filter((n) => !isNaN(n) && n >= 1 && n <= 32) as ToothNumber[])
      : [];

    const newAttached: AttachedFile = {
      id: `file-${Date.now()}`,
      name: newFileName.trim(),
      category: newCategory,
      fileType: newFileType.toUpperCase(),
      uploadDate: new Date().toISOString().split('T')[0],
      sizeBytes: Math.floor(Math.random() * 8000000) + 1200000,
      url: defaultUrl,
      thumbnailUrl: defaultUrl,
      notes: newFileNotes.trim(),
      relatedTeeth: teethArr.length > 0 ? teethArr : undefined,
    };

    onUpdateAttachedFiles([newAttached, ...files]);
    setShowUploadModal(false);
    setNewFileName('');
    setNewFileNotes('');
    setNewTeethInvolved('');
    setNewFileUrl('');
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '1.8 MB';
    if (bytes >= 1048576) {
      return (bytes / 1048576).toFixed(1) + ' MB';
    }
    return (bytes / 1024).toFixed(0) + ' KB';
  };

  const pairsList = beforeAfterPairs.length > 0 ? beforeAfterPairs : customer.beforeAfterPairs || [];

  return (
    <div className="space-y-3">
      {/* Toast Notification Banner */}
      {actionToast && (
        <div className="bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-md flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{actionToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionToast(null)}
            className="text-white/80 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Section Header / Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100">
        <div>
          {!hideHeaderTitle && (
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-600" />
              <span>Files</span>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {files.length} Files
              </span>
            </h3>
          )}
          <p className="text-[11px] text-slate-500 mt-0.5">
            Intraoral 3D scans (.STL, .PLY), dental radiographs (OPG, bitewings), clinical photography, and lab records. Right-click any image to set as Before or After comparison.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowUploadModal(true)}
          className="px-3 py-1.5 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-700 text-white shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Upload File / Scan</span>
        </button>
      </div>

      {/* Categories & Search Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Category Badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Files ({files.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('3d_scan')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeCategory === '3d_scan'
                ? 'bg-sky-600 text-white'
                : 'bg-sky-50 text-sky-700 hover:bg-sky-100'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D Scans ({count3D})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('xray')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeCategory === 'xray'
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            <FileImage className="w-3.5 h-3.5" />
            <span>X-Rays ({countXray})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('picture')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeCategory === 'picture'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <FileImage className="w-3.5 h-3.5" />
            <span>Pictures ({countPicture})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('document')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeCategory === 'document'
                ? 'bg-purple-600 text-white'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Lab / Docs ({countDoc})</span>
          </button>
        </div>

        {/* Search Box */}
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files..."
            className="w-full text-xs pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Files Grid */}
      {filteredFiles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {filteredFiles.map((file) => {
            const is3D = file.category === '3d_scan';
            const isXray = file.category === 'xray';
            const isDoc = file.category === 'document';
            const isPic = file.category === 'picture';
            const isImg = isImageFile(file);
            const assignment = isImg ? getFileGroupAssignment(file) : null;

            return (
              <div
                key={file.id}
                onContextMenu={(e) => isImg && handleContextMenu(e, file)}
                className={`bg-white border rounded-xl p-3 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group ${
                  assignment
                    ? 'border-emerald-300 ring-1 ring-emerald-200/50'
                    : 'border-slate-200 hover:border-sky-300'
                }`}
              >
                <div>
                  {/* Thumbnail / Header Area */}
                  <div
                    onContextMenu={(e) => isImg && handleContextMenu(e, file)}
                    className="relative h-28 w-full bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center mb-2.5 border border-slate-200/80"
                  >
                    {is3D ? (
                      <div className="w-full h-full bg-linear-to-br from-slate-900 via-sky-950 to-slate-900 flex flex-col items-center justify-center p-3 text-center">
                        <Box className="w-8 h-8 text-sky-400 animate-pulse mb-1" />
                        <span className="text-[11px] font-bold text-sky-200 font-mono">
                          3D Digital Mesh
                        </span>
                        <span className="text-[9px] text-sky-400/80">
                          {file.fileType} Format
                        </span>
                      </div>
                    ) : isDoc ? (
                      <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center p-3 text-slate-600">
                        <FileText className="w-10 h-10 text-purple-600 mb-1" />
                        <span className="text-[10px] font-bold text-slate-700">
                          {file.fileType} Document
                        </span>
                      </div>
                    ) : (
                      <img
                        src={file.thumbnailUrl || file.url}
                        alt={file.name}
                        referrerPolicy="no-referrer"
                        className={`w-full h-full object-cover ${
                          isXray ? 'filter contrast-125 brightness-95' : ''
                        }`}
                      />
                    )}

                    {/* Category Label Pill */}
                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide shadow-2xs ${
                          is3D
                            ? 'bg-sky-600 text-white'
                            : isXray
                            ? 'bg-indigo-600 text-white'
                            : isPic
                            ? 'bg-emerald-600 text-white'
                            : 'bg-purple-600 text-white'
                        }`}
                      >
                        {file.category.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Group Assignment Badge */}
                    {assignment && (
                      <div className="absolute top-2 right-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold shadow-xs flex items-center gap-1 ${
                            assignment.role === 'before'
                              ? 'bg-rose-600 text-white'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          <span>Group {assignment.groupIndex + 1}</span>
                          <span className="uppercase text-[8px] opacity-90 font-extrabold">
                            ({assignment.role})
                          </span>
                        </span>
                      </div>
                    )}

                    {/* Quick Preview Hover Trigger */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFileForPreview(file);
                        setPreviewZoom(1);
                        setXrayInverted(false);
                        setXrayContrastHigh(false);
                      }}
                      className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5 backdrop-blur-2xs cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                      <span>{is3D ? 'Inspect 3D Model' : 'View File'}</span>
                    </button>
                  </div>

                  {/* File Metadata */}
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-900 truncate" title={file.name}>
                      {file.name}
                    </p>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                      <span>{file.uploadDate}</span>
                      <span>•</span>
                      <span>{formatFileSize(file.sizeBytes)}</span>
                      <span>•</span>
                      <span className="font-mono text-slate-600 uppercase">{file.fileType}</span>
                    </div>

                    {isImg && (
                      <p className="text-[10px] text-sky-600 font-medium flex items-center gap-1 pt-0.5">
                        <ArrowRightLeft className="w-3 h-3 text-sky-500 shrink-0" />
                        <span>Right-click to set as Before / After</span>
                      </p>
                    )}

                    {file.notes && (
                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-tight pt-0.5">
                        {file.notes}
                      </p>
                    )}

                    {file.relatedTeeth && file.relatedTeeth.length > 0 && (
                      <div className="flex items-center gap-1 pt-1 flex-wrap">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Teeth:</span>
                        {file.relatedTeeth.map((t) => (
                          <span
                            key={t}
                            className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFileForPreview(file);
                        setPreviewZoom(1);
                        setXrayInverted(false);
                        setXrayContrastHigh(false);
                      }}
                      className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Open</span>
                    </button>

                    {isImg && (
                      <button
                        type="button"
                        onClick={(e) => handleContextMenu(e, file)}
                        title="Set as Before or After comparison image"
                        className="text-xs font-semibold text-slate-600 hover:text-sky-700 flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 hover:bg-sky-50 transition-colors cursor-pointer"
                      >
                        <ArrowRightLeft className="w-3 h-3 text-sky-600" />
                        <span>B&A</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDeleteFile(file.id)}
                      title="Remove file"
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
          <Layers className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-xs font-bold text-slate-700">No files found</p>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            Attach dental radiographs, intraoral 3D scans (.STL), or clinical photos to this patient's record.
          </p>
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-sky-600 text-white hover:bg-sky-700 transition-colors inline-flex items-center gap-1 mt-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>
        </div>
      )}

      {/* ===================================================================== */}
      {/* CUSTOM CONTEXT MENU: RIGHT-CLICK ON IMAGE FILE                        */}
      {/* "if its an image if you right click you may set it as before or after"*/}
      {/* ===================================================================== */}
      {contextMenu && (
        <>
          {/* Backdrop overlay to close when clicking outside */}
          <div
            className="fixed inset-0 z-50 cursor-default"
            onClick={() => setContextMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu(null);
            }}
          />

          <div
            style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
            className="fixed z-50 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden text-xs animate-in fade-in zoom-in-95 duration-100 select-none"
          >
            <div className="p-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2 overflow-hidden">
                <ArrowRightLeft className="w-4 h-4 text-sky-400 shrink-0" />
                <div className="overflow-hidden">
                  <p className="font-bold text-xs truncate">{contextMenu.file.name}</p>
                  <p className="text-[10px] text-slate-400">Set as Before / After Pair</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setContextMenu(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-3 space-y-3 max-h-80 overflow-y-auto">
              {/* Existing Groups */}
              {pairsList.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Assign to Existing Comparison Group:
                  </p>
                  {pairsList.map((pair, idx) => {
                    const isCurrentBefore = pair.beforePhotoId === contextMenu.file.id || pair.beforePhotoId === contextMenu.file.url;
                    const isCurrentAfter = pair.afterPhotoId === contextMenu.file.id || pair.afterPhotoId === contextMenu.file.url;

                    return (
                      <div
                        key={pair.id}
                        className="p-2 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 text-[11px] truncate">
                            Group {idx + 1}: {pair.title}
                          </span>
                          {(isCurrentBefore || isCurrentAfter) && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                              Current {isCurrentBefore ? 'Before' : 'After'}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                          <button
                            type="button"
                            onClick={() => handleAssignRole(contextMenu.file, 'before', idx)}
                            className={`px-2 py-1 rounded text-[11px] font-bold border transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                              isCurrentBefore
                                ? 'bg-rose-600 text-white border-rose-700 shadow-2xs'
                                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                            }`}
                          >
                            <span>Set as "Before"</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAssignRole(contextMenu.file, 'after', idx)}
                            className={`px-2 py-1 rounded text-[11px] font-bold border transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                              isCurrentAfter
                                ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            }`}
                          >
                            <span>Set as "After"</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 italic">
                  No existing comparison groups yet. Create your first group below!
                </p>
              )}

              {/* Create New Group Pair */}
              <div className="pt-2 border-t border-slate-200 space-y-1.5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  + Create New Group Pair
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleAssignRole(contextMenu.file, 'before', 'new')}
                    className="px-2 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-bold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>New as "Before"</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAssignRole(contextMenu.file, 'after', 'new')}
                    className="px-2 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>New as "After"</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ===================================================================== */}
      {/* MODAL: FILE PREVIEW & INSPECTION VIEWER                               */}
      {/* ===================================================================== */}
      {selectedFileForPreview && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 bg-sky-100 text-sky-700 rounded-lg">
                  {selectedFileForPreview.category === '3d_scan' ? (
                    <Box className="w-4 h-4" />
                  ) : (
                    <FileImage className="w-4 h-4" />
                  )}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 truncate max-w-md">
                    {selectedFileForPreview.name}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Uploaded: {selectedFileForPreview.uploadDate} · Format: {selectedFileForPreview.fileType} · Size: {formatFileSize(selectedFileForPreview.sizeBytes)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isImageFile(selectedFileForPreview) && (
                  <button
                    type="button"
                    onClick={(e) => handleContextMenu(e, selectedFileForPreview)}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>Set as Before/After</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedFileForPreview(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Viewer Canvas Area */}
            <div className="relative flex-1 min-h-[350px] max-h-[60vh] bg-slate-950 flex items-center justify-center overflow-hidden">
              {selectedFileForPreview.category === '3d_scan' ? (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center select-none">
                  <div
                    style={{ transform: `rotate(${modelRotation}deg) scale(${previewZoom})` }}
                    className="transition-transform duration-100 cursor-grab active:cursor-grabbing"
                  >
                    <Box className={`w-32 h-32 ${isWireframe ? 'text-sky-400 stroke-1' : 'text-sky-500'}`} />
                  </div>
                  <p className="text-xs text-slate-400 mt-4 font-mono">
                    3D Digital Impression Model ({selectedFileForPreview.fileType})
                  </p>
                </div>
              ) : selectedFileForPreview.category === 'document' ? (
                <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center p-8 text-center text-slate-700">
                  <FileText className="w-16 h-16 text-purple-600 mb-3" />
                  <p className="font-bold text-sm">{selectedFileForPreview.name}</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    {selectedFileForPreview.notes || 'Official diagnostic laboratory report or clinical PDF document.'}
                  </p>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center overflow-auto p-4 select-none">
                  <img
                    src={selectedFileForPreview.url}
                    alt={selectedFileForPreview.name}
                    style={{
                      transform: `scale(${previewZoom})`,
                      filter: `${xrayInverted ? 'invert(100%)' : ''} ${
                        xrayContrastHigh ? 'contrast(180%)' : ''
                      }`,
                    }}
                    className="max-h-[55vh] max-w-full object-contain transition-all duration-150 rounded"
                  />
                </div>
              )}

              {/* In-Viewer Quick Controls Floating Pill */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-xs text-white px-3 py-1.5 rounded-full flex items-center gap-3 text-xs shadow-lg border border-slate-700">
                <button
                  type="button"
                  onClick={() => setPreviewZoom((z) => Math.max(0.5, z - 0.25))}
                  className="hover:text-sky-400 cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="font-mono text-[11px] text-slate-300">
                  {Math.round(previewZoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewZoom((z) => Math.min(3, z + 0.25))}
                  className="hover:text-sky-400 cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>

                {selectedFileForPreview.category === 'xray' && (
                  <>
                    <div className="w-px h-3.5 bg-slate-700" />
                    <button
                      type="button"
                      onClick={() => setXrayInverted(!xrayInverted)}
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded cursor-pointer ${
                        xrayInverted ? 'bg-sky-600 text-white' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      Invert
                    </button>
                    <button
                      type="button"
                      onClick={() => setXrayContrastHigh(!xrayContrastHigh)}
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded cursor-pointer ${
                        xrayContrastHigh ? 'bg-sky-600 text-white' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      High Contrast
                    </button>
                  </>
                )}

                {selectedFileForPreview.category === '3d_scan' && (
                  <>
                    <div className="w-px h-3.5 bg-slate-700" />
                    <button
                      type="button"
                      onClick={() => setModelRotation((r) => r + 45)}
                      className="hover:text-sky-400 flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span className="text-[10px]">Rotate</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsWireframe(!isWireframe)}
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded cursor-pointer ${
                        isWireframe ? 'bg-sky-600 text-white' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      Wireframe
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Modal Footer Notes */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                {selectedFileForPreview.notes && (
                  <p className="text-slate-700 font-medium">
                    <span className="font-bold text-slate-900">Clinical Notes:</span> {selectedFileForPreview.notes}
                  </p>
                )}
                {selectedFileForPreview.relatedTeeth && (
                  <p className="text-slate-500">
                    <span className="font-bold">Teeth Involved:</span> #{selectedFileForPreview.relatedTeeth.join(', #')}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedFileForPreview(null)}
                  className="px-4 py-2 font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  Close Viewer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: UPLOAD NEW FILE                                                */}
      {/* ===================================================================== */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                Upload File / Diagnostic Record
              </h3>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">File Name *</label>
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  placeholder="e.g. Anterior_Smile_PreOp.png"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg cursor-pointer"
                  >
                    <option value="picture">Picture / Clinical Photo</option>
                    <option value="xray">X-Ray / Radiograph</option>
                    <option value="3d_scan">3D Scan (.STL / .PLY)</option>
                    <option value="document">Document / Lab PDF</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">File Extension Format</label>
                  <input
                    type="text"
                    value={newFileType}
                    onChange={(e) => setNewFileType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                    placeholder="PNG, JPG, STL, etc."
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Related Teeth (e.g. 8, 9)</label>
                <input
                  type="text"
                  value={newTeethInvolved}
                  onChange={(e) => setNewTeethInvolved(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  placeholder="8, 9"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Direct Image URL (optional)</label>
                <input
                  type="text"
                  value={newFileUrl}
                  onChange={(e) => setNewFileUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Clinical Notes</label>
                <textarea
                  rows={2}
                  value={newFileNotes}
                  onChange={(e) => setNewFileNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  placeholder="Describe scan capture device, radiographic technique, or relevant anatomy..."
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateFile}
                disabled={!newFileName.trim()}
                className="px-4 py-2 font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-lg disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
              >
                Save File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
