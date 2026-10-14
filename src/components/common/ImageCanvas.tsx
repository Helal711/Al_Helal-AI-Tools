import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCw,
  RefreshCw,
  Move,
} from 'lucide-react';
import { IconButton } from '../ui/IconButton';

export interface ImageCanvasProps {
  imageSrc: string;
  isTransparent?: boolean;
  className?: string;
  alt?: string;
  overlay?: React.ReactNode;
}

export const ImageCanvas: React.FC<ImageCanvasProps> = ({
  imageSrc,
  isTransparent = false,
  className = '',
  alt = 'Canvas image',
  overlay,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    setScale((prev) => Math.min(5, Math.max(0.2, prev * zoomFactor)));
  };

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Touch handlers for mobile pan & pinch
  const touchStartDist = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDist.current = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    } else if (e.touches.length === 2 && touchStartDist.current) {
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = currentDist / touchStartDist.current;
      setScale((prev) => Math.min(5, Math.max(0.2, prev * ratio)));
      touchStartDist.current = currentDist;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchStartDist.current = null;
  };

  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
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
      className={`relative flex h-full min-h-[350px] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-900/5 select-none dark:border-slate-800 dark:bg-slate-950/60 ${className}`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {/* Background grid for transparent canvases */}
      <div
        className={`absolute inset-0 pointer-events-none ${
          isTransparent
            ? 'bg-transparency-grid dark:bg-transparency-grid-dark opacity-80'
            : 'bg-slate-100/50 dark:bg-slate-950/40'
        }`}
      />

      {/* Rendered image transformed by scale, position and rotation */}
      <div
        className="relative transition-transform duration-75 ease-out max-h-full max-w-full flex items-center justify-center p-4"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
          transformOrigin: 'center center',
        }}
      >
        <img
          src={imageSrc}
          alt={alt}
          draggable={false}
          className="max-h-[60vh] max-w-full rounded-lg object-contain shadow-md pointer-events-none"
        />
        {overlay && <div className="absolute inset-0 pointer-events-auto">{overlay}</div>}
      </div>

      {/* Bottom Floating Control Bar */}
      <div className="absolute bottom-3 z-20 flex items-center gap-1 rounded-2xl border border-slate-200/80 bg-white/90 p-1 backdrop-blur-md shadow-lg dark:border-slate-800 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200">
        <IconButton
          size="sm"
          ariaLabel="Zoom Out"
          onClick={(e) => {
            e.stopPropagation();
            setScale((prev) => Math.max(0.2, prev * 0.85));
          }}
          icon={<ZoomOut className="h-3.5 w-3.5" />}
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setScale(1);
            setPosition({ x: 0, y: 0 });
          }}
          className="px-2 py-1 text-[11px] font-mono font-semibold hover:text-indigo-600 transition-colors"
        >
          {Math.round(scale * 100)}%
        </button>
        <IconButton
          size="sm"
          ariaLabel="Zoom In"
          onClick={(e) => {
            e.stopPropagation();
            setScale((prev) => Math.min(5, prev * 1.15));
          }}
          icon={<ZoomIn className="h-3.5 w-3.5" />}
        />
        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />
        <IconButton
          size="sm"
          ariaLabel="Rotate 90 degrees"
          onClick={(e) => {
            e.stopPropagation();
            setRotation((prev) => (prev + 90) % 360);
          }}
          icon={<RotateCw className="h-3.5 w-3.5" />}
        />
        <IconButton
          size="sm"
          ariaLabel="Reset Canvas"
          onClick={(e) => {
            e.stopPropagation();
            resetView();
          }}
          icon={<RefreshCw className="h-3.5 w-3.5" />}
        />
        <IconButton
          size="sm"
          ariaLabel={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          onClick={(e) => {
            e.stopPropagation();
            toggleFullscreen();
          }}
          icon={isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        />
      </div>
    </div>
  );
};
