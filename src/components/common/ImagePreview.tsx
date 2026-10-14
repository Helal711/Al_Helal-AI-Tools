import React, { useState, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2, Move } from 'lucide-react';

interface ImagePreviewProps {
  src: string;
  alt?: string;
  isTransparent?: boolean;
  className?: string;
  aspectRatio?: string;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  src,
  alt = 'Image Preview',
  isTransparent = false,
  className = '',
  aspectRatio = 'auto',
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsPanning(true);
      setStartPos({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && zoom > 1) {
      setPan({ x: e.clientX - startPos.x, y: e.clientY - startPos.y });
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative select-none overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 dark:border-slate-800 ${className}`}
      style={{ aspectRatio }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Floating Toolbar */}
      <div className="absolute top-3 right-3 z-30 flex items-center gap-1 rounded-xl bg-slate-900/85 px-2 py-1.5 backdrop-blur-md text-white text-xs shadow-lg">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
          className="rounded p-1.5 hover:bg-white/20 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
          className="rounded p-1.5 hover:bg-white/20 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="rounded p-1.5 hover:bg-white/20 transition-colors"
          title="Reset Zoom & Pan"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
        <div className="h-3.5 w-px bg-white/20 mx-0.5" />
        <button
          type="button"
          onClick={toggleFullscreen}
          className="rounded p-1.5 hover:bg-white/20 transition-colors"
          title="Fullscreen"
        >
          {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </button>
      </div>

      {zoom > 1 && (
        <div className="absolute bottom-3 left-3 z-30 flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-[11px] text-white/80 pointer-events-none backdrop-blur-xs">
          <Move className="h-3 w-3" />
          <span>Click & Drag to Pan ({(zoom * 100).toFixed(0)}%)</span>
        </div>
      )}

      {/* Viewport Canvas Area */}
      <div
        className={`flex h-full w-full items-center justify-center p-4 ${
          isTransparent ? 'bg-transparency-grid dark:bg-transparency-grid-dark' : 'bg-slate-950'
        }`}
      >
        <img
          src={src}
          alt={alt}
          className="max-h-full max-w-full object-contain pointer-events-none transition-transform duration-75"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            cursor: zoom > 1 ? 'grab' : 'default',
          }}
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
};
