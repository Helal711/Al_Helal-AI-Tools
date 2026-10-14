import React from 'react';
import { Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { ProcessingState } from '../../types';

interface ProcessingStateIndicatorProps {
  state: ProcessingState;
  onRetry?: () => void;
  className?: string;
}

export const ProcessingStateIndicator: React.FC<ProcessingStateIndicatorProps> = ({
  state,
  onRetry,
  className = '',
}) => {
  if (state.status === 'idle') return null;

  return (
    <div className={`rounded-xl border p-4 transition-all ${className} ${
      state.status === 'error'
        ? 'border-red-200 bg-red-50/50 text-red-900'
        : state.status === 'completed'
        ? 'border-emerald-200 bg-emerald-50/50 text-emerald-900'
        : 'border-indigo-100 bg-indigo-50/40 text-slate-900'
    }`}>
      <div className="flex items-center gap-3">
        {state.status === 'error' ? (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
            <AlertCircle className="h-5 w-5" />
          </div>
        ) : state.status === 'completed' ? (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 animate-spin">
            <Loader2 className="h-5 w-5" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="flex items-center gap-1.5 truncate">
              {state.status !== 'completed' && state.status !== 'error' && (
                <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
              )}
              {state.message || 'Processing image...'}
            </span>
            {state.status !== 'completed' && state.status !== 'error' && (
              <span className="font-mono text-indigo-600">{Math.round(state.progress)}%</span>
            )}
          </div>

          {/* Progress track */}
          {state.status !== 'completed' && state.status !== 'error' && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full bg-indigo-600 transition-all duration-300 ease-out"
                style={{ width: `${Math.max(5, state.progress)}%` }}
              />
            </div>
          )}

          {state.status === 'error' && state.error && (
            <p className="mt-1 text-xs text-red-700">{state.error}</p>
          )}
        </div>

        {state.status === 'error' && onRetry && (
          <button
            onClick={onRetry}
            className="shrink-0 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
};
