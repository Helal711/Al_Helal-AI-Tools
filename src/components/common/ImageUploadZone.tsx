import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles, AlertCircle } from 'lucide-react';
import { SAMPLE_IMAGES } from '../../utils/sampleImages';

interface ImageUploadZoneProps {
  onImageSelected: (imageDataUrl: string, file?: File) => void;
  maxSizeBytes?: number;
  acceptedFormats?: string[];
  title?: string;
  subtitle?: string;
  showSamples?: boolean;
  className?: string;
}

export const ImageUploadZone: React.FC<ImageUploadZoneProps> = ({
  onImageSelected,
  maxSizeBytes = 25 * 1024 * 1024, // 25MB
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp'],
  title = 'Drag & drop an image or click to browse',
  subtitle = 'Supports JPG, PNG, WEBP up to 25MB. Instant high-resolution processing.',
  showSamples = true,
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setError(null);
    if (!acceptedFormats.includes(file.type)) {
      setError(`Unsupported file type (${file.type}). Please select a JPG, PNG, or WEBP image.`);
      return;
    }
    if (file.size > maxSizeBytes) {
      setError(`File size exceeds ${(maxSizeBytes / (1024 * 1024)).toFixed(0)}MB limit.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        onImageSelected(result, file);
      }
    };
    reader.onerror = () => setError('Failed to read the file. Please try another image.');
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Clipboard paste listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const loadSample = (type: keyof typeof SAMPLE_IMAGES) => {
    try {
      const dataUri = SAMPLE_IMAGES[type]();
      if (dataUri) {
        onImageSelected(dataUri);
      }
    } catch (err) {
      console.error('Failed to load sample image', err);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop Zone Box */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-indigo-600 bg-indigo-50/60 scale-[1.01]'
            : 'border-slate-200 bg-white hover:border-indigo-400 hover:bg-slate-50/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(',')}
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              processFile(e.target.files[0]);
            }
          }}
        />

        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 transition-transform group-hover:scale-110">
          <UploadCloud className="h-8 w-8" />
        </div>

        <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-xs text-slate-500 max-w-sm">{subtitle}</p>

        <div className="mt-5 flex items-center gap-2">
          <span className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors">
            Upload Image
          </span>
          <span className="text-xs text-slate-400">or press Ctrl+V to paste</span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Quick Test with Sample Images */}
      {showSamples && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs text-slate-600">
          <span className="flex items-center gap-1 font-medium text-slate-500">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" /> No photo? Try a sample:
          </span>
          <button
            type="button"
            onClick={() => loadSample('portrait')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:border-indigo-300 hover:text-indigo-600 transition-colors shadow-2xs"
          >
            <ImageIcon className="h-3 w-3" />
            <span>Portrait</span>
          </button>
          <button
            type="button"
            onClick={() => loadSample('product')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:border-indigo-300 hover:text-indigo-600 transition-colors shadow-2xs"
          >
            <ImageIcon className="h-3 w-3" />
            <span>E-Commerce Product</span>
          </button>
          <button
            type="button"
            onClick={() => loadSample('landscape')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:border-indigo-300 hover:text-indigo-600 transition-colors shadow-2xs"
          >
            <ImageIcon className="h-3 w-3" />
            <span>Landscape Object</span>
          </button>
          <button
            type="button"
            onClick={() => loadSample('vintage')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:border-indigo-300 hover:text-indigo-600 transition-colors shadow-2xs"
          >
            <ImageIcon className="h-3 w-3" />
            <span>Vintage Photo</span>
          </button>
        </div>
      )}
    </div>
  );
};
