import React, { useState, useEffect } from 'react';
import {
  Download,
  Sliders,
  RefreshCw,
  Crop,
  Maximize2,
  Archive,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Info,
  Check,
  ArrowRight,
  FileImage,
  Layers,
  Sparkles,
} from 'lucide-react';
import { UploadDropzone } from '../common/UploadDropzone';
import { ToolWorkspace } from '../common/ToolWorkspace';
import { ImagePreview } from '../common/ImagePreview';
import {
  convertAndCompress,
  loadImage,
  getImageMetadata,
  verifyImageDimensions,
} from '../../services/imageProcessing';
import { useToast } from '../../context/ToastContext';
import { useHistory } from '../../context/HistoryContext';

export interface LocalImageToolsProps {
  mode: 'resize' | 'crop' | 'compress' | 'convert' | 'rotate' | 'flip' | 'info';
  onSwitchMode?: (newMode: 'resize' | 'crop' | 'compress' | 'convert' | 'rotate' | 'flip' | 'info') => void;
}

export const LocalImageTools: React.FC<LocalImageToolsProps> = ({ mode: initialMode, onSwitchMode }) => {
  const { success, error } = useToast();
  const { addHistoryItem, incrementDownloads } = useHistory();

  const [currentMode, setCurrentMode] = useState(initialMode);
  useEffect(() => {
    setCurrentMode(initialMode);
  }, [initialMode]);

  const [inputImage, setInputImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 1200, height: 800 });
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number }>({ width: 1200, height: 800 });

  // Resize settings (Section 5.A)
  const [targetWidth, setTargetWidth] = useState(1200);
  const [targetHeight, setTargetHeight] = useState(800);
  const [lockAspect, setLockAspect] = useState(true);
  const [resizeAlgorithm, setResizeAlgorithm] = useState<'bicubic' | 'pixelated'>('bicubic');

  // Compress & Convert settings (Section 5.C & 5.D)
  const [quality, setQuality] = useState(80);
  const [format, setFormat] = useState<'image/png' | 'image/jpeg' | 'image/webp'>('image/webp');
  const [originalSize, setOriginalSize] = useState(0);
  const [resultSize, setResultSize] = useState(0);

  // Crop settings (Section 5.B)
  const [cropRatio, setCropRatio] = useState<'1:1' | '16:9' | '4:3' | '3:2' | '9:16' | 'free'>('free');

  // Rotate & Flip settings (Section 5.E)
  const [rotationAngle, setRotationAngle] = useState<90 | 180 | 270>(90);
  const [flipDirection, setFlipDirection] = useState<'horizontal' | 'vertical'>('horizontal');

  // Image Info metadata state (Section 5.F)
  const [imageMeta, setImageMeta] = useState<any | null>(null);

  const handleImageSelected = async (dataUrl: string, meta?: any) => {
    setInputImage(dataUrl);
    setResultImage(null);
    if (meta?.dimensions) {
      setDimensions(meta.dimensions);
      setOriginalDimensions(meta.dimensions);
      setTargetWidth(meta.dimensions.width);
      setTargetHeight(meta.dimensions.height);
    }
    if (meta?.size) {
      setOriginalSize(meta.size);
    }

    try {
      const extracted = await getImageMetadata(dataUrl);
      setImageMeta(extracted);
      setDimensions({ width: extracted.width, height: extracted.height });
      setOriginalDimensions({ width: extracted.width, height: extracted.height });
      setTargetWidth(extracted.width);
      setTargetHeight(extracted.height);
      setOriginalSize(extracted.fileSizeBytes);
    } catch {
      // Fallback
    }
  };

  const handleWidthChange = (val: number) => {
    setTargetWidth(val);
    if (lockAspect && originalDimensions.width > 0) {
      const ratio = originalDimensions.height / originalDimensions.width;
      setTargetHeight(Math.round(val * ratio));
    }
  };

  const handleHeightChange = (val: number) => {
    setTargetHeight(val);
    if (lockAspect && originalDimensions.height > 0) {
      const ratio = originalDimensions.width / originalDimensions.height;
      setTargetWidth(Math.round(val * ratio));
    }
  };

  const applyPresetDimensions = (w: number, h: number) => {
    setTargetWidth(w);
    setTargetHeight(h);
  };

  // Main processing router
  const handleProcess = async () => {
    if (!inputImage) return;

    try {
      let outputUrl = '';

      if (currentMode === 'resize') {
        const img = await loadImage(inputImage);
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas unavailable');

        ctx.imageSmoothingEnabled = resizeAlgorithm === 'bicubic';
        if (resizeAlgorithm === 'bicubic') {
          ctx.imageSmoothingQuality = 'high';
        }
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        outputUrl = canvas.toDataURL(format);
        setResultImage(outputUrl);
        success(`Image resized to ${targetWidth}×${targetHeight}px (${resizeAlgorithm})`);
      } else if (currentMode === 'crop') {
        const img = await loadImage(inputImage);
        const canvas = document.createElement('canvas');
        let cw = img.naturalWidth;
        let ch = img.naturalHeight;

        if (cropRatio === '1:1') {
          const side = Math.min(cw, ch);
          cw = side;
          ch = side;
        } else if (cropRatio === '16:9') {
          ch = Math.round((cw * 9) / 16);
          if (ch > img.naturalHeight) {
            ch = img.naturalHeight;
            cw = Math.round((ch * 16) / 9);
          }
        } else if (cropRatio === '4:3') {
          ch = Math.round((cw * 3) / 4);
          if (ch > img.naturalHeight) {
            ch = img.naturalHeight;
            cw = Math.round((ch * 4) / 3);
          }
        } else if (cropRatio === '3:2') {
          ch = Math.round((cw * 2) / 3);
          if (ch > img.naturalHeight) {
            ch = img.naturalHeight;
            cw = Math.round((ch * 3) / 2);
          }
        } else if (cropRatio === '9:16') {
          cw = Math.round((ch * 9) / 16);
          if (cw > img.naturalWidth) {
            cw = img.naturalWidth;
            ch = Math.round((cw * 16) / 9);
          }
        }

        canvas.width = cw;
        canvas.height = ch;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas unavailable');

        const sx = Math.max(0, (img.naturalWidth - cw) / 2);
        const sy = Math.max(0, (img.naturalHeight - ch) / 2);
        ctx.drawImage(img, sx, sy, cw, ch, 0, 0, cw, ch);
        outputUrl = canvas.toDataURL(format);
        setResultImage(outputUrl);
        success(`Image cropped to ${cw}×${ch}px (${cropRatio})`);
      } else if (currentMode === 'compress' || currentMode === 'convert') {
        const res = await convertAndCompress(inputImage, {
          format,
          quality: quality / 100,
        });
        outputUrl = res.dataUrl;
        setResultImage(outputUrl);
        setResultSize(res.sizeBytes);
        const savedPercent =
          originalSize > 0
            ? Math.max(0, Math.round(((originalSize - res.sizeBytes) / originalSize) * 100))
            : 0;
        success(`Processed! New size: ${(res.sizeBytes / 1024).toFixed(1)} KB (${savedPercent}% saved)`);
      } else if (currentMode === 'rotate') {
        const img = await loadImage(inputImage);
        const canvas = document.createElement('canvas');
        const isOrthogonal = rotationAngle === 90 || rotationAngle === 270;
        canvas.width = isOrthogonal ? img.naturalHeight : img.naturalWidth;
        canvas.height = isOrthogonal ? img.naturalWidth : img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas unavailable');

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotationAngle * Math.PI) / 180);
        ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

        outputUrl = canvas.toDataURL(format);
        setResultImage(outputUrl);
        success(`Rotated by ${rotationAngle}° clockwise.`);
      } else if (currentMode === 'flip') {
        const img = await loadImage(inputImage);
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas unavailable');

        if (flipDirection === 'horizontal') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        } else {
          ctx.translate(0, canvas.height);
          ctx.scale(1, -1);
        }
        ctx.drawImage(img, 0, 0);

        outputUrl = canvas.toDataURL(format);
        setResultImage(outputUrl);
        success(`Flipped ${flipDirection}ly.`);
      }

      if (outputUrl) {
        // Validate output dimensions
        const verified = await verifyImageDimensions(outputUrl);
        if (verified.isValid) {
          addHistoryItem({
            url: outputUrl,
            processedImage: outputUrl,
            originalUrl: inputImage,
            tool: `Image ${currentMode.toUpperCase()}`,
          });
        }
      }
    } catch (e: any) {
      error(e.message || 'Operation failed');
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const ext = format === 'image/webp' ? 'webp' : format === 'image/jpeg' ? 'jpg' : 'png';
    const a = document.createElement('a');
    a.href = resultImage;
    a.download = `pixelforge_${currentMode}_${Date.now()}.${ext}`;
    a.click();
    incrementDownloads();
  };

  const titles: Record<string, string> = {
    resize: 'Image Resizer',
    crop: 'Image Cropper',
    compress: 'Image Compressor',
    convert: 'Image Format Converter',
    rotate: 'Image Rotator',
    flip: 'Image Mirror & Flip',
    info: 'Image Inspector & Metadata',
  };

  const descriptions: Record<string, string> = {
    resize: 'Scale pixel dimensions with aspect ratio lock and bicubic/nearest-neighbor modes. Zero privacy risk.',
    crop: 'Crop images to 1:1 Square, 16:9 Landscape, 4:3 Standard, or 9:16 Portrait with precision centering.',
    compress: 'Reduce image file size with adjustable compression quality slider and exact percentage savings.',
    convert: 'Convert seamlessly between PNG, JPEG, and modern WebP with transparency preservation.',
    rotate: 'Rotate images by 90°, 180°, or 270° with lossless canvas redrawing.',
    flip: 'Mirror your photo horizontally or flip vertically with instantaneous matrix transforms.',
    info: 'Detailed metadata inspection: exact pixel dimensions, aspect ratio, megapixels, buffer memory, and format.',
  };

  return (
    <ToolWorkspace
      title={titles[currentMode]}
      description={descriptions[currentMode]}
      helpTips={[
        'All transformations execute 100% locally in your browser with zero server uploads or latency.',
        'Zero daily usage limits apply to local image utilities.',
        'Converting to WebP achieves up to 80% compression with negligible visual quality loss.',
      ]}
      uploadContent={
        <UploadDropzone
          onImageSelected={handleImageSelected}
          currentImage={inputImage}
          onClear={() => {
            setInputImage(null);
            setResultImage(null);
            setImageMeta(null);
          }}
        />
      }
      previewContent={
        <div className="space-y-4">
          <ImagePreview
            src={resultImage || inputImage || ''}
            alt="Preview"
            className="w-full min-h-[380px]"
          />
          {resultSize > 0 && originalSize > 0 && (
            <div className="flex items-center justify-between rounded-xl bg-indigo-50 p-3 text-xs text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200">
              <span>Original: {(originalSize / 1024).toFixed(1)} KB</span>
              <span className="font-bold">Optimized: {(resultSize / 1024).toFixed(1)} KB</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                Saved {Math.max(0, Math.round(((originalSize - resultSize) / originalSize) * 100))}%
              </span>
            </div>
          )}
        </div>
      }
      settingsContent={
        <div className="space-y-4 text-xs">
          {/* Section 5.A: Resize */}
          {currentMode === 'resize' && (
            <>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Target Width (px)
                </label>
                <input
                  type="number"
                  value={targetWidth}
                  onChange={(e) => handleWidthChange(parseInt(e.target.value, 10) || 0)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Target Height (px)
                </label>
                <input
                  type="number"
                  value={targetHeight}
                  onChange={(e) => handleHeightChange(parseInt(e.target.value, 10) || 0)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900 font-mono"
                />
              </div>

              {/* Popular Dimension Presets */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Presets</label>
                <div className="grid grid-cols-2 gap-1.5 mt-1">
                  <button
                    type="button"
                    onClick={() => applyPresetDimensions(1920, 1080)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    1080p Full HD (1920×1080)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetDimensions(3840, 2160)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    4K UHD (3840×2160)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetDimensions(1080, 1080)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Square 1:1 (1080×1080)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetDimensions(1080, 1920)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Story 9:16 (1080×1920)
                  </button>
                </div>
              </div>

              {/* Resizing Mode */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Resizing Algorithm</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setResizeAlgorithm('bicubic')}
                    className={`p-2 rounded-xl border text-[11px] font-medium ${
                      resizeAlgorithm === 'bicubic'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    Smooth (Bicubic)
                  </button>
                  <button
                    type="button"
                    onClick={() => setResizeAlgorithm('pixelated')}
                    className={`p-2 rounded-xl border text-[11px] font-medium ${
                      resizeAlgorithm === 'pixelated'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    Nearest Neighbor (Pixel Art)
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={lockAspect}
                  onChange={(e) => setLockAspect(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span className="text-slate-600 dark:text-slate-400">
                  Lock Aspect Ratio ({dimensions.width}×{dimensions.height})
                </span>
              </label>
            </>
          )}

          {/* Section 5.B: Crop */}
          {currentMode === 'crop' && (
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Aspect Ratio
              </label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(['1:1', '16:9', '4:3', '3:2', '9:16', 'free'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setCropRatio(r)}
                    className={`rounded-xl border p-2.5 font-medium transition-all ${
                      cropRatio === r
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {r.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section 5.E: Rotate */}
          {currentMode === 'rotate' && (
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Rotation Angle
              </label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {([90, 180, 270] as const).map((deg) => (
                  <button
                    key={deg}
                    type="button"
                    onClick={() => setRotationAngle(deg)}
                    className={`rounded-xl border p-2.5 font-medium transition-all ${
                      rotationAngle === deg
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {deg}° CW
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section 5.E: Flip */}
          {currentMode === 'flip' && (
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Flip Axis
              </label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(['horizontal', 'vertical'] as const).map((axis) => (
                  <button
                    key={axis}
                    type="button"
                    onClick={() => setFlipDirection(axis)}
                    className={`rounded-xl border p-2.5 font-medium capitalize transition-all ${
                      flipDirection === axis
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {axis}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section 5.C & 5.D: Compress & Convert */}
          {(currentMode === 'compress' || currentMode === 'convert') && (
            <>
              <div>
                <div className="flex justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Quality Level
                  </label>
                  <span className="font-semibold text-indigo-600">{quality}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(parseInt(e.target.value, 10))}
                  className="mt-2 w-full accent-indigo-600"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Target Format
                </label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {(['image/webp', 'image/jpeg', 'image/png'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setFormat(fmt)}
                      className={`rounded-xl border p-2 font-medium uppercase transition-all ${
                        format === fmt
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {fmt.split('/')[1]}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Section 5.F: Image Information */}
          {currentMode === 'info' && imageMeta && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Extracted Metadata (Non-Sensitive)
                </span>
                <div className="space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Dimensions:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {imageMeta.width} × {imageMeta.height} px
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Aspect Ratio:</span>
                    <span className="font-bold">{imageMeta.aspectRatio}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Resolution:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {imageMeta.megapixels} MP
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Format / MIME:</span>
                    <span className="font-bold">{imageMeta.mimeType}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>File Size:</span>
                    <span className="font-bold">{(imageMeta.fileSizeBytes / 1024).toFixed(1)} KB</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Alpha Transparency:</span>
                    <span className={imageMeta.hasAlphaChannel ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                      {imageMeta.hasAlphaChannel ? 'Detected (Transparent PNG/WebP)' : 'Opaque (No Alpha)'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Raw Buffer Size:</span>
                    <span>{(imageMeta.estimatedRawBytes / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>
                </div>
              </div>

              {/* Quick Launch Buttons */}
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Quick Actions with this Image
                </span>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentMode('resize')}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold"
                  >
                    <span>Open in Image Resizer</span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentMode('compress')}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold"
                  >
                    <span>Open in Image Compressor</span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentMode('convert')}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold"
                  >
                    <span>Open in Format Converter</span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          {currentMode !== 'info' && (
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleProcess}
                disabled={!inputImage}
                className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white shadow-md transition-all hover:bg-indigo-500 disabled:opacity-50"
              >
                Apply {titles[currentMode]}
              </button>

              {resultImage && (
                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 font-semibold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Result
                </button>
              )}
            </div>
          )}
        </div>
      }
    />
  );
};
