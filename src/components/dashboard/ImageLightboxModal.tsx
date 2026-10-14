import React from 'react';
import { X, Download, Copy, ExternalLink, Sparkles } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface ImageLightboxModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  title?: string;
  onClose: () => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  isOpen,
  imageUrl,
  title,
  onClose,
}) => {
  const { success } = useToast();

  if (!isOpen || !imageUrl) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(imageUrl);
    success('Image URL copied to clipboard');
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `pixelforge_${Date.now()}.png`;
    a.click();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-in fade-in duration-150"
    >
      {/* Close button top right */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Main Container */}
      <div className="relative flex max-h-[90vh] max-w-[90vw] flex-col items-center justify-center">
        <div className="relative max-h-[80vh] overflow-hidden rounded-2xl bg-slate-950 shadow-2xl flex items-center justify-center p-2">
          <img
            src={imageUrl}
            alt={title || 'Visual Asset'}
            className="max-h-[75vh] max-w-[85vw] object-contain rounded-xl"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Bottom Toolbar */}
        <div className="mt-4 flex items-center gap-3 rounded-full bg-white/10 px-5 py-2 text-white backdrop-blur-md shadow-lg">
          {title && <span className="text-xs font-semibold max-w-xs truncate">{title}</span>}

          <div className="h-4 w-px bg-white/20" />

          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 text-xs font-semibold hover:text-indigo-400 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs font-semibold hover:text-indigo-400 transition-colors"
          >
            <Copy className="h-4 w-4" />
            <span>Copy Link</span>
          </button>
        </div>
      </div>
    </div>
  );
};
