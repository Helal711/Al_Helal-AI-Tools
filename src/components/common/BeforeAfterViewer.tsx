import React, { useState, useRef, useEffect } from 'react';
import {
  SlidersHorizontal,
  Columns,
  Eye,
  Maximize2,
  Minimize2,
  Download,
} from 'lucide-react';
import { IconButton } from '../ui/IconButton';

export type ComparisonMode = 'slider' | 'side-by-side' | 'toggle';

export interface BeforeAfterViewerProps {
  originalSrc: string;
  processedSrc: string;
  originalLabel?: string;
  processedLabel?: string;
  defaultMode?: ComparisonMode;
  onDownload?: () => void;
  className?: string;
}

export const BeforeAfterViewer: React.FC<BeforeAfterViewerProps> = ({
  originalSrc,
  processedSrc,
  originalLabel = 'Original',
  processedLabel = 'Enhanced',
  defaultMode = 'slider',
  onDownload,
  className = '',
}) => {
  const [mode, setMode] = useState<ComparisonMode>(defaultMode);
  const [sliderPosition, setSliderPosition] = useState(50); // percentage 0-100
  const [toggleState, setToggleState] = useState<'original' | 'processed'>('processed');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    updateSlider(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    updateSlider(e.clientX);
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  const updateSlider = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.round((x / rect.width) * 100);
    setSliderPosition(percent);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-950 select-none shadow-md ${className}`}
      onPointerMove={mode === 'slider' ? handlePointerMove : undefined}
      onPointerUp={mode === 'slider' ? handlePointerUp : undefined}
      onPointerLeave={mode === 'slider' ? handlePointerUp : undefined}
    >
      {/* 1. Comparison Mode Switcher in top corner */}
      <div className="absolute top-3 right-3 z-30 flex items-center gap-1 rounded-xl bg-slate-900/80 p-1 backdrop-blur-md border border-slate-800 text-white shadow-lg">
        <button
          type="button"
          onClick={() => setMode('slider')}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
            mode === 'slider' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <SlidersHorizontal className="h-3 w-3" />
          <span className="hidden sm:inline">Slider</span>
        </button>
        <button
          type="button"
          onClick={() => setMode('side-by-side')}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
            mode === 'side-by-side' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Columns className="h-3 w-3" />
          <span className="hidden sm:inline">Side-by-Side</span>
        </button>
        <button
          type="button"
          onClick={() => setMode('toggle')}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
            mode === 'toggle' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Eye className="h-3 w-3" />
          <span className="hidden sm:inline">Toggle</span>
        </button>
        <div className="h-3.5 w-px bg-slate-700 mx-0.5" />
        <IconButton
          size="sm"
          ariaLabel={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          onClick={toggleFullscreen}
          icon={isFullscreen ? <Minimize2 className="h-3 w-3 text-slate-300" /> : <Maximize2 className="h-3 w-3 text-slate-300" />}
        />
      </div>

      {/* 2. Mode: SLIDER */}
      {mode === 'slider' && (
        <div
          className="relative w-full h-[55vh] min-h-[380px] overflow-hidden flex items-center justify-center cursor-ew-resize"
          onPointerDown={handlePointerDown}
        >
          {/* Base: Processed Image */}
          <img
            src={processedSrc}
            alt={processedLabel}
            draggable={false}
            className="absolute inset-0 h-full w-full object-contain pointer-events-none"
          />

          {/* Clipped overlay: Original Image */}
          <div
            className="absolute inset-0 h-full overflow-hidden pointer-events-none"
            style={{ width: `${sliderPosition}%` }}
          >
            <img
              src={originalSrc}
              alt={originalLabel}
              draggable={false}
              className="absolute inset-0 h-full w-full object-contain pointer-events-none max-w-none"
              style={{ width: containerRef.current?.clientWidth || '100%' }}
            />
          </div>

          {/* Draggable Divider Line */}
          <div
            className="absolute top-0 bottom-0 z-20 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)]"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-xl text-slate-800 border-2 border-indigo-600">
              <SlidersHorizontal className="h-4 w-4" />
            </div>
          </div>

          {/* Corner Badges */}
          <span className="absolute bottom-3 left-3 z-10 rounded-md bg-slate-900/80 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-xs">
            {originalLabel}
          </span>
          <span className="absolute bottom-3 right-3 z-10 rounded-md bg-indigo-900/80 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-xs">
            {processedLabel}
          </span>
        </div>
      )}

      {/* 3. Mode: SIDE-BY-SIDE */}
      {mode === 'side-by-side' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full h-[55vh] min-h-[380px] p-2 bg-slate-950">
          <div className="relative flex items-center justify-center rounded-xl bg-slate-900/80 overflow-hidden">
            <img
              src={originalSrc}
              alt={originalLabel}
              className="max-h-full max-w-full object-contain"
            />
            <span className="absolute bottom-2 left-2 rounded-md bg-slate-950/80 px-2 py-0.5 text-[10px] font-semibold text-white">
              {originalLabel}
            </span>
          </div>
          <div className="relative flex items-center justify-center rounded-xl bg-slate-900/80 overflow-hidden">
            <img
              src={processedSrc}
              alt={processedLabel}
              className="max-h-full max-w-full object-contain"
            />
            <span className="absolute bottom-2 left-2 rounded-md bg-indigo-950/80 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">
              {processedLabel}
            </span>
          </div>
        </div>
      )}

      {/* 4. Mode: TOGGLE */}
      {mode === 'toggle' && (
        <div className="relative w-full h-[55vh] min-h-[380px] flex items-center justify-center bg-slate-950">
          <img
            src={toggleState === 'original' ? originalSrc : processedSrc}
            alt={toggleState}
            className="max-h-full max-w-full object-contain"
          />
          <div className="absolute bottom-3 z-20 flex items-center gap-2 rounded-xl bg-slate-900/90 p-1.5 border border-slate-800 text-white">
            <button
              type="button"
              onClick={() => setToggleState('original')}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                toggleState === 'original' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Show {originalLabel}
            </button>
            <button
              type="button"
              onClick={() => setToggleState('processed')}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                toggleState === 'processed' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Show {processedLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
