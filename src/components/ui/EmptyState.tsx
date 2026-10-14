import React from 'react';
import { AlertCircle, RotateCcw, ArrowLeft, HelpCircle } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      {icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">{title}</h3>
      <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">{description}</p>
      {action && (
        <div className="mt-4">
          <Button size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
};

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onBack?: () => void;
  onHelp?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  onBack,
  onHelp,
  className = '',
}) => {
  return (
    <div
      className={`rounded-2xl border border-rose-200/80 bg-rose-50/50 p-6 text-center dark:border-rose-900/40 dark:bg-rose-950/20 ${className}`}
    >
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h4 className="text-sm font-bold text-rose-950 dark:text-rose-100">{title}</h4>
      <p className="mx-auto mt-1 max-w-md text-xs text-rose-700 dark:text-rose-300">{message}</p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {onRetry && (
          <Button
            size="sm"
            variant="primary"
            onClick={onRetry}
            leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
          >
            Try Again
          </Button>
        )}
        {onBack && (
          <Button
            size="sm"
            variant="outline"
            onClick={onBack}
            leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}
          >
            Go Back
          </Button>
        )}
        {onHelp && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onHelp}
            leftIcon={<HelpCircle className="h-3.5 w-3.5" />}
          >
            Get Help
          </Button>
        )}
      </div>
    </div>
  );
};

export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => {
  return (
    <div className={`animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800 ${className}`} />
  );
};

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'neutral' | 'primary' | 'success' | 'warning' | 'error';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className = '',
}) => {
  const variantStyles = {
    neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    primary: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300',
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
    error: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium tracking-tight ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export interface TabsProps {
  tabs: { id: string; label: string; icon?: React.ReactNode; count?: number }[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className = '' }) => {
  return (
    <div
      role="tablist"
      className={`flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80 ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
              isActive
                ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-900 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {tab.icon && <span className="h-3.5 w-3.5 shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`ml-1 rounded px-1.5 py-0.2 text-[10px] ${
                  isActive
                    ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
