import React from 'react';
import { Home, Compass } from 'lucide-react';

interface NotFoundPageProps {
  setActiveView: (view: string) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ setActiveView }) => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="font-display font-black text-8xl text-indigo-600/30 dark:text-indigo-400/20 tracking-tighter">
          404
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Page not found.
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            The page or creative studio you were looking for doesn&apos;t exist or may have been relocated.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setActiveView('home')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-500 transition-colors"
          >
            <Home className="h-4 w-4" />
            <span>Go Home</span>
          </button>
          <button
            onClick={() => setActiveView('tools')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Compass className="h-4 w-4" />
            <span>Explore Tools</span>
          </button>
        </div>
      </div>
    </div>
  );
};
