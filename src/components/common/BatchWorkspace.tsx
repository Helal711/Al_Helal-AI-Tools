import React, { useState } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  Clock,
  AlertCircle,
  RotateCcw,
  Download,
  Trash2,
  XCircle,
  FileArchive,
  Loader2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useToast } from '../../context/ToastContext';

export interface BatchItem {
  id: string;
  file: File;
  name: string;
  size: number;
  dataUrl: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  resultUrl?: string;
  error?: string;
}

export interface BatchWorkspaceProps {
  toolName: string;
  processSingleItem: (item: BatchItem) => Promise<string>;
  onClose?: () => void;
}

export const BatchWorkspace: React.FC<BatchWorkspaceProps> = ({
  toolName,
  processSingleItem,
  onClose,
}) => {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const { success, error: toastError } = useToast();

  const handleFilesAdded = (files: FileList | null) => {
    if (!files) return;
    const newItems: BatchItem[] = [];

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          setItems((prev) => [
            ...prev,
            {
              id: `batch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              file,
              name: file.name,
              size: file.size,
              dataUrl,
              status: 'queued',
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const processAll = async () => {
    setIsProcessingAll(true);
    const toProcess = items.filter((i) => i.status === 'queued' || i.status === 'failed');

    for (const item of toProcess) {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: 'processing' } : i))
      );

      try {
        const resultUrl = await processSingleItem(item);
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: 'completed', resultUrl } : i
          )
        );
      } catch (err: any) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, status: 'failed', error: err.message || 'Processing failed' }
              : i
            )
        );
      }
    }
    setIsProcessingAll(false);
    success('Batch operation finished.');
  };

  const downloadItem = (item: BatchItem) => {
    if (!item.resultUrl) return;
    const link = document.createElement('a');
    link.href = item.resultUrl;
    link.download = `processed_${item.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllCompleted = () => {
    const completed = items.filter((i) => i.status === 'completed' && i.resultUrl);
    if (completed.length === 0) return;

    completed.forEach((item, index) => {
      setTimeout(() => {
        downloadItem(item);
      }, index * 250);
    });
    success(`Triggered download for ${completed.length} images.`);
  };

  const completedCount = items.filter((i) => i.status === 'completed').length;
  const failedCount = items.filter((i) => i.status === 'failed').length;

  return (
    <div className="space-y-6">
      {/* Upload area */}
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900/60">
        <UploadCloud className="h-10 w-10 text-indigo-600 dark:text-indigo-400 mb-2" />
        <h4 className="font-display text-sm font-bold text-slate-800 dark:text-slate-200">
          Upload Multiple Images for Batch {toolName}
        </h4>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Select multiple JPG, PNG, or WebP files simultaneously.
        </p>
        <label className="mt-4 cursor-pointer">
          <input
            type="file"
            multiple
            accept="image/png, image/jpeg, image/webp"
            className="hidden"
            onChange={(e) => handleFilesAdded(e.target.files)}
          />
          <span className="inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 shadow-2xs">
            Choose Files
          </span>
        </label>
      </div>

      {/* Batch list & Controls */}
      {items.length > 0 && (
        <Card padding="md" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
            <div>
              <span className="font-display text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Batch Queue ({items.length} files)
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {completedCount} completed · {failedCount} failed
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="primary"
                onClick={processAll}
                isLoading={isProcessingAll}
                disabled={items.every((i) => i.status === 'completed')}
              >
                Process All ({items.filter((i) => i.status !== 'completed').length})
              </Button>
              {completedCount > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={downloadAllCompleted}
                  leftIcon={<Download className="h-3.5 w-3.5" />}
                >
                  Download All ({completedCount})
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setItems([])}
                disabled={isProcessingAll}
                leftIcon={<Trash2 className="h-3.5 w-3.5 text-rose-500" />}
              >
                Clear
              </Button>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[450px] overflow-y-auto">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-2.5 px-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={item.resultUrl || item.dataUrl}
                    alt={item.name}
                    className="h-10 w-10 rounded-lg object-cover border border-slate-200 dark:border-slate-800"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {(item.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {item.status === 'queued' && (
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Queued</span>
                    </span>
                  )}
                  {item.status === 'processing' && (
                    <span className="flex items-center gap-1 text-[11px] text-indigo-600 font-semibold">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Processing...</span>
                    </span>
                  )}
                  {item.status === 'completed' && (
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Done</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => downloadItem(item)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                        title="Download image"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  {item.status === 'failed' && (
                    <span className="flex items-center gap-1 text-[11px] text-rose-500">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>Failed</span>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setItems((prev) => prev.filter((i) => i.id !== item.id))}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
