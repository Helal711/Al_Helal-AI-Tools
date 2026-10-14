import React, { useState } from 'react';
import { UploadCloud, X, AlertCircle, CheckCircle2, FileImage } from 'lucide-react';
import { storage } from '../../firebase/storage';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface UploadFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileUploaded: () => void;
}

export const UploadFileModal: React.FC<UploadFileModalProps> = ({
  isOpen,
  onClose,
  onFileUploaded,
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = async (file: File) => {
    const val = await storage.validateFile(file);
    if (!val.valid) {
      error(val.error || 'Invalid file');
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!user || !selectedFile) return;
    setIsUploading(true);
    try {
      await storage.uploadUserFile(user.uid, 'uploads', selectedFile.name, selectedFile);
      success(`File "${selectedFile.name}" uploaded to cloud storage!`);
      onFileUploaded();
      onClose();
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (e: any) {
      error(e.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <UploadCloud className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Upload to Studio Storage</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          {/* Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
              dragActive
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
                : 'border-slate-300 bg-slate-50/50 hover:border-indigo-400 dark:border-slate-700 dark:bg-slate-800/40'
            }`}
          >
            {previewUrl ? (
              <div className="space-y-3">
                <div className="relative mx-auto h-28 w-28 overflow-hidden rounded-xl bg-slate-950 shadow-sm">
                  <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100">{selectedFile?.name}</p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {selectedFile ? (selectedFile.size / 1024 / 1024).toFixed(2) : '0'} MB
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <UploadCloud className="mx-auto h-10 w-10 text-indigo-600 dark:text-indigo-400" />
                <p className="mt-2 font-bold text-slate-800 dark:text-slate-200">
                  Drag and drop your image here
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Supports PNG, JPG, WEBP up to 25 MB</p>

                <label className="mt-4 inline-block cursor-pointer rounded-xl bg-indigo-600 px-4 py-2 font-bold text-white shadow-xs hover:bg-indigo-700">
                  <span>Browse File</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileChange(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedFile || isUploading}
              onClick={handleUpload}
              className="rounded-xl bg-indigo-600 px-5 py-2 font-bold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
            >
              {isUploading ? 'Uploading...' : 'Upload Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
