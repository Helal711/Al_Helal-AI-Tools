import React from 'react';
import { Sparkles, ShieldCheck, Heart } from 'lucide-react';

interface FooterProps {
  setActiveView: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveView }) => {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          {/* Brand Info Column */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="font-display text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                Al_Helal<span className="text-indigo-600 dark:text-indigo-400"> AI Tools</span>
              </span>
            </div>
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Create. Enhance. Transform.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              Professional visual creation and image editing platform. Remove backgrounds, generate photorealistic visuals, retouch objects, and design commercial assets.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
              <span>100% Free Platform · Technical Fair-Use Quotas</span>
            </div>
          </div>

          {/* Product Column */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">Product</h4>
            <ul className="mt-4 space-y-2.5 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => setActiveView('category:ai-image')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden rounded"
                >
                  AI Image &amp; Cutouts
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveView('category:ai-design')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden rounded"
                >
                  AI Design Studio
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveView('category:ai-portrait')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden rounded"
                >
                  Portraits &amp; Passports
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveView('category:ai-ecommerce')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden rounded"
                >
                  E-Commerce Studio
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveView('category:ai-video')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden rounded"
                >
                  Motion Video Hub
                </button>
              </li>
            </ul>
          </div>

          {/* Featured Tools Column */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">Popular Tools</h4>
            <ul className="mt-4 space-y-2.5 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => setActiveView('tool:background-remover')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden rounded"
                >
                  Background Remover
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveView('tool:image-generator')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden rounded"
                >
                  AI Image Generator
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveView('tool:photo-enhancer')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden rounded"
                >
                  Photo Enhancer
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveView('tool:object-remover')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden rounded"
                >
                  Object Remover
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveView('tool:passport-photo-maker')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden rounded"
                >
                  Passport Photo Maker
                </button>
              </li>
            </ul>
          </div>

          {/* Resources & Legal Column */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">Resources</h4>
            <ul className="mt-4 space-y-2.5 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => setActiveView('docs')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden rounded"
                >
                  Documentation &amp; Guides
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveView('developers')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden rounded"
                >
                  Developer APIs
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveView('legal:privacy')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden rounded"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveView('legal:terms')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden rounded"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveView('legal:cookies')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden rounded"
                >
                  Cookie Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveView('settings')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden rounded"
                >
                  Settings &amp; Preferences
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveView('admin')}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden rounded"
                >
                  Admin Console
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800 pt-8 sm:flex-row text-xs text-slate-400 dark:text-slate-500">
          <p>© {new Date().getFullYear()} Al_Helal AI Tools. All rights reserved. Independent visual creation platform.</p>
          <div className="flex items-center gap-1">
            <span>Crafted for creators worldwide with</span>
            <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500 inline" />
          </div>
        </div>
      </div>
    </footer>
  );
};
