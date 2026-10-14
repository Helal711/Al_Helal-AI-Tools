import React, { useState, useEffect } from 'react';
import {
  Download,
  Sliders,
  RefreshCw,
  Zap,
  Palette,
  Sparkles,
  Sun,
  ShieldCheck,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { ImageUploadZone } from '../common/ImageUploadZone';
import { BeforeAfterSlider } from '../common/BeforeAfterSlider';
import { ProcessingStateIndicator } from '../common/ProcessingStateIndicator';
import { aiService } from '../../ai/AIService';
import { useAuth } from '../../context/AuthContext';
import { useHistory } from '../../context/HistoryContext';
import { usageService } from '../../services/usageService';
import {
  verifyImageDimensions,
  colorizeGrayscale,
  restoreOldPhoto,
  sharpenImageWithHighPass,
  denoiseImage,
  relightImageDirectional,
  artisticStylize,
} from '../../services/imageProcessing';
import { ProcessingState } from '../../types';

export interface PhotoEnhancerToolProps {
  mode?: string;
}

export const PhotoEnhancerTool: React.FC<PhotoEnhancerToolProps> = ({ mode = 'photo-enhancer' }) => {
  const { user } = useAuth();
  const { addHistoryItem, incrementDownloads } = useHistory();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);

  // General Upscale state
  const [scaleFactor, setScaleFactor] = useState<1 | 2 | 4>(2);
  const [sharpenAmount, setSharpenAmount] = useState<number>(55);
  const [contrastBoost, setContrastBoost] = useState<number>(18);
  const [faceEnhance, setFaceEnhance] = useState<boolean>(true);

  // Colorizer state
  const [colorSaturation, setColorSaturation] = useState<number>(65);
  const [colorWarmth, setColorWarmth] = useState<number>(18);
  const [tintPreset, setTintPreset] = useState<'vibrant' | 'vintage_sepia' | 'film_warm' | 'cyanotype'>('vibrant');

  // Restorer state
  const [autoContrast, setAutoContrast] = useState<boolean>(true);
  const [defading, setDefading] = useState<number>(50);
  const [deyellowing, setDeyellowing] = useState<boolean>(true);

  // Denoiser state
  const [denoiseStrength, setDenoiseStrength] = useState<number>(50);

  // Relighting state
  const [lightDirection, setLightDirection] = useState<'center' | 'top' | 'right' | 'bottom' | 'left'>('center');
  const [lightIntensity, setLightIntensity] = useState<number>(55);
  const [lightWarmth, setLightWarmth] = useState<number>(20);

  // Artistic state
  const [artStyle, setArtStyle] = useState<'sketch' | 'cartoon'>(
    mode === 'sketch-portrait' ? 'sketch' : 'cartoon'
  );

  const [processingState, setProcessingState] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
    message: '',
  });

  const [dimensions, setDimensions] = useState<{
    beforeWidth: number;
    beforeHeight: number;
    afterWidth: number;
    afterHeight: number;
  } | null>(null);

  // Determine tool flavor
  const isColorizer = mode === 'image-colorizer' || mode === 'photo-colorizer';
  const isRestorer = mode === 'image-restorer';
  const isSharpener = mode === 'image-sharpener';
  const isDenoiser = mode === 'image-denoiser';
  const isRelighting = mode === 'image-relighting';
  const isArtistic = mode === 'cartoon-portrait' || mode === 'sketch-portrait';
  const isUpscalerOnly = mode === 'upscaler' || mode === 'image-upscaler';

  let toolTitle = 'Photo Enhancer & Upscaler';
  let toolSubtitle = 'Recover lost detail, eliminate compression blur, and upscale to 2x or 4x resolution.';
  if (isColorizer) {
    toolTitle = 'AI Photo Colorizer & Chrominance Studio';
    toolSubtitle = 'Revitalize black & white archival photography and muted pictures with organic color synthesis and warm tones.';
  } else if (isRestorer) {
    toolTitle = 'AI Vintage Photo Restorer';
    toolSubtitle = 'Repair aged, scratched, and faded family photographs with automatic histogram equalization and de-yellowing.';
  } else if (isSharpener) {
    toolTitle = 'AI High-Frequency Image Sharpener';
    toolSubtitle = 'Eliminate optical softness and lens blur with high-pass unsharp convolution.';
  } else if (isDenoiser) {
    toolTitle = 'AI Image Denoiser & Grain Filter';
    toolSubtitle = 'Remove digital ISO noise and JPEG compression artifacts while retaining sharp structural edges.';
  } else if (isRelighting) {
    toolTitle = 'AI Photo Relighting & Studio Ambiance';
    toolSubtitle = 'Simulate dynamic studio spotlights, ambient golden hour illumination, and exposure fill.';
  } else if (isArtistic) {
    toolTitle = 'Artistic Portrait & Stylization Studio';
    toolSubtitle = 'Transform photographs into hand-drawn pencil sketches or vibrant pop-art cartoon portraits.';
  } else if (isUpscalerOnly) {
    toolTitle = 'AI Super-Resolution Image Upscaler';
    toolSubtitle = 'Reconstruct high-frequency pixel clarity and upscale images up to 4x resolution.';
  }

  const handleImageSelected = async (imageUri: string) => {
    setOriginalImage(imageUri);
    setResultImage(null);

    const img = new Image();
    img.onload = () => {
      const scaleMult = isUpscalerOnly || (!isColorizer && !isRestorer && !isSharpener && !isDenoiser && !isRelighting && !isArtistic)
        ? scaleFactor
        : 1;
      setDimensions({
        beforeWidth: img.naturalWidth,
        beforeHeight: img.naturalHeight,
        afterWidth: img.naturalWidth * scaleMult,
        afterHeight: img.naturalHeight * scaleMult,
      });
    };
    img.src = imageUri;

    await executeProcessing(imageUri);
  };

  const executeProcessing = async (imageSrc: string) => {
    try {
      const usageCheck = await usageService.checkUsage(user?.uid, toolTitle);
      if (!usageCheck.allowed) {
        setProcessingState({
          status: 'error',
          progress: 0,
          message: 'Daily Limit Reached',
          error: usageCheck.message || 'Your daily processing limit has been reached. Please try again later.',
        });
        return;
      }

      setProcessingState({
        status: 'preparing',
        progress: 20,
        message: 'Profiling pixel spectrum & image buffers...',
      });
      await new Promise((r) => setTimeout(r, 100));

      setProcessingState({
        status: 'processing',
        progress: 60,
        message: `Executing real ${toolTitle} pipeline...`,
      });

      let outputUri: string;

      if (isColorizer) {
        outputUri = await colorizeGrayscale(imageSrc, {
          saturation: colorSaturation,
          warmth: colorWarmth,
          tintPreset,
        });
      } else if (isRestorer) {
        outputUri = await restoreOldPhoto(imageSrc, {
          autoContrast,
          defading,
          deyellowing,
        });
      } else if (isSharpener) {
        outputUri = await sharpenImageWithHighPass(imageSrc, sharpenAmount);
      } else if (isDenoiser) {
        outputUri = await denoiseImage(imageSrc, denoiseStrength);
      } else if (isRelighting) {
        outputUri = await relightImageDirectional(imageSrc, {
          direction: lightDirection,
          intensity: lightIntensity,
          warmth: lightWarmth,
        });
      } else if (isArtistic) {
        outputUri = await artisticStylize(imageSrc, artStyle);
      } else {
        // Standard Enhancer & Upscaler
        const response = await aiService.upscaleImage({
          imageUri: imageSrc,
          scale: scaleFactor,
          sharpenAmount,
          contrastBoost,
          faceEnhance,
          userId: user?.uid,
        });

        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to enhance and upscale image.');
        }
        outputUri = response.data.imageUrl;
      }

      // Output verification
      const dimCheck = await verifyImageDimensions(outputUri);
      if (!dimCheck.isValid) {
        throw new Error('Processing verification failed: Output buffer is corrupted.');
      }

      setProcessingState({
        status: 'finalizing',
        progress: 95,
        message: 'Finalizing raster rendering...',
      });
      await new Promise((r) => setTimeout(r, 80));

      await usageService.recordOperation(user?.uid, toolTitle);

      setResultImage(outputUri);
      setProcessingState({
        status: 'completed',
        progress: 100,
        message: 'Processing complete!',
      });

      addHistoryItem({
        url: outputUri,
        processedImage: outputUri,
        originalUrl: imageSrc,
        tool: toolTitle,
      });
    } catch (err: any) {
      console.error(err);
      setProcessingState({
        status: 'error',
        progress: 0,
        message: 'Processing failed',
        error: err.message,
      });
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const a = document.createElement('a');
    a.href = resultImage;
    a.download = `pixelforge_${mode}_${Date.now()}.png`;
    a.click();
    incrementDownloads();
  };

  const handleReset = () => {
    setOriginalImage(null);
    setResultImage(null);
    setProcessingState({ status: 'idle', progress: 0, message: '' });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{toolTitle}</h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{toolSubtitle}</p>
        </div>
        {originalImage && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>New Photo</span>
          </button>
        )}
      </div>

      {!originalImage ? (
        <ImageUploadZone onImageSelected={handleImageSelected} />
      ) : (
        <div className="space-y-6">
          <ProcessingStateIndicator
            state={processingState}
            onRetry={() => executeProcessing(originalImage)}
          />

          {resultImage && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Draggable Comparison View */}
              <div className="lg:col-span-2 space-y-3">
                <BeforeAfterSlider
                  beforeImage={originalImage}
                  afterImage={resultImage}
                  beforeLabel="Original"
                  afterLabel="Processed Result"
                  aspectRatio="4/3"
                  onDownload={handleDownload}
                  className="w-full min-h-[400px]"
                />
                <p className="text-center text-[11px] text-slate-400">
                  Slide back and forth to inspect processing results and fine detail recovery
                </p>
              </div>

              {/* Tuning Panel */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-5 shadow-xs">
                {/* 1. COLORIZER TUNING */}
                {isColorizer && (
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        <Palette className="h-4 w-4 text-indigo-600" />
                        <span>Color Palette Preset</span>
                      </label>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {[
                          { id: 'vibrant', label: 'Vibrant Natural' },
                          { id: 'vintage_sepia', label: 'Vintage Sepia' },
                          { id: 'film_warm', label: 'Film Warm' },
                          { id: 'cyanotype', label: 'Prussian Blue' },
                        ].map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setTintPreset(p.id as any);
                              colorizeGrayscale(originalImage, {
                                saturation: colorSaturation,
                                warmth: colorWarmth,
                                tintPreset: p.id as any,
                              }).then(setResultImage);
                            }}
                            className={`rounded-xl border py-2 px-2 text-xs font-bold transition-all ${
                              tintPreset === p.id
                                ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 ring-1 ring-indigo-600'
                                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Saturation Strength</label>
                        <span className="font-mono text-xs text-slate-500">{colorSaturation}%</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="100"
                        value={colorSaturation}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          setColorSaturation(v);
                          colorizeGrayscale(originalImage, { saturation: v, warmth: colorWarmth, tintPreset }).then(setResultImage);
                        }}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Warmth & Skin Undertones</label>
                        <span className="font-mono text-xs text-slate-500">{colorWarmth > 0 ? `+${colorWarmth}` : colorWarmth}</span>
                      </div>
                      <input
                        type="range"
                        min="-30"
                        max="40"
                        value={colorWarmth}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          setColorWarmth(v);
                          colorizeGrayscale(originalImage, { saturation: colorSaturation, warmth: v, tintPreset }).then(setResultImage);
                        }}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {/* 2. RESTORER TUNING */}
                {isRestorer && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Histogram Auto-Contrast</span>
                      <input
                        type="checkbox"
                        checked={autoContrast}
                        onChange={(e) => {
                          setAutoContrast(e.target.checked);
                          restoreOldPhoto(originalImage, { autoContrast: e.target.checked, defading, deyellowing }).then(setResultImage);
                        }}
                        className="h-4 w-4 rounded-sm text-indigo-600 accent-indigo-600 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Defading & Recovery</label>
                        <span className="font-mono text-xs text-slate-500">{defading}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="90"
                        value={defading}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          setDefading(v);
                          restoreOldPhoto(originalImage, { autoContrast, defading: v, deyellowing }).then(setResultImage);
                        }}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Aged Paper De-Yellowing</span>
                      <input
                        type="checkbox"
                        checked={deyellowing}
                        onChange={(e) => {
                          setDeyellowing(e.target.checked);
                          restoreOldPhoto(originalImage, { autoContrast, defading, deyellowing: e.target.checked }).then(setResultImage);
                        }}
                        className="h-4 w-4 rounded-sm text-indigo-600 accent-indigo-600 cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {/* 3. SHARPENER TUNING */}
                {isSharpener && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-300">High-Pass Sharpening Amount</label>
                        <span className="font-mono text-xs text-slate-500">{sharpenAmount}%</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="100"
                        value={sharpenAmount}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          setSharpenAmount(v);
                          sharpenImageWithHighPass(originalImage, v).then(setResultImage);
                        }}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {/* 4. DENOISER TUNING */}
                {isDenoiser && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Denoising & Smoothing Intensity</label>
                        <span className="font-mono text-xs text-slate-500">{denoiseStrength}%</span>
                      </div>
                      <input
                        type="range"
                        min="15"
                        max="95"
                        value={denoiseStrength}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          setDenoiseStrength(v);
                          denoiseImage(originalImage, v).then(setResultImage);
                        }}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {/* 5. RELIGHTING TUNING */}
                {isRelighting && (
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        <Sun className="h-4 w-4 text-amber-500" />
                        <span>Light Source Direction</span>
                      </label>
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {(['center', 'top', 'right', 'bottom', 'left'] as const).map((dir) => (
                          <button
                            key={dir}
                            type="button"
                            onClick={() => {
                              setLightDirection(dir);
                              relightImageDirectional(originalImage, { direction: dir, intensity: lightIntensity, warmth: lightWarmth }).then(setResultImage);
                            }}
                            className={`rounded-xl border py-1.5 text-xs font-bold capitalize transition-all ${
                              lightDirection === dir
                                ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 ring-1 ring-amber-500'
                                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                            }`}
                          >
                            {dir}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Spotlight Intensity</label>
                        <span className="font-mono text-xs text-slate-500">{lightIntensity}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="90"
                        value={lightIntensity}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          setLightIntensity(v);
                          relightImageDirectional(originalImage, { direction: lightDirection, intensity: v, warmth: lightWarmth }).then(setResultImage);
                        }}
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Color Temperature</label>
                        <span className="font-mono text-xs text-slate-500">{lightWarmth > 0 ? `+${lightWarmth}K` : `${lightWarmth}K`}</span>
                      </div>
                      <input
                        type="range"
                        min="-40"
                        max="40"
                        value={lightWarmth}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          setLightWarmth(v);
                          relightImageDirectional(originalImage, { direction: lightDirection, intensity: lightIntensity, warmth: v }).then(setResultImage);
                        }}
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {/* 6. ARTISTIC TUNING */}
                {isArtistic && (
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        <Sparkles className="h-4 w-4 text-purple-600" />
                        <span>Artistic Style</span>
                      </label>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {[
                          { id: 'sketch', label: 'Pencil Sketch' },
                          { id: 'cartoon', label: 'Pop Art Cartoon' },
                        ].map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setArtStyle(s.id as any);
                              artisticStylize(originalImage, s.id as any).then(setResultImage);
                            }}
                            className={`rounded-xl border py-2 text-xs font-bold transition-all ${
                              artStyle === s.id
                                ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 ring-1 ring-purple-600'
                                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 7. STANDARD ENHANCER & UPSCALER TUNING */}
                {!isColorizer && !isRestorer && !isSharpener && !isDenoiser && !isRelighting && !isArtistic && (
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        <Zap className="h-4 w-4 text-indigo-600" />
                        <span>Upscale Factor</span>
                      </label>
                      <div className="mt-2.5 grid grid-cols-3 gap-2">
                        {([1, 2, 4] as const).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => {
                              setScaleFactor(s);
                              if (dimensions) {
                                setDimensions({
                                  ...dimensions,
                                  afterWidth: dimensions.beforeWidth * s,
                                  afterHeight: dimensions.beforeHeight * s,
                                });
                              }
                              aiService.upscaleImage({
                                imageUri: originalImage,
                                scale: s,
                                sharpenAmount,
                                contrastBoost,
                                faceEnhance,
                                userId: user?.uid,
                              }).then((r) => {
                                if (r.success && r.data) setResultImage(r.data.imageUrl);
                              });
                            }}
                            className={`rounded-xl border py-2 text-xs font-bold transition-all ${
                              scaleFactor === s
                                ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 ring-1 ring-indigo-600'
                                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                            }`}
                          >
                            {s === 1 ? 'Original 1x' : `${s}x HD`}
                          </button>
                        ))}
                      </div>

                      {dimensions && (
                        <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5 text-xs border border-slate-200 dark:border-slate-700">
                          <span className="text-slate-500">
                            Before: <strong className="text-slate-900 dark:text-white font-mono">{dimensions.beforeWidth} × {dimensions.beforeHeight}</strong>
                          </span>
                          <span className="text-indigo-600 font-bold">→</span>
                          <span className="text-slate-500">
                            After: <strong className="text-indigo-600 dark:text-indigo-400 font-mono">{dimensions.afterWidth} × {dimensions.afterHeight}</strong>
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          <Sliders className="h-4 w-4 text-indigo-600" />
                          <span>Sharpness Boost</span>
                        </label>
                        <span className="font-mono text-xs text-slate-500">{sharpenAmount}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="90"
                        value={sharpenAmount}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          setSharpenAmount(v);
                          aiService.upscaleImage({
                            imageUri: originalImage,
                            scale: scaleFactor,
                            sharpenAmount: v,
                            contrastBoost,
                            faceEnhance,
                            userId: user?.uid,
                          }).then((r) => {
                            if (r.success && r.data) setResultImage(r.data.imageUrl);
                          });
                        }}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Dynamic Range Recovery</label>
                        <span className="font-mono text-xs text-slate-500">{contrastBoost}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="40"
                        value={contrastBoost}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          setContrastBoost(v);
                          aiService.upscaleImage({
                            imageUri: originalImage,
                            scale: scaleFactor,
                            sharpenAmount,
                            contrastBoost: v,
                            faceEnhance,
                            userId: user?.uid,
                          }).then((r) => {
                            if (r.success && r.data) setResultImage(r.data.imageUrl);
                          });
                        }}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Facial Texture Recovery</span>
                      <input
                        type="checkbox"
                        checked={faceEnhance}
                        onChange={(e) => {
                          setFaceEnhance(e.target.checked);
                          aiService.upscaleImage({
                            imageUri: originalImage,
                            scale: scaleFactor,
                            sharpenAmount,
                            contrastBoost,
                            faceEnhance: e.target.checked,
                            userId: user?.uid,
                          }).then((r) => {
                            if (r.success && r.data) setResultImage(r.data.imageUrl);
                          });
                        }}
                        className="h-4 w-4 rounded-sm text-indigo-600 accent-indigo-600 cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2">
                  <button
                    onClick={handleDownload}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download High-Resolution Image</span>
                  </button>
                  <button
                    onClick={handleReset}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Process Another Photo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
