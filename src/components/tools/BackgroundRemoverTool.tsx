import React, { useState, useEffect, useRef } from 'react';
import { Download, RefreshCw, Layers, Sliders, Check, Archive, Play, Trash2, Upload, FileImage } from 'lucide-react';
import { ImageUploadZone } from '../common/ImageUploadZone';
import { BeforeAfterSlider } from '../common/BeforeAfterSlider';
import { ProcessingStateIndicator } from '../common/ProcessingStateIndicator';
import { aiService } from '../../ai/AIService';
import { useAuth } from '../../context/AuthContext';
import { useHistory } from '../../context/HistoryContext';
import { usageService } from '../../services/usageService';
import { BatchProcessor, BatchItem } from '../../services/batchProcessor';
import { verifyAlphaTransparency, verifyImageDimensions, blurImageBackground } from '../../services/imageProcessing';
import { ProcessingState } from '../../types';

export interface BackgroundRemoverToolProps {
  mode?: string;
}

export const BackgroundRemoverTool: React.FC<BackgroundRemoverToolProps> = ({ mode = 'background-remover' }) => {
  const { user } = useAuth();
  const { addHistoryItem, incrementDownloads } = useHistory();

  // Mode: Single vs Batch
  const [activeMode, setActiveMode] = useState<'single' | 'batch'>('single');

  // Single Mode State
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [selectedBgColor, setSelectedBgColor] = useState<string>(
    mode === 'product-background' ? '#ffffff' : 'transparent'
  );
  const [customBgImage, setCustomBgImage] = useState<string | null>(null);
  const [sensitivity, setSensitivity] = useState<number>(mode === 'face-cutout' ? 44 : 38);
  const [feather, setFeather] = useState<number>(mode === 'face-cutout' ? 4 : 2);
  const [blurRadius, setBlurRadius] = useState<number>(24);

  const [processingState, setProcessingState] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
    message: '',
  });

  // Batch Mode State
  const batchProcessorRef = useRef<BatchProcessor>(new BatchProcessor());
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  useEffect(() => {
    const unsub = batchProcessorRef.current.subscribe((items) => {
      setBatchItems(items);
      setIsBatchProcessing(items.some((i) => i.status === 'processing'));
    });
    return unsub;
  }, []);

  const colorPresets = [
    { label: 'Transparent', value: 'transparent', previewClass: 'bg-transparency-grid' },
    { label: 'Studio White', value: '#ffffff', hex: '#ffffff' },
    { label: 'Off White', value: '#f8fafc', hex: '#f8fafc' },
    { label: 'Charcoal Black', value: '#0f172a', hex: '#0f172a' },
    { label: 'Sky Blue', value: '#e0f2fe', hex: '#e0f2fe' },
    { label: 'Mint Soft', value: '#ecfdf5', hex: '#ecfdf5' },
    { label: 'Crimson Studio', value: '#991b1b', hex: '#991b1b' },
    { label: 'Warm Peach', value: '#ffedd5', hex: '#ffedd5' },
  ];

  // -------------------------------------------------------------
  // Single Mode Handlers
  // -------------------------------------------------------------
  const handleImageSelected = async (imageUri: string) => {
    setOriginalImage(imageUri);
    setResultImage(null);
    await processImage(imageUri, selectedBgColor, customBgImage, sensitivity, feather);
  };

  const processImage = async (
    imageSrc: string,
    bgColor: string,
    bgImg: string | null,
    sens: number,
    feath: number
  ) => {
    try {
      const usageCheck = await usageService.checkUsage(user?.uid, 'Background Remover');
      if (!usageCheck.allowed) {
        setProcessingState({
          status: 'error',
          progress: 0,
          message: 'Daily Limit Reached',
          error: usageCheck.message || 'Your daily processing limit has been reached.',
        });
        return;
      }

      setProcessingState({ status: 'preparing', progress: 20, message: 'Analyzing foreground boundaries...' });
      await new Promise((r) => setTimeout(r, 100));

      setProcessingState({ status: 'processing', progress: 55, message: mode === 'background-blur' ? 'Generating optical depth-of-field blur...' : 'Isolating hair and fine edge contours...' });
      let processed: string;
      if (mode === 'background-blur') {
        processed = await blurImageBackground(imageSrc, blurRadius);
      } else {
        const result = await aiService.removeBackground({
          imageUri: imageSrc,
          sensitivity: sens,
          feather: feath,
          bgColor,
          customBgImage: bgImg || undefined,
          userId: user?.uid,
        });

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Background removal could not be completed.');
        }

        processed = result.data.imageUrl;
      }

      // Output verification (Section 6 & Section 3.8)
      const dimCheck = await verifyImageDimensions(processed);
      if (!dimCheck.isValid) {
        throw new Error('Output validation failed: Corrupted image buffer generated.');
      }

      if (bgColor === 'transparent' && !bgImg) {
        const alphaCheck = await verifyAlphaTransparency(processed);
        if (!alphaCheck.hasTransparency) {
          throw new Error('Alpha transparency verification failed: Zero transparent pixels detected.');
        }
      }

      setProcessingState({ status: 'finalizing', progress: 90, message: 'Synthesizing transparent alpha channel...' });
      await new Promise((r) => setTimeout(r, 100));

      await usageService.recordOperation(user?.uid, 'Background Remover');

      setResultImage(processed);
      setProcessingState({ status: 'completed', progress: 100, message: 'Background removed successfully!' });

      addHistoryItem({
        url: processed,
        processedImage: processed,
        originalUrl: imageSrc,
        tool: 'Background Remover',
      });
    } catch (err: any) {
      console.error(err);
      setProcessingState({
        status: 'error',
        progress: 0,
        message: 'Failed to process image cutout',
        error: err.message || 'Please verify image format.',
      });
    }
  };

  const handleBgColorChange = async (color: string) => {
    setSelectedBgColor(color);
    setCustomBgImage(null);
    if (originalImage) {
      await processImage(originalImage, color, null, sensitivity, feather);
    }
  };

  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !originalImage) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const bgUri = ev.target?.result as string;
      setCustomBgImage(bgUri);
      setSelectedBgColor('custom');
      await processImage(originalImage, 'custom', bgUri, sensitivity, feather);
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const a = document.createElement('a');
    a.href = resultImage;
    a.download = `pixelforge_cutout_${Date.now()}.png`;
    a.click();
    incrementDownloads();
  };

  const handleReset = () => {
    setOriginalImage(null);
    setResultImage(null);
    setCustomBgImage(null);
    setSelectedBgColor('transparent');
    setProcessingState({ status: 'idle', progress: 0, message: '' });
  };

  // -------------------------------------------------------------
  // Batch Mode Handlers
  // -------------------------------------------------------------
  const handleBatchFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      batchProcessorRef.current.addFiles(e.target.files);
    }
  };

  const handleStartBatchProcessing = async () => {
    await batchProcessorRef.current.startProcessing('background-remover');
  };

  const handleDownloadAllZip = async () => {
    await batchProcessorRef.current.downloadBulkZip('pixelforge-cutouts.zip');
    incrementDownloads();
  };

  const handleDownloadSingleBatchItem = (item: BatchItem) => {
    if (!item.resultUrl) return;
    const a = document.createElement('a');
    a.href = item.resultUrl;
    a.download = `${item.name.replace(/\.[^/.]+$/, '')}_cutout.png`;
    a.click();
    incrementDownloads();
  };

  const completedCount = batchItems.filter((i) => i.status === 'completed').length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Mode Switcher */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveMode('single')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
              activeMode === 'single'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            Single Image Mode
          </button>
          <button
            onClick={() => setActiveMode('batch')}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
              activeMode === 'batch'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            <Archive className="h-3.5 w-3.5" />
            <span>Batch Mode (Multi-Upload)</span>
            {batchItems.length > 0 && (
              <span className="ml-1 rounded-full bg-indigo-500/30 px-1.5 py-0.2 text-[10px] text-white">
                {batchItems.length}
              </span>
            )}
          </button>
        </div>

        {activeMode === 'single' && originalImage && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 shadow-2xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Process New Image</span>
          </button>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. SINGLE MODE WORKSPACE */}
      {/* ------------------------------------------------------------- */}
      {activeMode === 'single' && (
        <>
          {!originalImage ? (
            <ImageUploadZone onImageSelected={handleImageSelected} />
          ) : (
            <div className="space-y-6">
              <ProcessingStateIndicator state={processingState} onRetry={() => handleImageSelected(originalImage)} />

              {resultImage && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left / Center: Interactive Before/After Comparison */}
                  <div className="lg:col-span-2 space-y-3">
                    <BeforeAfterSlider
                      beforeImage={originalImage}
                      afterImage={resultImage}
                      beforeLabel="Original"
                      afterLabel="Cutout Result"
                      aspectRatio="4/3"
                      isTransparentResult={selectedBgColor === 'transparent'}
                      onDownload={handleDownload}
                      className="w-full min-h-[380px]"
                    />
                    <p className="text-center text-[11px] text-slate-400">
                      Drag the central handle to compare original versus transparent cutout
                    </p>
                  </div>

                  {/* Right: Studio Customization Panel */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    {/* Background Replacement */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                        <Layers className="h-4 w-4 text-indigo-600" />
                        <span>Background Replacement</span>
                      </label>
                      <p className="mt-0.5 text-[11px] text-slate-400">Pick solid color or transparent backdrop</p>

                      <div className="mt-3 grid grid-cols-4 gap-2">
                        {colorPresets.map((preset) => {
                          const isSelected = selectedBgColor === preset.value;
                          return (
                            <button
                              key={preset.value}
                              type="button"
                              onClick={() => handleBgColorChange(preset.value)}
                              className={`relative flex h-10 w-full items-center justify-center rounded-xl border transition-all ${
                                isSelected ? 'border-indigo-600 ring-2 ring-indigo-200 scale-105' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                              } ${preset.previewClass || ''}`}
                              style={{ backgroundColor: preset.hex }}
                              title={preset.label}
                            >
                              {isSelected && (
                                <Check className={`h-4 w-4 ${preset.value === '#ffffff' || preset.value === 'transparent' || preset.value === '#f8fafc' ? 'text-indigo-600' : 'text-white'}`} />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Custom Background Upload */}
                      <div className="mt-3">
                        <label className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-2.5 text-xs font-medium text-slate-600 hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleCustomBgUpload}
                          />
                          <span>+ Upload Custom Backdrop</span>
                        </label>
                      </div>
                    </div>

                    {/* Fine Adjustment Sliders */}
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-4">
                      {mode === 'background-blur' && (
                        <>
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                              <Sliders className="h-4 w-4 text-indigo-600" />
                              <span>DSLR Blur Strength</span>
                            </label>
                            <span className="font-mono text-xs text-slate-500">{blurRadius}px</span>
                          </div>
                          <input
                            type="range"
                            min="6"
                            max="50"
                            value={blurRadius}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              setBlurRadius(val);
                              blurImageBackground(originalImage, val).then(setResultImage);
                            }}
                            className="w-full accent-indigo-600 cursor-pointer"
                          />
                        </>
                      )}

                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                          <Sliders className="h-4 w-4 text-indigo-600" />
                          <span>Cutout Sensitivity</span>
                        </label>
                        <span className="font-mono text-xs text-slate-500">{sensitivity}</span>
                      </div>
                      <input
                        type="range"
                        min="15"
                        max="75"
                        value={sensitivity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setSensitivity(val);
                          processImage(originalImage, selectedBgColor, customBgImage, val, feather);
                        }}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />

                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Edge Feathering</label>
                        <span className="font-mono text-xs text-slate-500">{feather}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="6"
                        value={feather}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setFeather(val);
                          processImage(originalImage, selectedBgColor, customBgImage, sensitivity, val);
                        }}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-2">
                      <button
                        onClick={handleDownload}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download Cutout (PNG)</span>
                      </button>
                      <button
                        onClick={handleReset}
                        className="w-full rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                      >
                        Upload Another Photo
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. BATCH MODE WORKSPACE */}
      {/* ------------------------------------------------------------- */}
      {activeMode === 'batch' && (
        <div className="space-y-6">
          {/* Batch Dropzone */}
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 p-8 text-center transition-colors hover:border-indigo-400 dark:border-slate-700 dark:bg-slate-900/50">
            <Upload className="mx-auto h-10 w-10 text-indigo-600 dark:text-indigo-400 mb-3" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Drop multiple photos here for bulk background removal
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Select multiple PNG, JPG, or WebP files (up to 25MB each)
            </p>
            <label className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 cursor-pointer">
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleBatchFileSelect}
              />
              <span>Select Multiple Files</span>
            </label>
          </div>

          {/* Batch Queue Controls & Summary */}
          {batchItems.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Processing Queue ({batchItems.length} images)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {completedCount} completed, {batchItems.filter((i) => i.status === 'processing').length} in progress
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleStartBatchProcessing}
                    disabled={isBatchProcessing || batchItems.every((i) => i.status === 'completed')}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>Process All</span>
                  </button>
                  {completedCount > 0 && (
                    <button
                      onClick={handleDownloadAllZip}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
                    >
                      <Archive className="h-3.5 w-3.5" />
                      <span>Download All ZIP ({completedCount})</span>
                    </button>
                  )}
                  <button
                    onClick={() => batchProcessorRef.current.clearAll()}
                    disabled={isBatchProcessing}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                  >
                    Clear Queue
                  </button>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-2.5">File</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5">Progress</th>
                      <th className="px-4 py-2.5">Cutout Result</th>
                      <th className="px-4 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {batchItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                        <td className="px-4 py-3 flex items-center gap-2.5">
                          <img
                            src={item.dataUrl}
                            alt=""
                            className="h-9 w-9 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                          />
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white truncate max-w-[140px] sm:max-w-[200px]">
                              {item.name}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {(item.size / (1024 * 1024)).toFixed(2)} MB
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              item.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : item.status === 'processing'
                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 animate-pulse'
                                : item.status === 'failed'
                                ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {item.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="w-24 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-indigo-600 h-full transition-all duration-200"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {item.resultUrl ? (
                            <div className="h-9 w-9 rounded-lg bg-transparency-grid overflow-hidden border border-slate-200 dark:border-slate-700">
                              <img src={item.resultUrl} alt="Cutout" className="h-full w-full object-contain" />
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {item.status === 'completed' && (
                              <button
                                onClick={() => handleDownloadSingleBatchItem(item)}
                                className="rounded p-1 text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
                                title="Download cutout PNG"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => batchProcessorRef.current.removeItem(item.id)}
                              disabled={item.status === 'processing'}
                              className="rounded p-1 text-slate-400 hover:text-red-500 disabled:opacity-30"
                              title="Remove from queue"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
