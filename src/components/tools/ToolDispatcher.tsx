import React, { useEffect, Suspense, lazy } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, HelpCircle, Sparkles, Layers, ShieldCheck, Loader2 } from 'lucide-react';
import { getToolBySlug, getRelatedTools, ToolRegistryItem } from '../../data/toolRegistry';
import { capabilityManager } from '../../ai/capabilities';

// Code-split dynamic tool workspaces (Section 6 & 7)
const BackgroundRemoverTool = lazy(() => import('./BackgroundRemoverTool').then((m) => ({ default: m.BackgroundRemoverTool })));
const AIImageGeneratorTool = lazy(() => import('./AIImageGeneratorTool').then((m) => ({ default: m.AIImageGeneratorTool })));
const ObjectRemoverTool = lazy(() => import('./ObjectRemoverTool').then((m) => ({ default: m.ObjectRemoverTool })));
const PhotoEnhancerTool = lazy(() => import('./PhotoEnhancerTool').then((m) => ({ default: m.PhotoEnhancerTool })));
const PassportPhotoTool = lazy(() => import('./PassportPhotoTool').then((m) => ({ default: m.PassportPhotoTool })));
const EcommerceStudioTool = lazy(() => import('./EcommerceStudioTool').then((m) => ({ default: m.EcommerceStudioTool })));
const AIDesignStudioTool = lazy(() => import('./AIDesignStudioTool').then((m) => ({ default: m.AIDesignStudioTool })));
const AIVideoHubTool = lazy(() => import('./AIVideoHubTool').then((m) => ({ default: m.AIVideoHubTool })));
const AIImageEditorTool = lazy(() => import('./AIImageEditorTool').then((m) => ({ default: m.AIImageEditorTool })));
const LocalImageTools = lazy(() => import('./LocalImageTools').then((m) => ({ default: m.LocalImageTools })));

const ToolLoadingSkeleton: React.FC<{ toolName?: string }> = ({ toolName }) => (
  <div
    role="status"
    aria-label="Loading workspace"
    className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900"
  >
    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
      Loading {toolName || 'Tool'} Workspace...
    </h3>
    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
      Optimizing graphics processing pipeline and loading engine modules
    </p>
  </div>
);

interface ToolDispatcherProps {
  toolSlug: string;
  setActiveView: (view: string) => void;
}

export const ToolDispatcher: React.FC<ToolDispatcherProps> = ({ toolSlug, setActiveView }) => {
  const currentTool = getToolBySlug(toolSlug);
  const toolState = capabilityManager.getToolState(toolSlug);
  const relatedTools = getRelatedTools(toolSlug, 4);

  // Dynamic SEO metadata per tool
  useEffect(() => {
    const titleName = currentTool ? currentTool.seoTitle : 'AI Visual Workspace';
    document.title = `${titleName} — Al_Helal AI Tools`;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && currentTool) {
      metaDesc.setAttribute('content', currentTool.seoDescription || currentTool.shortDescription);
    }
  }, [currentTool, toolSlug]);

  const handleTransfer = (slug: string, _imageUri: string) => {
    setActiveView(`tool:${slug}`);
  };

  const renderToolComponent = () => {
    // 1. Check if tool requires external provider not yet configured
    if (currentTool?.status === 'provider_required') {
      return (
        <div className="mx-auto max-w-xl rounded-2xl border border-indigo-200/80 bg-indigo-50/60 p-8 text-center dark:border-indigo-900/40 dark:bg-indigo-950/20">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-900/50">
            <Sparkles className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 mb-3">
            Provider Required
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {currentTool.name}
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            This generative visual capability requires a connected high-throughput engine:
          </p>
          <div className="mt-3 rounded-xl bg-white p-3 font-mono text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
            {currentTool.provider}
          </div>
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            To activate this feature, administrators can provide an API key in the System Administration console.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => setActiveView('tools')}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Explore Ready AI Tools
            </button>
          </div>
        </div>
      );
    }

    if (toolState === 'DISABLED') {
      return (
        <div className="mx-auto max-w-xl rounded-2xl border border-amber-200/80 bg-amber-50/60 p-8 text-center dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/50">
            <AlertCircle className="h-7 w-7 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            This AI feature is currently unavailable.
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {capabilityManager.getUnavailableMessage(toolSlug)}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => setActiveView('tools')}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Browse Other Tools
            </button>
          </div>
        </div>
      );
    }

    switch (toolSlug) {
      // 1. Cutout & Background Extraction
      case 'background-remover':
      case 'face-cutout':
      case 'product-background':
      case 'background-blur':
        return <BackgroundRemoverTool mode={toolSlug} />;

      // 2. Generative Text-to-Image & Portait & Wallpaper & Merch
      case 'image-generator':
      case 'ai-image-generator':
      case 'portrait-generator':
      case 'wallpaper-generator':
      case 'greeting-card':
      case 'tshirt-design':
      case 'invitation-maker':
      case 'ai-image-variations':
        return <AIImageGeneratorTool mode={toolSlug} onTransferToTool={handleTransfer} />;

      // 3. Object Eraser / Inpainting
      case 'object-remover':
        return <ObjectRemoverTool />;

      // 4. Upscaler, Enhancer, Restorer, Colorizer, Sharpener, Denoiser, Relighting, Artistic
      case 'photo-enhancer':
      case 'image-enhancer':
      case 'upscaler':
      case 'image-upscaler':
      case 'image-restorer':
      case 'image-colorizer':
      case 'photo-colorizer':
      case 'image-sharpener':
      case 'image-denoiser':
      case 'image-relighting':
      case 'portrait-enhancer':
      case 'product-enhancer':
      case 'cartoon-portrait':
      case 'sketch-portrait':
        return <PhotoEnhancerTool mode={toolSlug} />;

      // 5. Passport, ID & Biometric Headshots
      case 'passport-photo':
      case 'passport-photo-maker':
      case 'passport-maker':
      case 'id-photo':
      case 'ai-headshot':
      case 'professional-photo':
      case 'portrait-style':
      case 'portrait-background':
        return <PassportPhotoTool />;

      // 6. E-Commerce Staging, Shadows & Commercial Placement
      case 'ecommerce-studio':
      case 'product-staging':
      case 'product-shadow':
      case 'product-background-generator':
      case 'product-scene-generator':
      case 'marketplace-image-maker':
      case 'product-poster':
        return <EcommerceStudioTool mode={toolSlug} />;

      // 7. Design Studio, Posters, Banners & Social Creatives
      case 'ai-design-studio':
      case 'ai-poster':
      case 'ai-banner':
      case 'ai-flyer':
      case 'social-media-post':
      case 'thumbnail-generator':
        return <AIDesignStudioTool mode={toolSlug} />;

      // 8. Video Synthesis & Parallax Animation
      case 'ai-video-hub':
      case 'photo-animation':
      case 'image-to-video':
      case 'video-enhancer':
      case 'video-background-remover':
      case 'ai-video-effects':
        return <AIVideoHubTool />;

      // 9. Prompt-based Multimodal Image Editor & Outpainting
      case 'image-editor':
      case 'ai-image-editor':
      case 'image-extender':
      case 'image-recolor':
      case 'background-generator':
        return <AIImageEditorTool />;

      // 10. Local Zero-Latency Format & Dimension Utilities
      case 'image-resize':
      case 'product-resizer':
        return <LocalImageTools mode="resize" />;
      case 'image-crop':
        return <LocalImageTools mode="crop" />;
      case 'image-compress':
        return <LocalImageTools mode="compress" />;
      case 'image-convert':
      case 'image-converter':
        return <LocalImageTools mode="convert" />;
      case 'image-rotate':
        return <LocalImageTools mode="rotate" />;
      case 'image-flip':
        return <LocalImageTools mode="flip" />;
      case 'image-info':
      case 'image-information':
        return <LocalImageTools mode="info" />;

      default:
        return <BackgroundRemoverTool />;
    }
  };

  return (
    <div className="py-6 sm:py-8">
      {/* Breadcrumb Navigation */}
      <div className="mb-6 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <button
          onClick={() => setActiveView('home')}
          className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          Home
        </button>
        <span>/</span>
        <button
          onClick={() => setActiveView('tools')}
          className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          Tools
        </button>
        {currentTool && (
          <>
            <span>/</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{currentTool.name}</span>
          </>
        )}
      </div>

      {/* Tool Header Banner */}
      {currentTool && (
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {currentTool.name}
              </h1>
              {currentTool.badge && (
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  · {currentTool.badge}
                </span>
              )}
            </div>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 max-w-3xl">
              {currentTool.description}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Zero Credit Limits • Free Full Quality</span>
          </div>
        </div>
      )}

      {/* Main Interactive Tool Workspace */}
      <Suspense fallback={<ToolLoadingSkeleton toolName={currentTool?.name} />}>
        {renderToolComponent()}
      </Suspense>

      {/* Section 34: Recommended Related Tools */}
      {relatedTools.length > 0 && (
        <div className="mt-16 border-t border-slate-200 pt-10 dark:border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                Recommended Workflow Tools
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Complementary visual tools for seamless multi-stage editing
              </p>
            </div>
            <button
              onClick={() => setActiveView('tools')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
            >
              All Tools <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedTools.map((tool) => (
              <div
                key={tool.id}
                onClick={() => setActiveView(`tool:${tool.slug}`)}
                className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700"
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {tool.category.replace('_', ' ')}
                  </div>
                  {tool.status === 'ready' ? (
                    <span className="h-2 w-2 rounded-full bg-emerald-500" title="Ready" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-amber-500" title="Provider Required" />
                  )}
                </div>
                <h4 className="mt-2 text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  {tool.name}
                </h4>
                <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                  {tool.shortDescription}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 69: Dynamic Tool FAQs */}
      {currentTool?.faq && currentTool.faq.length > 0 && (
        <div className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <HelpCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Frequently Asked Questions
          </h3>
          <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
            {currentTool.faq.map((item, idx) => (
              <div key={idx} className={idx > 0 ? 'pt-4' : ''}>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-200">
                  {item.question}
                </h4>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
