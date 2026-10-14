import React, { useState } from 'react';
import {
  Sparkles,
  Scissors,
  Maximize2,
  Eraser,
  FileBadge,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  HelpCircle,
  Layers,
  Palette,
  Video,
  Cpu,
  MonitorCheck,
  Lock,
} from 'lucide-react';
import { ALL_TOOLS, CATEGORY_METADATA } from '../data/toolsData';
import { BeforeAfterSlider } from '../components/common/BeforeAfterSlider';
import { SAMPLE_IMAGES } from '../utils/sampleImages';

interface HomePageProps {
  setActiveView: (view: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ setActiveView }) => {
  // Hero interactive demo state
  const [heroBefore] = useState<string>(() => SAMPLE_IMAGES.portrait());
  const [heroAfter] = useState<string>(() => SAMPLE_IMAGES.portrait());

  const featuredTools = ALL_TOOLS.filter((t) => t.featured).slice(0, 8);

  const workflowCategories = [
    {
      id: 'ai-image',
      name: 'Background & Cutout Studio',
      desc: 'Transparent hair-level segmentation, optical depth blur, and solid color studio replacements.',
      icon: Scissors,
      toolCount: ALL_TOOLS.filter((t) => t.category === 'ai-image').length,
      sampleTool: 'background-remover',
    },
    {
      id: 'ai-portrait',
      name: 'Biometric Passports & Headshots',
      desc: 'Official 2x2" US, 35x45mm EU & Schengen standards, studio backdrops, and 300 DPI print sheets.',
      icon: FileBadge,
      toolCount: ALL_TOOLS.filter((t) => t.category === 'ai-portrait').length,
      sampleTool: 'passport-photo-maker',
    },
    {
      id: 'ai-ecommerce',
      name: 'E-Commerce Commercial Staging',
      desc: 'Isolate products, cast directional ambient drop-shadows, and stage on travertine stone or wood pedestals.',
      icon: ShoppingBag,
      toolCount: ALL_TOOLS.filter((t) => t.category === 'ai-ecommerce').length,
      sampleTool: 'ecommerce-studio',
    },
    {
      id: 'ai-design',
      name: 'Design Studio & Social Posters',
      desc: 'Typography compositing, YouTube thumbnails, Instagram layouts, and brand asset generation.',
      icon: Palette,
      toolCount: ALL_TOOLS.filter((t) => t.category === 'ai-design').length,
      sampleTool: 'ai-design-studio',
    },
    {
      id: 'ai-utility',
      name: 'Zero-Latency Local Utilities',
      desc: 'Bicubic resizing, lossless WebP compression, aspect ratio cropping, rotation, and EXIF inspection.',
      icon: Layers,
      toolCount: ALL_TOOLS.filter((t) => t.category === 'ai-utility').length,
      sampleTool: 'image-resize',
    },
    {
      id: 'ai-video',
      name: 'Motion Photo & Video Hub',
      desc: 'Ken Burns cinematic pan, parallax pulse animation, video keyframe extraction, and MP4 capture.',
      icon: Video,
      toolCount: ALL_TOOLS.filter((t) => t.category === 'ai-video').length,
      sampleTool: 'ai-video-hub',
    },
  ];

  const faqs = [
    {
      q: 'Is Al_Helal AI Tools genuinely free to use?',
      a: 'Yes. Al_Helal AI Tools is 100% free to use. There are zero subscriptions, zero token deductions, no recharge balances, and no paywalls. Technical server resources are protected via fair-use quotas and client-side processing rather than charging per click.',
    },
    {
      q: 'Can I use generated and edited assets commercially?',
      a: 'Absolutely. All exported PNGs, transparent cutouts, e-commerce staged products, and generated artworks are fully available for both personal and commercial projects with full intellectual property rights.',
    },
    {
      q: 'Are my uploaded photographs secure and private?',
      a: 'Your images are processed securely using encrypted connections and processed in-memory or directly on your client browser canvas wherever possible. We do not sell or train public models on your private uploads.',
    },
    {
      q: 'Which image formats and file sizes are supported?',
      a: 'Al_Helal AI Tools supports PNG, JPG, JPEG, and WebP formats up to 25MB per file with ultra-high resolution export up to 4K.',
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-8 pb-12 sm:pt-16 sm:pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Hero Prose */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              {/* Trust Tag with Zero-Pill Discipline */}
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                <ShieldCheck className="h-4 w-4" />
                <span>100% Free Platform · Instant Access · Zero Paywalls</span>
              </div>

              {/* Headline */}
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1] text-balance">
                Create. Enhance.{' '}
                <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 bg-clip-text text-transparent">
                  Transform.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Powerful tools for image editing, background removal, visual enhancement, and creative workflows, all in one place.
              </p>

              {/* Primary Actions with Accessible Touch Targets */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveView('tool:background-remover')}
                  className="flex w-full sm:w-auto min-h-[48px] items-center justify-center gap-2 rounded-xl bg-indigo-600 px-7 py-3 text-sm font-bold text-white shadow-md shadow-indigo-200/50 hover:bg-indigo-700 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden transition-all dark:shadow-none"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Start Creating Free</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('tools')}
                  className="flex w-full sm:w-auto min-h-[48px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden transition-colors shadow-2xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <span>Explore All 55 Tools</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              {/* Technical Highlights */}
              <div className="pt-4 flex items-center justify-center lg:justify-start gap-6 sm:gap-8 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-800">
                <div>
                  <p className="font-bold font-mono text-base text-slate-900 dark:text-slate-100">0 Credits</p>
                  <p className="text-[11px]">100% Free Platform</p>
                </div>
                <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
                <div>
                  <p className="font-bold font-mono text-base text-slate-900 dark:text-slate-100">55 Tools</p>
                  <p className="text-[11px]">Creative Suite</p>
                </div>
                <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
                <div>
                  <p className="font-bold font-mono text-base text-slate-900 dark:text-slate-100">300 DPI</p>
                  <p className="text-[11px]">Print Ready Export</p>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Visual Demo */}
            <div className="lg:col-span-6">
              <div className="relative rounded-3xl border border-slate-200/80 bg-white p-3.5 shadow-xl shadow-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
                <div className="overflow-hidden rounded-2xl bg-slate-900">
                  <BeforeAfterSlider
                    beforeImage={heroBefore}
                    afterImage={heroAfter}
                    beforeLabel="Original Photo"
                    afterLabel="Instant Cutout"
                    aspectRatio="4/3"
                    isTransparentResult={true}
                    className="w-full min-h-[340px] sm:min-h-[400px]"
                  />
                </div>
                <div className="mt-3 flex items-center justify-between px-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-medium text-slate-700 dark:text-slate-300">Interactive Live Canvas Demo</span>
                  <button
                    type="button"
                    onClick={() => setActiveView('tool:background-remover')}
                    className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <span>Launch with your photo</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CREATIVE WORKFLOW CATEGORIES */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Studio Tool Categories
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Explore specialized creative workflows tailored for ecommerce, portraits, and content creation.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveView('tools')}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Browse All Categories</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {workflowCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.id}
                onClick={() => setActiveView(`tool:${cat.sampleTool}`)}
                className="group cursor-pointer flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-950/60 dark:text-indigo-400 dark:group-hover:bg-indigo-600 dark:group-hover:text-white transition-colors">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      {cat.toolCount} tools
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {cat.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    Ready to use
                  </span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    Open Workspace <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. FEATURED TOOLS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Popular Creative Tools
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Highest-throughput visual tools with zero setup required.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveView('tools')}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View All Tools Directory</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredTools.map((tool) => (
            <div
              key={tool.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700 transition-all group"
            >
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-950/60 dark:text-indigo-400 dark:group-hover:bg-indigo-600 dark:group-hover:text-white transition-colors mb-4">
                  {tool.slug === 'background-remover' && <Scissors className="h-5 w-5" />}
                  {tool.slug === 'image-generator' && <Sparkles className="h-5 w-5" />}
                  {tool.slug === 'photo-enhancer' && <Maximize2 className="h-5 w-5" />}
                  {tool.slug === 'object-remover' && <Eraser className="h-5 w-5" />}
                  {tool.slug === 'passport-photo-maker' && <FileBadge className="h-5 w-5" />}
                  {tool.slug === 'ecommerce-studio' && <ShoppingBag className="h-5 w-5" />}
                  {!['background-remover', 'image-generator', 'photo-enhancer', 'object-remover', 'passport-photo-maker', 'ecommerce-studio'].includes(tool.slug) && (
                    <Zap className="h-5 w-5" />
                  )}
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {tool.name}
                </h3>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                  {tool.shortDescription}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Free to use
                </span>
                <button
                  type="button"
                  onClick={() => setActiveView(`tool:${tool.slug}`)}
                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-indigo-600 hover:text-white dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-indigo-600 dark:hover:text-white transition-colors"
                >
                  Try Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section className="bg-slate-100/70 py-16 border-y border-slate-200/80 dark:bg-slate-900/40 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Three Steps from Upload to Final Export
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              No software installations, no complex learning curves, and free access.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
              <span className="font-display text-2xl font-black text-indigo-600 dark:text-indigo-400">01.</span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Upload or Choose a Sample</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Drag and drop your image, select one of our pre-built test photos, or provide a creative text prompt.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
              <span className="font-display text-2xl font-black text-indigo-600 dark:text-indigo-400">02.</span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Configure Supported Options</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Fine-tune cutout sensitivity, select podium staging backdrops, brush over unwanted objects, or select upscale factors.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
              <span className="font-display text-2xl font-black text-indigo-600 dark:text-indigo-400">03.</span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Preview & Export Real Files</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Inspect before-and-after sliders, verify transparent alpha channels, and download full-resolution PNG, WebP, or printable 300 DPI sheets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. TECHNICAL ARCHITECTURE & PRIVACY GUARANTEES */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-slate-900 p-8 sm:p-12 text-white shadow-xl dark:border dark:border-slate-800">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Technical Architecture
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
                Privacy-First, Client-Accelerated Processing
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Al_Helal AI Tools combines client-side WebGL and HTML5 Canvas processing with high-performance Google Gemini multimodal models on the server.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-start gap-2.5">
                <MonitorCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white">Client-Canvas Acceleration</h4>
                  <p className="text-slate-400 mt-0.5">Resizing, compression, and cropping run zero-latency in your browser.</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Cpu className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white">Multimodal Gemini AI</h4>
                  <p className="text-slate-400 mt-0.5">Prompt synthesis and generative editing powered by modern vision models.</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Lock className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white">Encrypted & Private</h4>
                  <p className="text-slate-400 mt-0.5">Your uploads are processed in memory and never used to train public models.</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white">Zero Paywalls</h4>
                  <p className="text-slate-400 mt-0.5">Every operational tool is fully accessible with zero credit cards required.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ SECTION */}
      <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Everything you need to know about Al_Helal AI Tools and our fair-use platform.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-2">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                <HelpCircle className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>{faq.q}</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 pl-6 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. FINAL CALL TO ACTION */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 p-8 sm:p-14 text-center text-white shadow-xl shadow-indigo-100 dark:shadow-none">
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Forge Your Next Visual Asset?
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-indigo-100 max-w-md mx-auto leading-relaxed">
            Start removing backgrounds, generating imagery, and staging products right now with zero barriers.
          </p>
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => setActiveView('tool:background-remover')}
              className="min-h-[48px] rounded-xl bg-white px-8 py-3.5 text-xs font-bold text-indigo-700 shadow-md hover:bg-indigo-50 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-hidden transition-colors"
            >
              Start Creating Now — 100% Free
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
