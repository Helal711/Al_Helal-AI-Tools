import React from 'react';
import { Hammer, RefreshCw } from 'lucide-react';

export const MaintenancePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-3xl border border-slate-800 bg-slate-900/90 p-8 text-center shadow-2xl backdrop-blur-xl space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <Hammer className="h-8 w-8 animate-bounce" />
        </div>
        <h1 className="text-xl font-bold text-white">System Maintenance in Progress</h1>
        <p className="text-xs text-slate-400 leading-relaxed">
          Al_Helal AI Tools is currently undergoing scheduled infrastructure upgrades to enhance model processing speeds. We will be back online shortly.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Check Status</span>
        </button>
      </div>
    </div>
  );
};
