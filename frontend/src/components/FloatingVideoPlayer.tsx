import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Move,
  Maximize2,
  Minimize2,
  Sparkles,
  Tv,
  Film,
  RotateCcw,
} from 'lucide-react';

interface FloatingVideoPlayerProps {
  patientName: string;
  patientAge: number;
  onClose: () => void;
}

interface VideoChannel {
  id: string;
  title: string;
  category: string;
  url: string;
  duration: string;
}

const CHANNELS: VideoChannel[] = [
  {
    id: 'bunny',
    title: 'Big Buck Bunny (Forest Cartoon)',
    category: 'Cartoon Comedy',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    duration: 'Animated Short',
  },
  {
    id: 'sintel',
    title: 'Sintel & Little Dragon',
    category: 'Adventure Fantasy',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    duration: 'Family Adventure',
  },
  {
    id: 'blazes',
    title: 'Speedy Cartoon Action',
    category: 'Kids Cartoon',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    duration: 'Action Fun',
  },
  {
    id: 'steel',
    title: 'Sci-Fi Friendly Robots',
    category: 'Science Fiction',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    duration: 'Futuristic',
  },
];

export const FloatingVideoPlayer: React.FC<FloatingVideoPlayerProps> = ({
  patientName,
  patientAge,
  onClose,
}) => {
  const [selectedChannel, setSelectedChannel] = useState<VideoChannel>(CHANNELS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Dimensions state (Width & Height)
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 440,
    height: 300,
  });

  // Coordinates state (X & Y)
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    const defaultX = typeof window !== 'undefined' ? Math.max(20, window.innerWidth - 480) : 100;
    const defaultY = typeof window !== 'undefined' ? Math.max(20, window.innerHeight - 380) : 100;
    return { x: defaultX, y: defaultY };
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Dragging state
  const isDraggingRef = useRef<boolean>(false);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Resizing state
  const isResizingRef = useRef<boolean>(false);
  const resizeStartRef = useRef<{ startX: number; startY: number; startW: number; startH: number }>({
    startX: 0,
    startY: 0,
    startW: 0,
    startH: 0,
  });

  // Keep inside screen boundaries on window resize
  useEffect(() => {
    const handleWindowResize = () => {
      setPosition((prev) => ({
        x: Math.min(prev.x, window.innerWidth - dimensions.width - 10),
        y: Math.min(prev.y, window.innerHeight - dimensions.height - 10),
      }));
    };
    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [dimensions]);

  // Drag handlers (Mouse & Touch)
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    // Only drag from header, ignore buttons
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('select') || target.closest('.no-drag')) {
      return;
    }

    isDraggingRef.current = true;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    dragOffsetRef.current = {
      x: clientX - position.x,
      y: clientY - position.y,
    };

    e.preventDefault();
  };

  // Resize handlers
  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    isResizingRef.current = true;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    resizeStartRef.current = {
      startX: clientX,
      startY: clientY,
      startW: dimensions.width,
      startH: dimensions.height,
    };
  };

  // Global mousemove & mouseup listeners
  const handleGlobalMove = useCallback((e: MouseEvent | TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

    // Handle Dragging
    if (isDraggingRef.current) {
      const newX = clientX - dragOffsetRef.current.x;
      const newY = clientY - dragOffsetRef.current.y;

      const maxX = window.innerWidth - dimensions.width - 10;
      const maxY = window.innerHeight - (isCollapsed ? 50 : dimensions.height) - 10;

      setPosition({
        x: Math.max(10, Math.min(newX, maxX)),
        y: Math.max(10, Math.min(newY, maxY)),
      });
    }

    // Handle Resizing
    if (isResizingRef.current) {
      const deltaX = clientX - resizeStartRef.current.startX;
      const deltaY = clientY - resizeStartRef.current.startY;

      const newWidth = Math.max(280, Math.min(850, resizeStartRef.current.startW + deltaX));
      const newHeight = Math.max(180, Math.min(550, resizeStartRef.current.startH + deltaY));

      setDimensions({
        width: newWidth,
        height: newHeight,
      });
    }
  }, [dimensions, isCollapsed]);

  const handleGlobalEnd = useCallback(() => {
    isDraggingRef.current = false;
    isResizingRef.current = false;
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleGlobalMove);
    window.addEventListener('mouseup', handleGlobalEnd);
    window.addEventListener('touchmove', handleGlobalMove);
    window.addEventListener('touchend', handleGlobalEnd);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalEnd);
      window.removeEventListener('touchmove', handleGlobalMove);
      window.removeEventListener('touchend', handleGlobalEnd);
    };
  }, [handleGlobalMove, handleGlobalEnd]);

  // Play / Pause toggle
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  };

  // Mute toggle
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Size Presets
  const setPresetSize = (w: number, h: number) => {
    setDimensions({ width: w, height: h });
    // Check bounds
    setPosition((prev) => ({
      x: Math.min(prev.x, window.innerWidth - w - 10),
      y: Math.min(prev.y, window.innerHeight - h - 10),
    }));
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: isCollapsed ? '320px' : `${dimensions.width}px`,
        height: isCollapsed ? 'auto' : `${dimensions.height}px`,
        zIndex: 9999,
      }}
      className="bg-slate-900 text-white rounded-2xl shadow-2xl border-2 border-amber-400 overflow-hidden flex flex-col select-none transition-shadow hover:shadow-amber-500/20"
    >
      {/* Draggable Header */}
      <div
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 px-3 py-2 flex items-center justify-between cursor-move shrink-0 border-b border-amber-500/50"
      >
        <div className="flex items-center gap-2 truncate">
          <Sparkles className="w-4 h-4 text-amber-200 shrink-0 animate-pulse" />
          <div className="truncate">
            <span className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
              <span>Kids Video Distraction</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-extrabold text-amber-100">
                Age {patientAge}
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 no-drag">
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-lg hover:bg-white/20 text-white/90 hover:text-white transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand video' : 'Minimize video'}
          >
            {isCollapsed ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-rose-600 text-white transition-colors cursor-pointer"
            title="Close video"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {!isCollapsed && (
        <div className="flex-1 flex flex-col relative bg-black min-h-0">
          {/* Video Player */}
          <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
            <video
              ref={videoRef}
              src={selectedChannel.url}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              className="w-full h-full object-cover"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />

            {/* Quick Play Overlay Button when paused */}
            {!isPlaying && (
              <div
                onClick={togglePlay}
                className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer transition-opacity"
              >
                <div className="p-3 rounded-full bg-amber-500/90 text-white shadow-lg hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 fill-current ml-0.5" />
                </div>
              </div>
            )}
          </div>

          {/* Player Toolbar & Channel Selector */}
          <div className="bg-slate-900/95 backdrop-blur-xs p-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-1.5 text-xs shrink-0 no-drag">
            {/* Playback Controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={togglePlay}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              </button>

              <button
                type="button"
                onClick={toggleMute}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isMuted ? 'bg-amber-900/50 text-amber-300 hover:bg-amber-900/70' : 'bg-slate-800 text-white hover:bg-slate-700'
                }`}
                title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              {/* Channel Selector */}
              <select
                value={selectedChannel.id}
                onChange={(e) => {
                  const found = CHANNELS.find((c) => c.id === e.target.value);
                  if (found) setSelectedChannel(found);
                }}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-[11px] font-medium rounded-lg px-2 py-1 outline-hidden hover:border-slate-600 cursor-pointer max-w-[150px] truncate"
              >
                {CHANNELS.map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Size Presets */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPresetSize(320, 210)}
                className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                title="Compact size (320x210)"
              >
                S
              </button>
              <button
                type="button"
                onClick={() => setPresetSize(440, 300)}
                className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                title="Medium size (440x300)"
              >
                M
              </button>
              <button
                type="button"
                onClick={() => setPresetSize(620, 390)}
                className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                title="Large size (620x390)"
              >
                L
              </button>
            </div>
          </div>

          {/* Resizable Corner Handle */}
          <div
            onMouseDown={handleResizeStart}
            onTouchStart={handleResizeStart}
            className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize flex items-end justify-end p-0.5 z-20 hover:scale-125 transition-transform"
            title="Drag corner to resize video"
          >
            <svg
              className="w-3.5 h-3.5 text-amber-400 opacity-80 hover:opacity-100"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="14" x2="14" y2="22"></line>
              <line x1="22" y1="8" x2="8" y2="22"></line>
            </svg>
          </div>
        </div>
      )}

      {/* Minimized Pill View */}
      {isCollapsed && (
        <div className="p-2.5 bg-slate-900 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Tv className="w-4 h-4 text-amber-400" />
            <span className="text-[11px] font-medium text-slate-300 truncate">
              {selectedChannel.title}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            className="text-[10px] font-bold text-amber-400 hover:text-amber-300 px-2 py-1 rounded bg-slate-800 cursor-pointer"
          >
            Show Video
          </button>
        </div>
      )}
    </div>
  );
};
