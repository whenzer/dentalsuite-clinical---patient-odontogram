import React, { useState, useRef, useEffect } from 'react';
import { BeforeAfterPair, Customer, DentalPhoto, ToothNumber } from '../types';
import {
  Camera,
  Upload,
  Sliders,
  ArrowRightLeft,
  Download,
  Trash2,
  CheckCircle,
  AlertCircle,
  Layers,
  ZoomIn,
  RefreshCw,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface PhotographyViewProps {
  customer: Customer;
  onSavePhoto: (photo: DentalPhoto) => void;
  onDeletePhoto: (photoId: string) => void;
  onSaveBeforeAfterPair: (pair: BeforeAfterPair) => void;
}

export const PhotographyView: React.FC<PhotographyViewProps> = ({
  customer,
  onSavePhoto,
  onDeletePhoto,
  onSaveBeforeAfterPair,
}) => {
  // Tabs: 'gallery', 'camera', 'before_after_maker'
  const [activeTab, setActiveTab] = useState<'gallery' | 'camera' | 'before_after'>('gallery');

  // Camera state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // New photo form metadata
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoCategory, setPhotoCategory] = useState<DentalPhoto['category']>('intraoral');
  const [photoStage, setPhotoStage] = useState<'before' | 'after' | 'standard'>('standard');
  const [selectedTeethInput, setSelectedTeethInput] = useState<string>('');

  // Before & After comparison state
  const [beforePhotoId, setBeforePhotoId] = useState<string>(
    customer.photos.find((p) => p.stage === 'before')?.id || customer.photos[0]?.id || ''
  );
  const [afterPhotoId, setAfterPhotoId] = useState<string>(
    customer.photos.find((p) => p.stage === 'after')?.id || customer.photos[1]?.id || ''
  );
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage 0 to 100
  const [comparisonMode, setComparisonMode] = useState<'slider' | 'side_by_side'>('slider');
  const [pairTitle, setPairTitle] = useState('Anterior Smile Transformation');
  const [pairSavedSuccess, setPairSavedSuccess] = useState(false);

  // Filter gallery
  const [galleryFilter, setGalleryFilter] = useState<string>('all');

  // Stop camera when unmounting or leaving tab
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  // Start live device camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera device API not supported in this browser or environment.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in your browser.'
          : 'Unable to connect to camera device. You can also upload photos directly.'
      );
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedPhotoUrl(dataUrl);
    stopCamera();
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCapturedPhotoUrl(event.target.result as string);
        setActiveTab('camera');
      }
    };
    reader.readAsDataURL(file);
  };

  // Save photo to customer info
  const handleSaveCapturedPhoto = () => {
    if (!capturedPhotoUrl) return;

    const parsedTeeth = selectedTeethInput
      .split(',')
      .map((s) => parseInt(s.trim()))
      .filter((n) => !isNaN(n) && n >= 1 && n <= 32) as ToothNumber[];

    const newPhoto: DentalPhoto = {
      id: `photo-${Date.now()}`,
      customerId: customer.id,
      url: capturedPhotoUrl,
      caption: photoCaption.trim() || 'Intraoral clinical photo',
      category: photoCategory,
      takenAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      relatedTeeth: parsedTeeth,
      stage: photoStage,
    };

    onSavePhoto(newPhoto);
    setCapturedPhotoUrl(null);
    setPhotoCaption('');
    setSelectedTeethInput('');
    setActiveTab('gallery');
  };

  // Group Navigation state
  const existingPairs = customer.beforeAfterPairs || [];
  const [selectedGroupIndex, setSelectedGroupIndex] = useState<number>(0);

  const handleSelectGroup = (index: number) => {
    if (existingPairs[index]) {
      setSelectedGroupIndex(index);
      const p = existingPairs[index];
      if (p.beforePhotoId) setBeforePhotoId(p.beforePhotoId);
      if (p.afterPhotoId) setAfterPhotoId(p.afterPhotoId);
      if (p.title) setPairTitle(p.title);
    }
  };

  const resolvePhoto = (id: string) => {
    const fromPhotos = customer.photos.find((p) => p.id === id || p.url === id);
    if (fromPhotos) return fromPhotos;
    const fromFiles = (customer.attachedFiles || []).find((f) => f.id === id || f.url === id);
    if (fromFiles) {
      return {
        id: fromFiles.id,
        customerId: customer.id,
        caption: fromFiles.name,
        category: (fromFiles.category === 'xray' ? 'xray' : 'intraoral') as any,
        stage: 'standard' as const,
        url: fromFiles.url,
        takenAt: fromFiles.uploadDate,
        relatedTeeth: fromFiles.relatedTeeth,
      };
    }
    return undefined;
  };

  const beforePhoto = resolvePhoto(beforePhotoId) || customer.photos[0];
  const afterPhoto = resolvePhoto(afterPhotoId) || customer.photos[1];

  // Save Before/After Pair
  const handleSavePair = () => {
    if (!beforePhoto || !afterPhoto) return;
    const newPair: BeforeAfterPair = {
      id: `ba-${Date.now()}`,
      customerId: customer.id,
      title: pairTitle.trim() || 'Clinical Before & After Comparison',
      beforePhotoId: beforePhoto.id,
      afterPhotoId: afterPhoto.id,
      dateCreated: new Date().toISOString().split('T')[0],
      notes: `Generated comparison between ${beforePhoto.caption} and ${afterPhoto.caption}.`,
      relatedTeeth: [
        ...(beforePhoto.relatedTeeth || []),
        ...(afterPhoto.relatedTeeth || []),
      ],
    };
    onSaveBeforeAfterPair(newPair);
    setPairSavedSuccess(true);
    setTimeout(() => setPairSavedSuccess(false), 3000);
  };

  // Generate composite Before/After downloadable canvas
  const handleExportCompositeImage = () => {
    if (!beforePhoto || !afterPhoto) return;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 1200;
    exportCanvas.height = 630;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    const imgBefore = new Image();
    const imgAfter = new Image();

    imgBefore.onload = () => {
      imgAfter.onload = () => {
        // Dark background
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 1200, 630);

        // Draw Before (Left half)
        ctx.drawImage(imgBefore, 30, 80, 550, 480);
        // Draw After (Right half)
        ctx.drawImage(imgAfter, 620, 80, 550, 480);

        // Header
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText(`Dental Clinical Case: ${pairTitle}`, 30, 45);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '16px sans-serif';
        ctx.fillText(`Patient: ${customer.firstName} ${customer.lastName} • Generated ${new Date().toLocaleDateString()}`, 30, 70);

        // Badges
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(40, 95, 120, 36);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('BEFORE', 65, 119);

        ctx.fillStyle = '#10b981';
        ctx.fillRect(630, 95, 120, 36);
        ctx.fillStyle = '#ffffff';
        ctx.fillText('AFTER', 660, 119);

        // Download trigger
        const link = document.createElement('a');
        link.download = `before_after_${customer.lastName}_${Date.now()}.png`;
        link.href = exportCanvas.toDataURL('image/png');
        link.click();
      };
      imgAfter.src = afterPhoto.url;
    };
    imgBefore.src = beforePhoto.url;
  };

  const filteredPhotos = customer.photos.filter((p) => {
    if (galleryFilter === 'all') return true;
    if (galleryFilter === 'before_after') return p.stage === 'before' || p.stage === 'after';
    return p.category === galleryFilter;
  });

  return (
    <div className="space-y-6">
      {/* View Switcher Header */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Camera className="w-5 h-5 text-sky-600" />
            <span>Clinical Photography & Before/After Comparison Studio</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Take clinical photos with your device camera, organize patient photo records, and create interactive before-and-after comparisons.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            id="tab-photo-gallery"
            onClick={() => setActiveTab('gallery')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'gallery'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-sky-600" />
            <span>Photo Records ({customer.photos?.length || 0})</span>
          </button>

          <button
            id="tab-take-photo"
            onClick={() => {
              setActiveTab('camera');
              startCamera();
            }}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'camera'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-sky-600" />
            <span>Take / Upload Photo</span>
          </button>

          <button
            id="tab-before-after"
            onClick={() => setActiveTab('before_after')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'before_after'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-sky-600" />
            <span>Before & After Studio</span>
          </button>
        </div>
      </div>

      {/* TAB 1: DEVICE CAMERA & UPLOAD VIEW */}
      {activeTab === 'camera' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Device Camera Viewfinder
                </h3>
                <p className="text-xs text-slate-500">
                  Align patient smile or intraoral quadrant with guidelines for sharp clinical documentation.
                </p>
              </div>

              <label className="cursor-pointer px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs flex items-center gap-1.5 transition-colors">
                <Upload className="w-4 h-4 text-sky-600" />
                <span>Upload Image File</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {cameraError && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{cameraError}</p>
                  <p className="mt-1 text-slate-600">
                    You can still upload photos from file storage, or click 'Start Camera' again to re-attempt device connection.
                  </p>
                </div>
              </div>
            )}

            {/* Video Viewfinder / Captured Frame Container */}
            <div className="relative aspect-16/10 bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center border-2 border-slate-800 shadow-inner">
              {capturedPhotoUrl ? (
                // Captured Image Preview
                <img
                  src={capturedPhotoUrl}
                  alt="Captured frame"
                  className="w-full h-full object-contain"
                />
              ) : (
                // Live Video
                <>
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Viewfinder crosshair overlay */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    {/* Reticle oval */}
                    <div className="w-72 h-44 border-2 border-sky-400/40 rounded-[50px] flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-sky-400/80" />
                    </div>
                  </div>
                </>
              )}

              {/* Hidden Canvas used to freeze frame */}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Camera Control Buttons */}
            <div className="flex items-center justify-center gap-4">
              {!capturedPhotoUrl ? (
                <>
                  {!isCameraActive ? (
                    <button
                      type="button"
                      onClick={startCamera}
                      id="start-camera-button"
                      className="px-6 py-3 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-md flex items-center gap-2 transition-all"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Start Device Camera</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={capturePhoto}
                      id="shutter-capture-button"
                      className="px-8 py-3.5 text-xs font-extrabold rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-lg flex items-center gap-2.5 transition-all transform active:scale-95"
                    >
                      <span className="w-3.5 h-3.5 rounded-full bg-white animate-pulse" />
                      <span>CAPTURE SHUTTER</span>
                    </button>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setCapturedPhotoUrl(null);
                    startCamera();
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 flex items-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Retake Photo</span>
                </button>
              )}
            </div>

            {/* Photo Metadata Form (Visible when photo is taken or uploaded) */}
            {capturedPhotoUrl && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 animate-in fade-in">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Save Photo to Customer Info
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Clinical Category
                    </label>
                    <select
                      value={photoCategory}
                      onChange={(e) => setPhotoCategory(e.target.value as any)}
                      className="w-full text-xs rounded-lg border border-slate-300 py-2 px-3 bg-white"
                    >
                      <option value="intraoral">Intraoral View</option>
                      <option value="extraoral">Extraoral Portrait</option>
                      <option value="smile">Smile Esthetics</option>
                      <option value="pre_op">Pre-Operative</option>
                      <option value="post_op">Post-Operative</option>
                      <option value="xray">Digital X-Ray / Radiograph</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Stage (For Before/After Comparison)
                    </label>
                    <select
                      value={photoStage}
                      onChange={(e) => setPhotoStage(e.target.value as any)}
                      className="w-full text-xs rounded-lg border border-slate-300 py-2 px-3 bg-white"
                    >
                      <option value="standard">Standard Observation</option>
                      <option value="before">Before (Pre-Treatment)</option>
                      <option value="after">After (Post-Treatment)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Related Tooth # (e.g. 8, 9, 19)
                    </label>
                    <input
                      type="text"
                      value={selectedTeethInput}
                      onChange={(e) => setSelectedTeethInput(e.target.value)}
                      placeholder="e.g., 8, 9"
                      className="w-full text-xs rounded-lg border border-slate-300 py-2 px-3 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Caption & Clinical Notes
                  </label>
                  <input
                    type="text"
                    value={photoCaption}
                    onChange={(e) => setPhotoCaption(e.target.value)}
                    placeholder="e.g., Deep cavity on occlusal surface of tooth #19 prior to restoration"
                    className="w-full text-xs rounded-lg border border-slate-300 py-2 px-3 bg-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCapturedPhotoUrl(null)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg"
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    id="save-captured-photo-btn"
                    onClick={handleSaveCapturedPhoto}
                    className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" /> Save to Customer Profile
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: BEFORE & AFTER MAKER & SLIDER */}
      {activeTab === 'before_after' && (
        <div className="space-y-6">
          {/* Studio Control Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Interactive Before & After Photo Comparison
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Compare pre-treatment versus post-treatment photos with an interactive split slider or side-by-side view.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Mode Toggle */}
              <div className="p-1 bg-slate-100 rounded-xl flex items-center gap-1">
                <button
                  onClick={() => setComparisonMode('slider')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 ${
                    comparisonMode === 'slider' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Interactive Split Slider</span>
                </button>
                <button
                  onClick={() => setComparisonMode('side_by_side')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 ${
                    comparisonMode === 'side_by_side' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Side-by-Side</span>
                </button>
              </div>

              {/* Export Button */}
              <button
                type="button"
                onClick={handleExportCompositeImage}
                className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-sky-600" />
                <span>Export High-Res Composite</span>
              </button>

              {/* Save Pair Button */}
              <button
                type="button"
                id="save-before-after-pair-btn"
                onClick={handleSavePair}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Save to Customer Case</span>
              </button>
            </div>
          </div>

          {pairSavedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Before & After transformation case successfully saved to customer record!</span>
            </div>
          )}

          {/* Group Navigation Bar (Next & Previous) */}
          {existingPairs.length > 0 && (
            <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-600 text-white shadow-2xs">
                  Group {selectedGroupIndex + 1} of {existingPairs.length}
                </span>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    {existingPairs[selectedGroupIndex]?.title || `Group ${selectedGroupIndex + 1}`}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {existingPairs[selectedGroupIndex]?.notes || 'Pre-op and post-op comparison'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectGroup(Math.max(0, selectedGroupIndex - 1))}
                  disabled={selectedGroupIndex === 0}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-white flex items-center gap-1 border border-slate-700 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous Group</span>
                </button>

                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  {existingPairs.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectGroup(idx)}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                        selectedGroupIndex === idx
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Group {idx + 1}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectGroup(Math.min(existingPairs.length - 1, selectedGroupIndex + 1))}
                  disabled={selectedGroupIndex >= existingPairs.length - 1}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-white flex items-center gap-1 border border-slate-700 transition-colors cursor-pointer"
                >
                  <span>Next Group</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Photo Selector Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Before Selector */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                  1. SELECT "BEFORE" PHOTO
                </span>
                <span className="text-xs text-slate-400 font-medium">Pre-op / Initial</span>
              </div>
              <select
                value={beforePhotoId}
                onChange={(e) => setBeforePhotoId(e.target.value)}
                className="w-full text-xs font-medium rounded-xl border border-slate-300 py-2 px-3 bg-slate-50 text-slate-800"
              >
                {customer.photos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.takenAt} — {p.caption.slice(0, 40)} ({p.category})
                  </option>
                ))}
              </select>
            </div>

            {/* After Selector */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  2. SELECT "AFTER" PHOTO
                </span>
                <span className="text-xs text-slate-400 font-medium">Post-op / Restored</span>
              </div>
              <select
                value={afterPhotoId}
                onChange={(e) => setAfterPhotoId(e.target.value)}
                className="w-full text-xs font-medium rounded-xl border border-slate-300 py-2 px-3 bg-slate-50 text-slate-800"
              >
                {customer.photos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.takenAt} — {p.caption.slice(0, 40)} ({p.category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Visual Comparison Stage */}
          {beforePhoto && afterPhoto ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
              {comparisonMode === 'slider' ? (
                // Interactive Split Slider View
                <div className="space-y-4">
                  <div className="relative w-full max-w-4xl mx-auto aspect-16/10 rounded-2xl overflow-hidden shadow-md select-none bg-slate-900">
                    {/* AFTER image (Underneath / Background) */}
                    <img
                      src={afterPhoto.url}
                      alt="After clinical"
                      className="absolute inset-0 w-full h-full object-cover"
                    />

                    {/* AFTER label badge */}
                    <div className="absolute top-4 right-4 z-10 px-3 py-1 bg-emerald-600/90 text-white font-bold text-xs rounded-lg shadow-md tracking-wider">
                      POST-OP / AFTER
                    </div>

                    {/* BEFORE image (Clipped with width matching slider percentage) */}
                    <div
                      className="absolute inset-0 overflow-hidden"
                      style={{ width: `${sliderPosition}%` }}
                    >
                      <img
                        src={beforePhoto.url}
                        alt="Before clinical"
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ width: '100%', maxWidth: 'none' }}
                      />
                      {/* BEFORE label badge */}
                      <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-rose-600/90 text-white font-bold text-xs rounded-lg shadow-md tracking-wider">
                        PRE-OP / BEFORE
                      </div>
                    </div>

                    {/* Vertical Divider Line with Grab Handle */}
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_12px_rgba(0,0,0,0.6)] cursor-ew-resize z-20"
                      style={{ left: `${sliderPosition}%` }}
                    >
                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white shadow-xl border-2 border-slate-800 flex items-center justify-center text-slate-800 text-xs">
                        <ArrowRightLeft className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {/* Range Slider Track */}
                  <div className="max-w-4xl mx-auto flex items-center gap-4 px-2">
                    <span className="text-xs font-bold text-rose-700">Before</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sliderPosition}
                      onChange={(e) => setSliderPosition(Number(e.target.value))}
                      className="w-full accent-sky-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                    />
                    <span className="text-xs font-bold text-emerald-700">After</span>
                    <span className="text-xs font-mono font-bold text-slate-500 w-12 text-right">
                      {sliderPosition}%
                    </span>
                  </div>
                </div>
              ) : (
                // Side-by-Side Dual View
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                  {/* Before Side */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-100 text-rose-800">
                        BEFORE (PRE-OP)
                      </span>
                      <span className="text-xs text-slate-500">{beforePhoto.takenAt}</span>
                    </div>
                    <div className="aspect-16/10 rounded-xl overflow-hidden bg-slate-900 shadow-md">
                      <img
                        src={beforePhoto.url}
                        alt="Before"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-xs text-slate-600">{beforePhoto.caption}</p>
                  </div>

                  {/* After Side */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-800">
                        AFTER (POST-OP)
                      </span>
                      <span className="text-xs text-slate-500">{afterPhoto.takenAt}</span>
                    </div>
                    <div className="aspect-16/10 rounded-xl overflow-hidden bg-slate-900 shadow-md">
                      <img
                        src={afterPhoto.url}
                        alt="After"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-xs text-slate-600">{afterPhoto.caption}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Camera className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-sm text-slate-700">Need at least 2 photos to compare</p>
              <p className="text-xs text-slate-500 mt-1">Take or upload photos using the device camera above.</p>
            </div>
          )}

          {/* Existing Saved Before & After Cases for this Customer */}
          {customer.beforeAfterPairs && customer.beforeAfterPairs.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
                Saved Case Comparisons in Customer Record ({customer.beforeAfterPairs.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {customer.beforeAfterPairs.map((pair) => (
                  <div
                    key={pair.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between hover:bg-slate-100 transition-colors"
                  >
                    <div>
                      <p className="font-bold text-xs text-slate-900">{pair.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Created: {pair.dateCreated} • {pair.notes}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setBeforePhotoId(pair.beforePhotoId);
                        setAfterPhotoId(pair.afterPhotoId);
                        setPairTitle(pair.title);
                      }}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-sky-700 hover:bg-sky-50 shadow-2xs"
                    >
                      Load in Studio
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CUSTOMER PHOTO GALLERY */}
      {activeTab === 'gallery' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              {['all', 'intraoral', 'pre_op', 'post_op', 'smile', 'xray'].map((f) => (
                <button
                  key={f}
                  onClick={() => setGalleryFilter(f)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                    galleryFilter === f
                      ? 'bg-sky-600 text-white shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {f.replace('_', ' ')}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setActiveTab('camera');
                startCamera();
              }}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Photo</span>
            </button>
          </div>

          {/* Photo Grid */}
          {filteredPhotos.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 shadow-xs">
              <Camera className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-sm text-slate-800">No photos found for this category</p>
              <p className="text-xs text-slate-500 mt-1">Take a new photo with device camera or upload from files.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between group"
                >
                  <div className="relative aspect-4/3 bg-slate-900">
                    <img
                      src={photo.url}
                      alt={photo.caption}
                      className="w-full h-full object-cover"
                    />
                    <span
                      className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold shadow-xs ${
                        photo.stage === 'before'
                          ? 'bg-rose-600 text-white'
                          : photo.stage === 'after'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-black/60 text-white backdrop-blur-xs'
                      }`}
                    >
                      {photo.stage?.toUpperCase() || photo.category.toUpperCase()}
                    </span>

                    {photo.relatedTeeth && photo.relatedTeeth.length > 0 && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold bg-white/90 text-slate-800 backdrop-blur-xs shadow-xs">
                        #{photo.relatedTeeth.join(', #')}
                      </span>
                    )}
                  </div>

                  <div className="p-3.5 space-y-2">
                    <p className="text-xs font-semibold text-slate-900 line-clamp-2">
                      {photo.caption}
                    </p>
                    <p className="text-[10px] text-slate-400">Taken: {photo.takenAt}</p>

                    {/* Action buttons */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                      <button
                        onClick={() => {
                          setBeforePhotoId(photo.id);
                          setActiveTab('before_after');
                        }}
                        className="px-2 py-1 text-[10px] font-semibold rounded bg-rose-50 text-rose-700 hover:bg-rose-100"
                        title="Set as Before photo in comparison"
                      >
                        Set as Before
                      </button>
                      <button
                        onClick={() => {
                          setAfterPhotoId(photo.id);
                          setActiveTab('before_after');
                        }}
                        className="px-2 py-1 text-[10px] font-semibold rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        title="Set as After photo in comparison"
                      >
                        Set as After
                      </button>
                      <button
                        onClick={() => onDeletePhoto(photo.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Delete photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
