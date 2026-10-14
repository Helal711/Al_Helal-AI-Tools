import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, X, AlertCircle, Sparkles } from 'lucide-react';
import { storage } from '../../firebase/storage';
import { SAMPLE_IMAGES } from '../../utils/sampleImages';

interface UploadDropzoneProps {
  onImageSelected: (dataUrl: string, fileInfo?: { name: string; size: number; dimensions?: { width: number; height: number } }) => void;
  onClear?: () => void;
  currentImage?: string | null;
  acceptedFormats?: string[];
  maxSizeBytes?: number;
  title?: string;
  subtitle?: string;
  showSamples?: boolean;
  className?: string;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  onImageSelected,
  onClear,
  currentImage,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp'],
  maxSizeBytes = 25 * 1024 * 1024,
  title = 'Drag & drop an image or click to browse',
  subtitle = 'Supports JPG, PNG, WEBP up to 25MB · Unlimited free processing',
  showSamples = true,
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileMeta, setFileMeta] = useState<{ name: string; size: number; dimensions?: { width: number; height: number } } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setError(null);

    // Validate using storage validator
    const validation = await storage.validateFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file format or size.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        const meta = {
          name: file.name,
          size: file.size,
          dimensions: validation.dimensions,
        };
        setFileMeta(meta);
        onImageSelected(result, meta);
      }
    };
    reader.onerror = () => setError('Unable to read the selected file.');
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
        if (items[i].type.startsWith('image/')) {
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

  const handleSample = (type: keyof typeof SAMPLE_IMAGES, label: string) => {
    try {
      const dataUri = SAMPLE_IMAGES[type]();
      if (dataUri) {
        const meta = {
          name: `${label.toLowerCase().replace(/\s+/g, '_')}_sample.png`,
          size: Math.round((dataUri.length * 3) / 4),
          dimensions: { width: 800, height: 600 },
        };
        setFileMeta(meta);
        onImageSelected(dataUri, meta);
      }
    } catch {
      setError('Failed to render sample image.');
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFileMeta(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onClear) onClear();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {currentImage && fileMeta ? (
        /* Populated Upload State with Details & Remove Button */
        <div className="relative flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-12 w-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700">
              <img src={currentImage} alt="Preview" className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 text-left">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{fileMeta.name}</p>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                <span>{formatBytes(fileMeta.size)}</span>
                {fileMeta.dimensions && (
                  <>
                    <span>·</span>
                    <span>{fileMeta.dimensions.width}×{fileMeta.dimensions.height}px</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 hover:text-red-600 dark:border-slate-700 dark:hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden transition-colors"
            title="Remove image"
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        /* Empty Dropzone Container with Accessible Keyboard Trigger */
        <div
          role="button"
          tabIndex={0}
          aria-label={title}
          onKeyDown={handleKeyDown}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-hidden ${
            isDragging
              ? 'border-indigo-600 bg-indigo-50/70 scale-[1.01] dark:bg-indigo-950/30 dark:border-indigo-500'
              : 'border-slate-200 bg-white hover:border-indigo-400 hover:bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500 dark:hover:bg-slate-850'
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

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 transition-transform group-hover:scale-110">
            <UploadCloud className="h-7 w-7" />
          </div>

          <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm">{subtitle}</p>

          <div className="mt-4 flex items-center gap-2">
            <span className="min-h-[44px] inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-2xs hover:bg-indigo-700 transition-colors">
              Browse Files
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">or paste Ctrl+V</span>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200 dark:bg-red-950/40 dark:border-red-900 dark:text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Instant 1-click test samples */}
      {showSamples && !currentImage && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1 font-semibold text-slate-500 dark:text-slate-400 text-[11px]">
            <Sparkles className="h-3 w-3 text-indigo-500" /> Need a photo? Try sample:
          </span>
          <button
            type="button"
            onClick={() => handleSample('portrait', 'Portrait')}
            className="min-h-[36px] flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-700 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden"
          >
            <ImageIcon className="h-3 w-3" />
            <span>Portrait</span>
          </button>
          <button
            type="button"
            onClick={() => handleSample('product', 'Product')}
            className="min-h-[36px] flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-700 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden"
          >
            <ImageIcon className="h-3 w-3" />
            <span>Product</span>
          </button>
          <button
            type="button"
            onClick={() => handleSample('landscape', 'Landscape')}
            className="min-h-[36px] flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-700 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden"
          >
            <ImageIcon className="h-3 w-3" />
            <span>Landscape</span>
          </button>
        </div>
      )}
    </div>
  );
};
