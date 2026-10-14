import React, { useState, useEffect } from 'react';
import { Download, X, Sparkles } from 'lucide-react';

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem('pf_pwa_dismissed') === 'true';
    if (isDismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pf_pwa_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <aside
      aria-label="App installation banner"
      className="fixed bottom-5 right-5 z-50 max-w-sm rounded-2xl border border-indigo-200 dark:border-indigo-900 bg-white dark:bg-slate-900 p-4 shadow-xl backdrop-blur-md animate-in slide-in-from-bottom-4"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="flex-1 text-xs">
          <h2 className="font-bold text-slate-900 dark:text-white">Install Al_Helal AI Tools</h2>
          <p className="mt-0.5 text-slate-500 dark:text-slate-400">
            Install on your desktop or home screen for faster access, offline tools, and a full native app experience.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleInstall}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 font-bold text-white shadow-sm hover:bg-indigo-500 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Install App</span>
            </button>
            <button
              onClick={handleDismiss}
              className="rounded-xl px-2.5 py-1.5 font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Later
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
          title="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
};
