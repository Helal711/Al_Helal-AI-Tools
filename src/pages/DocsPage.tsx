import React from 'react';
import { BookOpen, Terminal, Code2, Shield, ArrowRight } from 'lucide-react';

interface DocsPageProps {
  setActiveView: (view: string) => void;
}

export const DocsPage: React.FC<DocsPageProps> = ({ setActiveView }) => {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
      {/* Title */}
      <div className="border-b border-slate-200 pb-6">
        <div className="flex items-center gap-2 text-indigo-600 mb-2">
          <BookOpen className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Developer & Platform Docs</span>
        </div>
        <h1 className="font-display text-3xl font-extrabold text-slate-900">
          Al_Helal AI Tools Documentation
        </h1>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          Comprehensive guide to Al_Helal AI Tools architecture, server-side Gemini integration, client canvas acceleration, and deployment workflows.
        </p>
      </div>

      {/* Section 1: Architecture Overview */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Code2 className="h-5 w-5 text-indigo-600" />
          <span>1. Architecture & Provider Layer</span>
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Al_Helal AI Tools separates client-side canvas transformations (for instant zero-latency feedback on crop, cutouts, passport grids, and compressors) from server-side generative AI engines powered by Google Gemini via the official <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700 font-mono">@google/genai</code> SDK.
        </p>

        <div className="rounded-2xl border border-slate-200 bg-slate-900 p-4 font-mono text-xs text-slate-300 overflow-x-auto">
          <pre>{`// Server-side initialization pattern (server.ts)
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: { 'User-Agent': 'aistudio-build' }
  }
});

// Client uses proxy endpoints without exposing API keys:
// POST /api/ai/generate-image -> calls gemini-3.1-flash-lite-image
// POST /api/ai/edit-image     -> calls gemini-3.1-flash-lite-image
// POST /api/ai/enhance-prompt -> calls gemini-3.8-flash`}</pre>
        </div>
      </section>

      {/* Section 2: Fair-Use Operating Model */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Shield className="h-5 w-5 text-indigo-600" />
          <span>2. Fair-Use Technical Operating Model</span>
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Al_Helal AI Tools contains no payment meters, no recharge cards, and no paywalls. Workload management is handled technically through:
        </p>
        <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
          <li>Browser-accelerated client canvas algorithms where suitable.</li>
          <li>Server-side request queuing and rate limiting.</li>
          <li>Adaptive prompt caching and memory sweeps.</li>
          <li>Administrative quotas configurable via the Admin Console.</li>
        </ul>
      </section>

      {/* Section 3: REST API Reference */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Terminal className="h-5 w-5 text-indigo-600" />
          <span>3. API Endpoints</span>
        </h2>
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="rounded bg-emerald-100 px-2 py-0.5 font-bold font-mono text-emerald-800">POST</span>
              <span className="font-mono font-bold text-slate-900">/api/ai/generate-image</span>
            </div>
            <p className="text-slate-500">
              Generates an image from a natural language text prompt with optional aspect ratio and style presets.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="rounded bg-emerald-100 px-2 py-0.5 font-bold font-mono text-emerald-800">POST</span>
              <span className="font-mono font-bold text-slate-900">/api/ai/edit-image</span>
            </div>
            <p className="text-slate-500">
              Edits an uploaded base64 image according to a descriptive instruction (e.g. &quot;add morning sunlight&quot;).
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="rounded bg-indigo-100 px-2 py-0.5 font-bold font-mono text-indigo-800">GET</span>
              <span className="font-mono font-bold text-slate-900">/api/ai/health</span>
            </div>
            <p className="text-slate-500">
              Returns the operational status of the Gemini SDK, configured models, and quota metrics.
            </p>
          </div>
        </div>
      </section>

      <div className="pt-6 border-t border-slate-200 flex justify-between">
        <button
          onClick={() => setActiveView('tools')}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700"
        >
          Explore All Tools
        </button>
        <button
          onClick={() => setActiveView('home')}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};
