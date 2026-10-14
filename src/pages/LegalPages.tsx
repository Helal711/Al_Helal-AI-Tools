import React from 'react';

interface LegalPagesProps {
  type: 'privacy' | 'terms' | 'cookies';
  setActiveView: (view: string) => void;
}

export const LegalPages: React.FC<LegalPagesProps> = ({ type, setActiveView }) => {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      {/* Navigation tabs */}
      <div className="flex gap-4 border-b border-slate-200 pb-3 text-xs font-semibold">
        <button
          onClick={() => setActiveView('legal:privacy')}
          className={`pb-3 -mb-3 transition-colors ${
            type === 'privacy' ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Privacy Policy
        </button>
        <button
          onClick={() => setActiveView('legal:terms')}
          className={`pb-3 -mb-3 transition-colors ${
            type === 'terms' ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Terms of Service
        </button>
        <button
          onClick={() => setActiveView('legal:cookies')}
          className={`pb-3 -mb-3 transition-colors ${
            type === 'cookies' ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Cookie Policy
        </button>
      </div>

      {type === 'privacy' && (
        <div className="space-y-6 text-xs text-slate-600 leading-relaxed">
          <h1 className="font-display text-2xl font-extrabold text-slate-900">Privacy Policy</h1>
          <p className="text-[11px] text-slate-400">Last updated: October 2026</p>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900">1. Image Upload and Processing Lifecycle</h2>
            <p>
              When you use Al_Helal AI Tools (such as Background Remover, Object Remover, and Photo Enhancer), processing is performed either directly within your local browser environment using accelerated HTML5 canvas operations or temporarily relayed to secure server-side AI endpoints for generative synthesis.
            </p>
            <p>
              Uploaded visual assets are retained strictly for your session and saved to your account history if you are logged in. We do not use your private personal images to train public artificial intelligence models.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900">2. Data Retention and Storage</h2>
            <p>
              Temporary processing buffers are cleared automatically after transformation. If you save images to your account or download gallery, they are stored securely in encrypted cloud storage accessible only by your authenticated user ID.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900">3. Authentication and Security</h2>
            <p>
              User authentication is managed via Firebase Authentication and secure token exchanges. We do not store plain-text passwords or expose API secrets to the client browser.
            </p>
          </section>
        </div>
      )}

      {type === 'terms' && (
        <div className="space-y-6 text-xs text-slate-600 leading-relaxed">
          <h1 className="font-display text-2xl font-extrabold text-slate-900">Terms of Service</h1>
          <p className="text-[11px] text-slate-400">Last updated: October 2026</p>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900">1. Acceptance of Terms</h2>
            <p>
              By accessing Al_Helal AI Tools, you agree to these Terms of Service. Al_Helal AI Tools is provided as an independent visual creation and editing platform operating on a 100% free fair-use policy.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900">2. Free Usage & Acceptable Use Policy</h2>
            <p>
              All enabled tools are free to use. Users agree not to abuse automated bots to disrupt service availability, transmit illicit material, or attempt unauthorized access to platform servers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900">3. Ownership of Output</h2>
            <p>
              To the maximum extent permitted by applicable law, you retain full ownership and commercial rights to the visual assets, cutouts, and designs generated or edited using Al_Helal AI Tools.
            </p>
          </section>
        </div>
      )}

      {type === 'cookies' && (
        <div className="space-y-6 text-xs text-slate-600 leading-relaxed">
          <h1 className="font-display text-2xl font-extrabold text-slate-900">Cookie Policy</h1>
          <p className="text-[11px] text-slate-400">Last updated: October 2026</p>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900">1. How We Use Cookies</h2>
            <p>
              Al_Helal AI Tools uses strictly necessary cookies and local storage tokens to preserve your login session, save your personal project history, and remember your visual editor preference settings.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900">2. Third-Party Analytics</h2>
            <p>
              We do not track you across external third-party advertising networks. You can clear your local storage at any time through your browser settings or within your user dashboard.
            </p>
          </section>
        </div>
      )}

      <div className="pt-6 border-t border-slate-200">
        <button
          onClick={() => setActiveView('home')}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};
