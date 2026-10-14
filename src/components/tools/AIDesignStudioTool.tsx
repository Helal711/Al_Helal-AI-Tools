import React, { useState } from 'react';
import { Download, LayoutTemplate, Sparkles, Type, RefreshCw, Palette } from 'lucide-react';
import { activeAIProvider } from '../../ai/provider';
import { ProcessingStateIndicator } from '../common/ProcessingStateIndicator';
import { useHistory } from '../../context/HistoryContext';
import { ProcessingState } from '../../types';

export interface AIDesignStudioToolProps {
  mode?: string;
}

export const AIDesignStudioTool: React.FC<AIDesignStudioToolProps> = ({ mode = 'ai-design-studio' }) => {
  const { addHistoryItem, incrementDownloads } = useHistory();
  const [headline, setHeadline] = useState(
    mode === 'thumbnail-generator' ? '10X CREATIVE WORKFLOWS' : 'SUMMER HORIZONS 2026'
  );
  const [subheading, setSubheading] = useState(
    mode === 'thumbnail-generator' ? 'Next-Gen AI Production Secrets' : 'Explore the unexplored with boundless imagination'
  );
  const [designPrompt, setDesignPrompt] = useState('Minimalist abstract sunrise geometric gradient, warm amber and cobalt blue, bauhaus composition');
  const [templateType, setTemplateType] = useState<'poster' | 'social' | 'banner' | 'wallpaper'>(
    mode === 'thumbnail-generator' || mode === 'ai-banner'
      ? 'banner'
      : mode === 'social-media-post'
      ? 'social'
      : 'poster'
  );
  const [textColor, setTextColor] = useState<'#ffffff' | '#0f172a' | '#f59e0b'>('#ffffff');
  const [compositeImage, setCompositeImage] = useState<string | null>(null);

  const [processingState, setProcessingState] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
    message: '',
  });

  const templates = [
    { id: 'poster', label: 'Art Poster', ratio: '3:4', aspectClass: 'aspect-3/4', w: 900, h: 1200 },
    { id: 'social', label: 'Instagram Square', ratio: '1:1', aspectClass: 'aspect-square', w: 1080, h: 1080 },
    { id: 'banner', label: 'YouTube / Web Banner', ratio: '16:9', aspectClass: 'aspect-16/9', w: 1280, h: 720 },
    { id: 'wallpaper', label: 'Mobile Wallpaper', ratio: '9:16', aspectClass: 'aspect-9/16', w: 1080, h: 1920 },
  ];

  const handleGenerateDesign = async () => {
    setProcessingState({
      status: 'preparing',
      progress: 20,
      message: 'Generating layout canvas and typographical geometry...',
    });

    try {
      setProcessingState({
        status: 'processing',
        progress: 55,
        message: 'Synthesizing background artwork with Gemini...',
      });

      const currentTmpl = templates.find((t) => t.id === templateType) || templates[0];
      const res = await activeAIProvider.generateImage({
        prompt: `${designPrompt}, graphic design backdrop, clean empty space for typography, high aesthetic, editorial quality`,
        aspectRatio: currentTmpl.ratio as any,
        style: 'Minimalist',
      });

      let bgUrl: string;
      if (res.success && res.data) {
        bgUrl = res.data.imageUrl;
      } else {
        // Fallback programmatic canvas backdrop if AI key is offline
        const fCanvas = document.createElement('canvas');
        fCanvas.width = currentTmpl.w;
        fCanvas.height = currentTmpl.h;
        const fCtx = fCanvas.getContext('2d');
        if (fCtx) {
          const grad = fCtx.createLinearGradient(0, 0, currentTmpl.w, currentTmpl.h);
          grad.addColorStop(0, '#1e1b4b');
          grad.addColorStop(0.5, '#4338ca');
          grad.addColorStop(1, '#f43f5e');
          fCtx.fillStyle = grad;
          fCtx.fillRect(0, 0, currentTmpl.w, currentTmpl.h);
        }
        bgUrl = fCanvas.toDataURL('image/png');
      }

      setProcessingState({
        status: 'finalizing',
        progress: 90,
        message: 'Compositing headline typography and layout layers...',
      });

      // Composite typography onto canvas
      const bgImg = new Image();
      bgImg.crossOrigin = 'anonymous';
      await new Promise((resolve) => {
        bgImg.onload = resolve;
        bgImg.src = bgUrl;
      });

      const canvas = document.createElement('canvas');
      canvas.width = currentTmpl.w;
      canvas.height = currentTmpl.h;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable');

      // Draw background
      ctx.drawImage(bgImg, 0, 0, currentTmpl.w, currentTmpl.h);

      // Subtle dark vignette gradient for text readability
      const scrim = ctx.createLinearGradient(0, 0, 0, currentTmpl.h);
      scrim.addColorStop(0, 'rgba(0,0,0,0.4)');
      scrim.addColorStop(0.4, 'rgba(0,0,0,0.1)');
      scrim.addColorStop(0.8, 'rgba(0,0,0,0.3)');
      scrim.addColorStop(1, 'rgba(0,0,0,0.7)');
      ctx.fillStyle = scrim;
      ctx.fillRect(0, 0, currentTmpl.w, currentTmpl.h);

      // Render typography
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';

      // Headline
      ctx.font = `bold ${Math.round(currentTmpl.w * 0.065)}px Syne, sans-serif`;
      ctx.fillText(headline, currentTmpl.w / 2, currentTmpl.h * 0.35);

      // Subheading
      ctx.font = `500 ${Math.round(currentTmpl.w * 0.028)}px 'Plus Jakarta Sans', sans-serif`;
      ctx.fillStyle = textColor === '#ffffff' ? 'rgba(255,255,255,0.85)' : 'rgba(15,23,42,0.85)';
      ctx.fillText(subheading, currentTmpl.w / 2, currentTmpl.h * 0.42);

      // Branding watermark
      ctx.font = `bold ${Math.round(currentTmpl.w * 0.02)}px 'Plus Jakarta Sans', sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText('PIXELFORGE AI STUDIO', currentTmpl.w / 2, currentTmpl.h * 0.94);

      const finalDataUrl = canvas.toDataURL('image/png');
      setCompositeImage(finalDataUrl);

      setProcessingState({
        status: 'completed',
        progress: 100,
        message: 'Poster & design template ready!',
      });

      addHistoryItem({
        url: finalDataUrl,
        tool: 'AI Design Studio',
        prompt: `${headline} - ${designPrompt}`,
      });
    } catch (err: any) {
      setProcessingState({
        status: 'error',
        progress: 0,
        message: 'Failed to generate design',
        error: err.message,
      });
    }
  };

  const handleDownload = () => {
    if (!compositeImage) return;
    const a = document.createElement('a');
    a.href = compositeImage;
    a.download = `pixelforge_design_${templateType}_${Date.now()}.png`;
    a.click();
    incrementDownloads();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">AI Design & Poster Studio</h1>
        <p className="mt-1 text-xs text-slate-500">
          Create striking promotional posters, social media banners, and wallpapers with custom typography.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column (5 Cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 space-y-5 shadow-xs">
          {/* Template Type */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
              <LayoutTemplate className="h-4 w-4 text-indigo-600" />
              <span>Design Format</span>
            </label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {templates.map((tmpl) => {
                const isSelected = templateType === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => setTemplateType(tmpl.id as any)}
                    className={`rounded-xl border p-2.5 text-left text-xs transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 font-semibold text-indigo-700 ring-1 ring-indigo-600'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div>{tmpl.label}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{tmpl.ratio}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Typography Inputs */}
          <div className="space-y-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                <Type className="h-4 w-4 text-indigo-600" />
                <span>Primary Headline</span>
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="SUMMER HORIZONS"
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Subheading / Tagline
              </label>
              <input
                type="text"
                value={subheading}
                onChange={(e) => setSubheading(e.target.value)}
                placeholder="A journey through sound and color..."
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Background Prompt */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
              <Palette className="h-4 w-4 text-indigo-600" />
              <span>Backdrop Aesthetic Prompt</span>
            </label>
            <textarea
              rows={3}
              value={designPrompt}
              onChange={(e) => setDesignPrompt(e.target.value)}
              placeholder="Describe background artwork (e.g. minimalist neon retro wave, cybernetic grid, deep purple)..."
              className="mt-1.5 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Text Color Picker */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Typography Color
            </label>
            <div className="mt-2 flex gap-3">
              {[
                { label: 'Clean White', value: '#ffffff' as const, bg: 'bg-white border-slate-300' },
                { label: 'Dark Navy', value: '#0f172a' as const, bg: 'bg-slate-900' },
                { label: 'Warm Amber', value: '#f59e0b' as const, bg: 'bg-amber-500' },
              ].map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setTextColor(c.value)}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    textColor === c.value ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-slate-200'
                  }`}
                >
                  <span className={`h-3 w-3 rounded-full border ${c.bg}`} />
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={handleGenerateDesign}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            <span>Generate Design Composite</span>
          </button>
        </div>

        {/* Display Column (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <ProcessingStateIndicator state={processingState} onRetry={handleGenerateDesign} />

          <div className="relative flex min-h-[440px] items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 p-6 shadow-sm">
            {compositeImage ? (
              <div className="relative max-h-[520px] overflow-hidden rounded-xl shadow-2xl border border-white/20">
                <img
                  src={compositeImage}
                  alt="Generated Design"
                  className="max-h-[500px] w-auto block object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400">
                <LayoutTemplate className="mx-auto h-10 w-10 text-indigo-400 opacity-60" />
                <p className="mt-3 text-sm font-semibold text-slate-300">Design Studio Canvas</p>
                <p className="mt-1 text-xs text-slate-400 max-w-xs">
                  Configure your headline and background style, then click &quot;Generate Design Composite&quot;.
                </p>
              </div>
            )}
          </div>

          {compositeImage && (
            <div className="flex justify-end gap-3">
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Download Print-Ready PNG</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
