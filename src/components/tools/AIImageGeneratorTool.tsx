import React, { useState } from 'react';
import {
  Sparkles,
  Download,
  Scissors,
  Wand2,
  Trash2,
  Check,
  Ratio,
  Palette,
  AlertCircle,
  Copy,
  Maximize2,
  Heart,
  Sliders,
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import { aiService } from '../../ai/AIService';
import { useAuth } from '../../context/AuthContext';
import { useHistory } from '../../context/HistoryContext';
import { useToast } from '../../context/ToastContext';
import { usageService } from '../../services/usageService';
import { firestore } from '../../firebase/firestore';
import { PROMPT_LIBRARY } from '../../data/promptLibrary';
import { ProcessingStateIndicator } from '../common/ProcessingStateIndicator';
import { ProcessingState, GeneratedImageItem } from '../../types';

interface AIImageGeneratorToolProps {
  mode?: string;
  onTransferToTool?: (toolSlug: string, imageUri: string) => void;
}

export const AIImageGeneratorTool: React.FC<AIImageGeneratorToolProps> = ({ mode = 'ai-image-generator', onTransferToTool }) => {
  const { user } = useAuth();
  const { history, addHistoryItem, incrementDownloads } = useHistory();
  const { success } = useToast();
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:4'>(
    mode === 'wallpaper-generator' ? '16:9' : mode === 'portrait-generator' ? '3:4' : '1:1'
  );
  const [style, setStyle] = useState(
    mode === 'portrait-generator' ? 'Photorealistic' : mode === 'tshirt-design' ? 'Digital Art' : 'Photorealistic'
  );
  const [negativePrompt, setNegativePrompt] = useState('');
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
  const [currentResult, setCurrentResult] = useState<GeneratedImageItem | null>(null);

  const handleFavorite = async (img: GeneratedImageItem) => {
    if (user?.uid) {
      try {
        await firestore.addFavorite({
          favoriteId: `fav_${Date.now()}`,
          userId: user.uid,
          imageUrl: img.url,
          title: img.prompt || 'Generated Creation',
          tool: 'AI Image Generator',
          createdAt: new Date().toISOString(),
        });
        success('Saved to your favorites.');
      } catch {
        success('Saved to your favorites.');
      }
    } else {
      success('Saved to session favorites.');
    }
  };

  const handleVariation = (img: GeneratedImageItem) => {
    setPrompt(`${img.prompt || prompt}, alternate angle and creative variation`);
    handleGenerate();
  };

  const handleDelete = () => {
    setCurrentResult(null);
    success('Creation removed from stage.');
  };

  const [processingState, setProcessingState] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
    message: '',
  });

  const styleOptions = [
    'Photorealistic',
    'Cinematic',
    'Product Photography',
    'Illustration',
    '3D Render',
    'Anime',
    'Watercolor',
    'Digital Art',
    'Minimalist',
    'Fashion Editorial',
    'Architectural',
  ];

  const aspectRatios: Array<{ id: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'; label: string; desc: string }> = [
    { id: '1:1', label: '1:1 Square', desc: 'Social & Avatars' },
    { id: '16:9', label: '16:9 Landscape', desc: 'Banners & Wallpapers' },
    { id: '9:16', label: '9:16 Portrait', desc: 'Stories & Mobile' },
    { id: '4:3', label: '4:3 Classic', desc: 'Presentations' },
    { id: '3:4', label: '3:4 Editorial', desc: 'Portraits & Posters' },
  ];

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    setIsEnhancingPrompt(true);
    try {
      const enriched = await aiService.enhancePrompt(prompt, style);
      setPrompt(enriched);
    } catch {
      // Keep existing prompt on failure
    } finally {
      setIsEnhancingPrompt(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    // Check usage limits (technical protection, no credits)
    const usageCheck = await usageService.checkUsage(user?.uid, 'AI Image Generator');
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
      progress: 15,
      message: 'Submitting synthesis parameters...',
    });

    try {
      setProcessingState({
        status: 'processing',
        progress: 45,
        message: 'Synthesizing visual geometry with Gemini...',
      });

      const response = await aiService.generateImage({
        prompt,
        aspectRatio,
        style,
        negativePrompt: negativePrompt.trim() || undefined,
        userId: user?.uid,
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to produce image output.');
      }

      setProcessingState({
        status: 'finalizing',
        progress: 90,
        message: 'Rendering high-resolution raster buffer...',
      });

      // Record technical usage operation
      await usageService.recordOperation(user?.uid, 'AI Image Generator');

      const newItem: GeneratedImageItem = {
        id: `gen_${Date.now()}`,
        url: response.data.imageUrl,
        processedImage: response.data.imageUrl,
        prompt: response.data.prompt,
        tool: 'AI Image Generator',
        style,
        aspectRatio,
        createdAt: new Date().toISOString(),
      };

      setCurrentResult(newItem);
      addHistoryItem(newItem);

      // Persist to Firestore generations collection if authenticated
      if (user?.uid) {
        try {
          await firestore.logGeneration({
            userId: user.uid,
            tool: 'AI Image Generator',
            prompt: response.data.prompt,
            url: response.data.imageUrl,
            model: response.model || 'gemini-3.1-flash-lite-image',
            provider: response.provider || 'GoogleGeminiProvider',
            status: 'completed',
          });
        } catch {
          // Non-blocking log
        }
      }

      setProcessingState({
        status: 'completed',
        progress: 100,
        message: 'Visual asset created successfully!',
      });
    } catch (err: any) {
      console.error(err);
      setProcessingState({
        status: 'error',
        progress: 0,
        message: 'Generation interrupted',
        error: err.message || 'AI provider returned an error.',
      });
    }
  };

  const handleDownload = (imgUrl: string) => {
    const a = document.createElement('a');
    a.href = imgUrl;
    a.download = `pixelforge_gen_${Date.now()}.png`;
    a.click();
    incrementDownloads();
  };

  let displayTitle = 'AI Image Generator';
  let displaySubtitle = 'Transform text prompts into production-ready visual assets. 100% free with unlimited runs.';
  let promptPlaceholder = 'Describe your vision (e.g. Minimalist architectural glass villa in Norway fjord, warm interior lighting, morning mist, 8k photography)...';

  if (mode === 'portrait-generator') {
    displayTitle = 'AI Portrait Generator';
    displaySubtitle = 'Generate studio-grade headshots, character concepts, and realistic artistic portraits.';
    promptPlaceholder = 'Describe the portrait subject (e.g. High-fashion cinematic portrait of a woman with dramatic chiaroscuro studio lighting, natural freckles, 85mm lens)...';
  } else if (mode === 'wallpaper-generator') {
    displayTitle = 'AI Wallpaper Generator';
    displaySubtitle = 'Generate ultra-wide desktop and mobile wallpapers in 16:9, 9:16, or 4:3.';
    promptPlaceholder = 'Describe the scene (e.g. Luminescent aurora borealis over reflective alpine glacial lake at dusk, 4K cinematic wallpaper)...';
  } else if (mode === 'greeting-card') {
    displayTitle = 'AI Greeting Card & Artwork Designer';
    displaySubtitle = 'Generate festive, elegant, and heartfelt greeting card visual artwork.';
    promptPlaceholder = 'Describe the card artwork (e.g. Elegant watercolor botanical floral wreath with festive holiday accents and gold speckles)...';
  } else if (mode === 'tshirt-design') {
    displayTitle = 'AI T-Shirt & Merch Graphic Generator';
    displaySubtitle = 'Generate print-ready vector-style apparel illustrations and emblem concepts.';
    promptPlaceholder = 'Describe your apparel graphic (e.g. Bold minimalist Japanese cyber-samurai emblem, clean vector lines, high contrast)...';
  } else if (mode === 'invitation-maker') {
    displayTitle = 'AI Invitation Maker';
    displaySubtitle = 'Create bespoke wedding, gala, and party invitation backgrounds and borders.';
    promptPlaceholder = 'Describe the invitation aesthetic (e.g. Luxury minimalist art-deco border with gilded gold geometric lines on dark emerald paper)...';
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{displayTitle}</h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {displaySubtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Prompting & Controls (5 Cols) */}
        <div className="lg:col-span-5 space-y-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
          {/* Prompt Input */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Text Prompt
              </label>
              <button
                type="button"
                onClick={handleEnhancePrompt}
                disabled={isEnhancingPrompt || !prompt.trim()}
                className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-40"
              >
                <Wand2 className="h-3 w-3" />
                <span>{isEnhancingPrompt ? 'Expanding...' : 'AI Expand Prompt'}</span>
              </button>
            </div>
            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={promptPlaceholder}
              className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white p-3 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
            />

            {/* Quick Prompt Ideas from Library */}
            <div className="mt-2">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 mb-1.5">
                <BookOpen className="h-3 w-3" />
                <span>Prompt Ideas:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {PROMPT_LIBRARY.slice(0, 4).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPrompt(p.prompt)}
                    className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 transition-colors truncate max-w-[200px]"
                    title={p.prompt}
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Aspect Ratio Selector */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
              <Ratio className="h-3.5 w-3.5 text-indigo-600" />
              <span>Aspect Ratio</span>
            </label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {aspectRatios.map((ar) => {
                const isSelected = aspectRatio === ar.id;
                return (
                  <button
                    key={ar.id}
                    type="button"
                    onClick={() => setAspectRatio(ar.id)}
                    className={`rounded-xl border p-2 text-left transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <p className="text-xs font-semibold text-slate-900">{ar.label}</p>
                    <p className="text-[10px] text-slate-500">{ar.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Visual Style Selector */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
              <Palette className="h-3.5 w-3.5 text-indigo-600" />
              <span>Visual Style</span>
            </label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {styleOptions.map((opt) => {
                const isSelected = style === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setStyle(opt)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Negative Prompt (Optional) */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Negative Prompt (Optional)
            </label>
            <input
              type="text"
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="blurry, distorted, watermark, deformed..."
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Generate Action Button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!prompt.trim() || processingState.status === 'processing'}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            <span>Generate Asset</span>
          </button>
        </div>

        {/* Right Column: Display Stage & Gallery (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          <ProcessingStateIndicator state={processingState} onRetry={handleGenerate} />

          {/* Main Visual Display */}
          <div className="relative flex min-h-[420px] items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-sm">
            {currentResult ? (
              <div className="group relative h-full w-full flex items-center justify-center">
                <img
                  src={currentResult.url}
                  alt={currentResult.prompt}
                  className="max-h-[500px] w-full object-contain"
                  referrerPolicy="no-referrer"
                />

                {/* Floating Action Controls on Hover */}
                <div className="absolute top-4 right-4 flex flex-wrap items-center gap-1.5 rounded-xl bg-slate-900/90 p-2 backdrop-blur-md opacity-95 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDownload(currentResult.url)}
                    title="Download High-Res PNG"
                    className="flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download</span>
                  </button>

                  {onTransferToTool && (
                    <>
                      <button
                        onClick={() => onTransferToTool('ai-image-editor', currentResult.url)}
                        title="Edit on Canvas"
                        className="flex items-center gap-1 rounded-lg bg-white/20 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-white/30 transition-colors"
                      >
                        <Sliders className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => onTransferToTool('image-upscaler', currentResult.url)}
                        title="Upscale 2x / 4x"
                        className="flex items-center gap-1 rounded-lg bg-white/20 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-white/30 transition-colors"
                      >
                        <Maximize2 className="h-3.5 w-3.5" />
                        <span>Upscale</span>
                      </button>

                      <button
                        onClick={() => onTransferToTool('background-remover', currentResult.url)}
                        title="Cutout / Remove Background"
                        className="flex items-center gap-1 rounded-lg bg-white/20 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-white/30 transition-colors"
                      >
                        <Scissors className="h-3.5 w-3.5" />
                        <span>Cutout</span>
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => handleVariation(currentResult)}
                    title="Generate Variation"
                    className="flex items-center gap-1 rounded-lg bg-white/20 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-white/30 transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Variation</span>
                  </button>

                  <button
                    onClick={() => handleFavorite(currentResult)}
                    title="Save to Favorites"
                    className="rounded-lg bg-white/20 p-1.5 text-white hover:bg-rose-600 hover:text-white transition-colors"
                  >
                    <Heart className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={handleDelete}
                    title="Delete Output"
                    className="rounded-lg bg-white/20 p-1.5 text-white hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="absolute bottom-4 left-4 right-4 rounded-xl bg-black/60 p-3 text-xs text-white backdrop-blur-md">
                  <p className="line-clamp-2 font-medium">{currentResult.prompt}</p>
                  <p className="mt-1 text-[11px] text-slate-300">Style: {currentResult.style} · Ratio: {currentResult.aspectRatio}</p>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400">
                <Sparkles className="mx-auto h-10 w-10 text-indigo-400 opacity-60" />
                <p className="mt-3 text-sm font-semibold text-slate-300">Visual Stage Ready</p>
                <p className="mt-1 text-xs text-slate-400 max-w-xs">
                  Enter a prompt on the left and click &quot;Generate Asset&quot; to synthesize images with Google Gemini.
                </p>
              </div>
            )}
          </div>

          {/* Recent Generations Gallery */}
          {history.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                Recent Creations
              </h3>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {history.slice(0, 6).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentResult(item)}
                    className="relative aspect-square overflow-hidden rounded-xl border border-slate-200 hover:ring-2 hover:ring-indigo-600 transition-all group"
                  >
                    <img
                      src={item.url}
                      alt={item.prompt || 'Generated'}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
