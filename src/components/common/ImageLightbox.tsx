import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Wand2,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Heart,
} from 'lucide-react';
import { IconButton } from '../ui/IconButton';

export interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  images: { url: string; title?: string }[];
  initialIndex?: number;
  onOpenInEditor?: (imageUrl: string) => void;
  onDownload?: (imageUrl: string) => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
  onOpenInEditor,
  onDownload,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setScale(1);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
        setScale(1);
      }
      if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
        setScale(1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, images.length, onClose]);

  if (!isOpen || images.length === 0) return null;

  const currentImg = images[currentIndex];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md select-none animate-in fade-in duration-150"
    >
      {/* Top action bar */}
      <div className="absolute top-4 inset-x-6 z-50 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <span className="font-display text-sm font-bold truncate max-w-xs">
            {currentImg?.title || `Image ${currentIndex + 1} of ${images.length}`}
          </span>
          <span className="text-xs text-slate-400">
            {currentIndex + 1} / {images.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenInEditor && (
            <button
              type="button"
              onClick={() => {
                onOpenInEditor(currentImg.url);
                onClose();
              }}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 shadow-sm transition-colors"
            >
              <Wand2 className="h-3.5 w-3.5" />
              <span>Open in Editor</span>
            </button>
          )}

          {onDownload && (
            <button
              type="button"
              onClick={() => onDownload(currentImg.url)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download</span>
            </button>
          )}

          <IconButton
            size="sm"
            ariaLabel="Close lightbox"
            onClick={onClose}
            className="text-white hover:bg-slate-800"
            icon={<X className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => {
              setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
              setScale(1);
            }}
            className="absolute left-4 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/80 text-white hover:bg-slate-800 border border-slate-700 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
              setScale(1);
            }}
            className="absolute right-4 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/80 text-white hover:bg-slate-800 border border-slate-700 transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Image Viewport */}
      <div className="relative flex max-h-[85vh] max-w-[90vw] items-center justify-center overflow-hidden p-4">
        <img
          src={currentImg?.url}
          alt={currentImg?.title || 'Preview'}
          style={{ transform: `scale(${scale})` }}
          className="max-h-[80vh] max-w-full rounded-xl object-contain transition-transform duration-100 shadow-2xl"
        />
      </div>

      {/* Bottom Zoom Control */}
      <div className="absolute bottom-4 z-40 flex items-center gap-2 rounded-xl bg-slate-900/80 px-3 py-1.5 border border-slate-800 text-white">
        <button
          type="button"
          onClick={() => setScale((prev) => Math.max(0.5, prev * 0.85))}
          className="p-1 text-slate-300 hover:text-white"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <span className="font-mono text-xs text-slate-300">{Math.round(scale * 100)}%</span>
        <button
          type="button"
          onClick={() => setScale((prev) => Math.min(3, prev * 1.15))}
          className="p-1 text-slate-300 hover:text-white"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setScale(1)}
          className="ml-2 rounded px-2 py-0.5 text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
        >
          Reset
        </button>
      </div>
    </div>
  );
};
