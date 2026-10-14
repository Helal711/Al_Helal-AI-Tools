import React, { useState } from 'react';
import { Download, Archive, RefreshCw, FileCheck } from 'lucide-react';
import { ImageUploadZone } from '../common/ImageUploadZone';
import { convertAndCompress } from '../../services/imageProcessing';
import { useHistory } from '../../context/HistoryContext';

export const UtilityStudioTool: React.FC = () => {
  const { addHistoryItem, incrementDownloads } = useHistory();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState<number>(0);

  const [targetFormat, setTargetFormat] = useState<'image/webp' | 'image/jpeg' | 'image/png'>('image/webp');
  const [quality, setQuality] = useState<number>(80);
  const [maxWidth, setMaxWidth] = useState<number>(1920);

  const handleImageSelected = async (imageUri: string, file?: File) => {
    setOriginalImage(imageUri);
    const size = file?.size || Math.round((imageUri.length * 3) / 4);
    setOriginalSize(size);
    await processConversion(imageUri, targetFormat, quality / 100, maxWidth);
  };

  const processConversion = async (
    imgUri: string,
    fmt: 'image/webp' | 'image/jpeg' | 'image/png',
    q: number,
    maxW: number
  ) => {
    try {
      const res = await convertAndCompress(imgUri, {
        format: fmt,
        quality: q,
        maxWidth: maxW,
      });
      setResultImage(res.dataUrl);
      setResultSize(res.sizeBytes);

      addHistoryItem({
        url: res.dataUrl,
        originalUrl: imgUri,
        tool: 'Image Compressor & Converter',
      });
    } catch (err) {
      console.error(err);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const percentSaved =
    originalSize > 0 && resultSize > 0
      ? Math.max(0, Math.round(((originalSize - resultSize) / originalSize) * 100))
      : 0;

  const handleDownload = () => {
    if (!resultImage) return;
    const ext = targetFormat === 'image/webp' ? 'webp' : targetFormat === 'image/jpeg' ? 'jpg' : 'png';
    const a = document.createElement('a');
    a.href = resultImage;
    a.download = `pixelforge_optimized_${Date.now()}.${ext}`;
    a.click();
    incrementDownloads();
  };

  const handleReset = () => {
    setOriginalImage(null);
    setResultImage(null);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Image Compressor & Converter</h1>
          <p className="mt-1 text-xs text-slate-500">
            Compress files up to 85% and convert between WebP, PNG, and JPEG. Runs 100% locally in your browser for total privacy.
          </p>
        </div>
        {originalImage && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Process Another Image</span>
          </button>
        )}
      </div>

      {!originalImage ? (
        <ImageUploadZone onImageSelected={handleImageSelected} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Preview & Metrics (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Compression Metrics Stat Box */}
            <div className="grid grid-cols-3 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
              <div>
                <p className="text-[11px] font-medium text-slate-400">Original Size</p>
                <p className="text-base font-bold font-mono text-slate-900 mt-0.5">{formatBytes(originalSize)}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-400">Optimized Size</p>
                <p className="text-base font-bold font-mono text-indigo-600 mt-0.5">{formatBytes(resultSize)}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-400">Storage Saved</p>
                <p className="text-base font-bold font-mono text-emerald-600 mt-0.5">-{percentSaved}%</p>
              </div>
            </div>

            {/* Preview Box */}
            <div className="relative flex min-h-[360px] items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 p-4 shadow-sm">
              {resultImage && (
                <img
                  src={resultImage}
                  alt="Converted Result"
                  className="max-h-[460px] w-full object-contain"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
          </div>

          {/* Right: Format & Quality Controls (5 Cols) */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 space-y-5 shadow-xs">
            {/* Format Selection */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                <Archive className="h-4 w-4 text-indigo-600" />
                <span>Target Format</span>
              </label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[
                  { id: 'image/webp', label: 'WebP', desc: 'Best web size' },
                  { id: 'image/jpeg', label: 'JPEG', desc: 'Universal' },
                  { id: 'image/png', label: 'PNG', desc: 'Lossless' },
                ].map((fmt) => {
                  const isSelected = targetFormat === fmt.id;
                  return (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => {
                        setTargetFormat(fmt.id as any);
                        processConversion(originalImage, fmt.id as any, quality / 100, maxWidth);
                      }}
                      className={`rounded-xl border p-2 text-center text-xs transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/60 font-semibold text-indigo-700 ring-1 ring-indigo-600'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div>{fmt.label}</div>
                      <div className="text-[10px] text-slate-400">{fmt.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quality Slider (for lossy formats) */}
            {targetFormat !== 'image/png' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Compression Quality
                  </label>
                  <span className="font-mono text-xs text-indigo-600 font-semibold">{quality}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={quality}
                  onChange={(e) => {
                    const q = parseInt(e.target.value, 10);
                    setQuality(q);
                    processConversion(originalImage, targetFormat, q / 100, maxWidth);
                  }}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Smaller File (Low)</span>
                  <span>Balanced</span>
                  <span>Maximum Fidelity (HD)</span>
                </div>
              </div>
            )}

            {/* Max Width Scaling */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Max Width Constraint
                </label>
                <span className="font-mono text-xs text-slate-500">{maxWidth}px</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[1200, 1920, 2560].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => {
                      setMaxWidth(w);
                      processConversion(originalImage, targetFormat, quality / 100, w);
                    }}
                    className={`rounded-lg border py-1.5 text-xs font-medium transition-colors ${
                      maxWidth === w ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    {w}px
                  </button>
                ))}
              </div>
            </div>

            {/* Action */}
            <div className="border-t border-slate-100 pt-5 space-y-2">
              <button
                onClick={handleDownload}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Download Optimized File</span>
              </button>
              <button
                onClick={handleReset}
                className="w-full rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Process Another
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
