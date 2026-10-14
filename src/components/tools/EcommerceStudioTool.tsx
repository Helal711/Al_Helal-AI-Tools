import React, { useState } from 'react';
import { Download, ShoppingBag, Layers, RefreshCw, SunMedium, Sparkles } from 'lucide-react';
import { ImageUploadZone } from '../common/ImageUploadZone';
import { ProcessingStateIndicator } from '../common/ProcessingStateIndicator';
import { removeBackground, loadImage } from '../../services/imageProcessing';
import { useHistory } from '../../context/HistoryContext';
import { ProcessingState } from '../../types';

export interface EcommerceStudioToolProps {
  mode?: string;
}

export const EcommerceStudioTool: React.FC<EcommerceStudioToolProps> = ({ mode = 'ecommerce-studio' }) => {
  const { addHistoryItem, incrementDownloads } = useHistory();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [stagedResult, setStagedResult] = useState<string | null>(null);

  const [stagePreset, setStagePreset] = useState<'amazon_white' | 'travertine_stone' | 'dark_marble' | 'warm_wood'>(
    mode === 'marketplace-image-maker' ? 'amazon_white' : 'travertine_stone'
  );
  const [shadowStrength, setShadowStrength] = useState<number>(mode === 'product-shadow' ? 55 : 35);
  const [targetRatio, setTargetRatio] = useState<'1:1' | '4:3' | '9:16'>('1:1');

  const [processingState, setProcessingState] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
    message: '',
  });

  const stageOptions = [
    {
      id: 'travertine_stone',
      name: 'Travertine Stone Pedestal',
      desc: 'Beige natural stone with soft morning sunlight',
      badge: 'Luxury Cosmetics',
    },
    {
      id: 'amazon_white',
      name: 'Amazon Pure White (#FFFFFF)',
      desc: '100% compliant with marketplace catalog guidelines',
      badge: 'Catalog Standard',
    },
    {
      id: 'dark_marble',
      name: 'Luxury Dark Granite',
      desc: 'Charcoal marble with directional rim reflection',
      badge: 'Electronics & Watches',
    },
    {
      id: 'warm_wood',
      name: 'Warm Scandinavian Oak',
      desc: 'Natural wood tabletop with soft ambient shadows',
      badge: 'Home & Lifestyle',
    },
  ];

  const handleImageSelected = async (imageUri: string) => {
    setOriginalImage(imageUri);
    await processProductStaging(imageUri, stagePreset, shadowStrength, targetRatio);
  };

  const processProductStaging = async (
    imageSrc: string,
    preset: 'amazon_white' | 'travertine_stone' | 'dark_marble' | 'warm_wood',
    shadowVal: number,
    ratio: '1:1' | '4:3' | '9:16'
  ) => {
    try {
      setProcessingState({
        status: 'preparing',
        progress: 20,
        message: 'Isolating product contours from packaging...',
      });
      await new Promise((r) => setTimeout(r, 100));

      setProcessingState({
        status: 'processing',
        progress: 60,
        message: 'Synthesizing studio lighting and ground plane...',
      });

      // 1. Cutout product
      const cutoutUri = await removeBackground(imageSrc, { sensitivity: 38, bgColor: 'transparent' });
      const cutoutImg = await loadImage(cutoutUri);

      // 2. Set dimensions based on target ratio
      let w = 1200;
      let h = 1200;
      if (ratio === '4:3') {
        w = 1200;
        h = 900;
      } else if (ratio === '9:16') {
        w = 1080;
        h = 1920;
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable');

      // 3. Render Background Environment
      if (preset === 'amazon_white') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
      } else if (preset === 'travertine_stone') {
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, '#f8fafc');
        bgGrad.addColorStop(0.65, '#f1f5f9');
        bgGrad.addColorStop(1, '#e2e8f0');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Stone Pedestal
        const pedY = h * 0.72;
        ctx.fillStyle = '#fdf6ee';
        ctx.beginPath();
        ctx.ellipse(w / 2, pedY, w * 0.35, h * 0.09, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pedestal base
        ctx.fillStyle = '#e8dccb';
        ctx.fillRect(w * 0.15, pedY, w * 0.7, h * 0.15);
      } else if (preset === 'dark_marble') {
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, '#1e293b');
        bgGrad.addColorStop(1, '#090d16');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Dark pedestal
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.ellipse(w / 2, h * 0.74, w * 0.38, h * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (preset === 'warm_wood') {
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, '#fef3c7');
        bgGrad.addColorStop(1, '#d97706');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Table plane
        ctx.fillStyle = '#b45309';
        ctx.fillRect(0, h * 0.65, w, h * 0.35);
      }

      // 4. Compute product positioning
      const prodMaxH = h * 0.52;
      const scale = prodMaxH / cutoutImg.height;
      const prodW = cutoutImg.width * scale;
      const prodH = cutoutImg.height * scale;
      const prodX = (w - prodW) / 2;
      const prodY = (h * 0.68) - prodH;

      // 5. Contact Drop Shadow
      const shadowAlpha = (shadowStrength / 100) * 0.45;
      ctx.fillStyle = `rgba(15, 23, 42, ${shadowAlpha})`;
      ctx.beginPath();
      ctx.ellipse(w / 2, prodY + prodH, prodW * 0.45, prodH * 0.07, 0, 0, Math.PI * 2);
      ctx.fill();

      // Soft diffuse ambient shadow
      ctx.fillStyle = `rgba(15, 23, 42, ${shadowAlpha * 0.4})`;
      ctx.beginPath();
      ctx.ellipse(w / 2, prodY + prodH + 10, prodW * 0.65, prodH * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();

      // 6. Draw Product on top
      ctx.drawImage(cutoutImg, prodX, prodY, prodW, prodH);

      setProcessingState({
        status: 'finalizing',
        progress: 95,
        message: 'Rendering commercial catalog export...',
      });
      await new Promise((r) => setTimeout(r, 80));

      const finalUrl = canvas.toDataURL('image/png');
      setStagedResult(finalUrl);

      setProcessingState({
        status: 'completed',
        progress: 100,
        message: 'Product staging generated!',
      });

      addHistoryItem({
        url: finalUrl,
        originalUrl: imageSrc,
        tool: 'E-Commerce Product Studio',
      });
    } catch (err: any) {
      setProcessingState({
        status: 'error',
        progress: 0,
        message: 'Staging failed',
        error: err.message,
      });
    }
  };

  const handleDownload = () => {
    if (!stagedResult) return;
    const a = document.createElement('a');
    a.href = stagedResult;
    a.download = `pixelforge_ecommerce_${stagePreset}_${Date.now()}.png`;
    a.click();
    incrementDownloads();
  };

  const handleReset = () => {
    setOriginalImage(null);
    setStagedResult(null);
    setProcessingState({ status: 'idle', progress: 0, message: '' });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">E-Commerce Product Studio</h1>
          <p className="mt-1 text-xs text-slate-500">
            Stage catalog products on stone pedestals with realistic shadows. Compliant with Amazon and Shopify standards.
          </p>
        </div>
        {originalImage && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Upload New Item</span>
          </button>
        )}
      </div>

      {!originalImage ? (
        <ImageUploadZone onImageSelected={handleImageSelected} />
      ) : (
        <div className="space-y-6">
          <ProcessingStateIndicator
            state={processingState}
            onRetry={() => processProductStaging(originalImage, stagePreset, shadowStrength, targetRatio)}
          />

          {stagedResult && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Product Preview Stage (7 Cols) */}
              <div className="lg:col-span-7 space-y-3">
                <div className="relative flex min-h-[420px] items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 p-4 shadow-sm">
                  <img
                    src={stagedResult}
                    alt="Staged Product"
                    className="max-h-[500px] w-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                    Commercial Catalog Export Ready
                  </span>
                  <span>100% Free · No Credits</span>
                </div>
              </div>

              {/* Staging Customizer Controls (5 Cols) */}
              <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 space-y-5 shadow-xs">
                {/* Environment Presets */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                    <Layers className="h-4 w-4 text-indigo-600" />
                    <span>Studio Environment</span>
                  </label>
                  <div className="mt-2.5 space-y-2">
                    {stageOptions.map((stg) => {
                      const isSelected = stagePreset === stg.id;
                      return (
                        <button
                          key={stg.id}
                          type="button"
                          onClick={() => {
                            setStagePreset(stg.id as any);
                            processProductStaging(originalImage, stg.id as any, shadowStrength, targetRatio);
                          }}
                          className={`w-full rounded-xl border p-3 text-left transition-all ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900">{stg.name}</span>
                            <span className="text-[10px] text-indigo-600 font-semibold">{stg.badge}</span>
                          </div>
                          <p className="mt-0.5 text-[11px] text-slate-500">{stg.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Aspect Ratio Target */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Channel Aspect Ratio
                  </label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {[
                      { id: '1:1', label: '1:1 Square', note: 'Amazon & Feed' },
                      { id: '4:3', label: '4:3 Catalog', note: 'Shopify Hero' },
                      { id: '9:16', label: '9:16 Story', note: 'TikTok & Reels' },
                    ].map((ar) => (
                      <button
                        key={ar.id}
                        type="button"
                        onClick={() => {
                          setTargetRatio(ar.id as any);
                          processProductStaging(originalImage, stagePreset, shadowStrength, ar.id as any);
                        }}
                        className={`rounded-xl border p-2 text-center text-xs transition-all ${
                          targetRatio === ar.id
                            ? 'border-indigo-600 bg-indigo-50/60 font-semibold text-indigo-700'
                            : 'border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div>{ar.label}</div>
                        <div className="text-[10px] text-slate-400">{ar.note}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contact Shadow Intensity */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                      <SunMedium className="h-4 w-4 text-indigo-600" />
                      <span>Contact Shadow Depth</span>
                    </label>
                    <span className="font-mono text-xs text-slate-500">{shadowStrength}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={shadowStrength}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      setShadowStrength(v);
                      processProductStaging(originalImage, stagePreset, v, targetRatio);
                    }}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                {/* Action CTA */}
                <div className="border-t border-slate-100 pt-4 space-y-2">
                  <button
                    onClick={handleDownload}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Staged Product</span>
                  </button>
                  <button
                    onClick={handleReset}
                    className="w-full rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Stage Another Product
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
