import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Heart,
  HelpCircle,
  RefreshCw,
  Layers,
  Sparkles,
  Share2,
} from 'lucide-react';
import { IconButton } from '../ui/IconButton';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { firestore } from '../../firebase/firestore';

export interface ToolHeaderProps {
  toolId: string;
  name: string;
  description: string;
  icon?: React.ReactNode;
  onBack?: () => void;
  onReset?: () => void;
  onOpenHelp?: () => void;
  supportsBatch?: boolean;
  isBatchMode?: boolean;
  onToggleBatchMode?: () => void;
}

export const ToolHeader: React.FC<ToolHeaderProps> = ({
  toolId,
  name,
  description,
  icon,
  onBack,
  onReset,
  onOpenHelp,
  supportsBatch = false,
  isBatchMode = false,
  onToggleBatchMode,
}) => {
  const { user } = useAuth();
  const { success } = useToast();
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    // Check favorite status from local storage
    try {
      const favs = JSON.parse(localStorage.getItem('pixelforge_favorite_tools') || '[]');
      setIsFavorited(favs.includes(toolId));
    } catch {
      setIsFavorited(false);
    }
  }, [toolId]);

  const toggleFavorite = async () => {
    try {
      const favs = JSON.parse(localStorage.getItem('pixelforge_favorite_tools') || '[]');
      let updated: string[];
      if (favs.includes(toolId)) {
        updated = favs.filter((id: string) => id !== toolId);
        setIsFavorited(false);
        success('Removed from favorites');
      } else {
        updated = [...favs, toolId];
        setIsFavorited(true);
        success('Saved to favorites');
      }
      localStorage.setItem('pixelforge_favorite_tools', JSON.stringify(updated));

      // Sync to firestore if logged in
      if (user?.uid) {
        await firestore.setFavoriteTool(user.uid, toolId, !isFavorited);
      }
    } catch {
      // Fallback
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4 dark:border-slate-800">
      <div className="flex items-start gap-3.5">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back"
            className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors shadow-2xs shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {icon && <span className="text-indigo-600 dark:text-indigo-400 shrink-0">{icon}</span>}
            <h1 className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate">
              {name}
            </h1>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
            {description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
        {supportsBatch && onToggleBatchMode && (
          <button
            type="button"
            onClick={onToggleBatchMode}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors shadow-2xs ${
              isBatchMode
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>{isBatchMode ? 'Single Mode' : 'Batch Mode'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={toggleFavorite}
          aria-label={isFavorited ? 'Remove favorite' : 'Add to favorites'}
          className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-colors shadow-2xs ${
            isFavorited
              ? 'border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-400'
              : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Heart className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
        </button>

        {onOpenHelp && (
          <button
            type="button"
            onClick={onOpenHelp}
            title="Tool guide and tips"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors shadow-2xs"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        )}

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            title="Reset image and parameters"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors shadow-2xs"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};
