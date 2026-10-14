import React from 'react';
import { ButtonVariant, ButtonSize } from '../../styles/designTokens';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  ariaLabel: string;
  tooltip?: string;
  icon: React.ReactNode;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      variant = 'ghost',
      size = 'md',
      ariaLabel,
      tooltip,
      icon,
      className = '',
      ...props
    },
    ref
  ) => {
    const sizeClasses: Record<ButtonSize, string> = {
      sm: 'h-8 w-8 min-h-[32px] min-w-[32px] p-1.5',
      md: 'h-10 w-10 min-h-[40px] min-w-[40px] p-2',
      lg: 'h-11 w-11 min-h-[44px] min-w-[44px] p-2.5',
    };

    const variantClasses: Record<ButtonVariant, string> = {
      primary:
        'bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm',
      secondary:
        'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
      outline:
        'border border-slate-300 bg-transparent text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800',
      ghost:
        'bg-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white',
      danger:
        'bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-900/40',
    };

    return (
      <button
        ref={ref}
        type="button"
        aria-label={ariaLabel}
        title={tooltip || ariaLabel}
        className={`inline-flex items-center justify-center rounded-xl transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {icon}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
