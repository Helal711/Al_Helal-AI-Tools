import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Download, Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
  aspectRatio?: string;
  isTransparentResult?: boolean;
  onDownload?: () => void;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeImage,
  afterImage,
  beforeLabel = 'Original',
  afterLabel = 'AI Result',
  className = '',
  aspectRatio = 'auto',
  isTransparentResult = false,
  onDownload,
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(position);
  }, []);

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleMouseDown = () => setIsDragging(true);

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) handleMove(e.clientX);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMove]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
      return;
    }
    const a = document.createElement('a');
    a.href = afterImage;
    a.download = `pixelforge_result_${Date.now()}.png`;
    a.click();
  };

  return (
    <div
      ref={containerRef}
      className={`relative select-none overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-md ${className}`}
      style={{ aspectRatio }}
    >
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-1.5 rounded-lg bg-slate-900/80 px-2 py-1.5 backdrop-blur-md text-white text-xs">
        <button
          onClick={() => setZoom((z) => Math.min(2.5, z + 0.25))}
          title="Zoom In"
          className="rounded p-1.5 hover:bg-white/20 transition-colors"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(1, z - 0.25))}
          title="Zoom Out"
          className="rounded p-1.5 hover:bg-white/20 transition-colors"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          onClick={() => setZoom(1)}
          title="Reset Zoom"
          className="rounded p-1.5 hover:bg-white/20 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
        <div className="h-3.5 w-px bg-white/20 mx-0.5" />
        <button
          onClick={toggleFullscreen}
          title="Toggle Fullscreen"
          className="rounded p-1.5 hover:bg-white/20 transition-colors"
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
        <button
          onClick={handleDownload}
          title="Download PNG"
          className="flex items-center gap-1 rounded bg-indigo-600 px-2 py-1 font-medium hover:bg-indigo-500 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Save</span>
        </button>
      </div>

      {/* Main Image Container */}
      <div
        className="relative h-full w-full overflow-hidden flex items-center justify-center"
        style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: isDragging ? 'none' : 'transform 0.15s ease' }}
      >
        {/* Layer 2: AFTER Image (AI Result - Full Canvas Background) */}
        <div className={`absolute inset-0 h-full w-full ${isTransparentResult ? 'bg-transparency-grid' : 'bg-slate-950'}`}>
          <img
            src={afterImage}
            alt="AI Result"
            className="h-full w-full object-contain pointer-events-none"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Layer 1: BEFORE Image (Clipped by slider position) */}
        <div
          className="absolute inset-y-0 left-0 overflow-hidden bg-slate-900 border-r border-white/60"
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            src={beforeImage}
            alt="Original input"
            className="absolute inset-0 h-full w-full max-w-none object-contain pointer-events-none"
            style={{ width: containerRef.current?.clientWidth || '100%' }}
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Draggable Divider Line & Handle */}
        <div
          className="absolute inset-y-0 z-20 flex items-center justify-center cursor-ew-resize"
          style={{ left: `calc(${sliderPosition}% - 18px)`, width: '36px' }}
          onMouseDown={handleMouseDown}
          onTouchMove={handleTouchMove}
        >
          <div className="h-full w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)]" />
          <div className="absolute flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-slate-900/90 text-white shadow-xl backdrop-blur">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 9l-4 3 4 3m8-6l4 3-4 3" />
            </svg>
          </div>
        </div>
      </div>

      {/* Subtle Bottom Badges */}
      <div className="absolute bottom-4 left-4 z-10 pointer-events-none rounded bg-black/60 px-2.5 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
        {beforeLabel}
      </div>
      <div className="absolute bottom-4 right-4 z-10 pointer-events-none rounded bg-black/60 px-2.5 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
        {afterLabel}
      </div>
    </div>
  );
};
