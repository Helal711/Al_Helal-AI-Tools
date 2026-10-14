/**
 * PixelForge AI — Universal Design Tokens & Theme Definitions
 * 
 * Central token definitions for colors, typography, spacing, border radii, shadows, and breakpoints.
 * Enforces anti-slop rules, zero-pill discipline, and consistent professional styling.
 */

export const DESIGN_TOKENS = {
  brand: {
    name: 'Al_Helal AI Tools',
    tagline: 'Create. Enhance. Transform.',
  },
  colors: {
    primary: {
      DEFAULT: '#4f46e5',
      hover: '#4338ca',
      light: '#eef2ff',
      dark: '#6366f1',
    },
    accent: {
      indigo: '#6366f1',
      violet: '#8b5cf6',
      emerald: '#10b981',
      amber: '#f59e0b',
      rose: '#f43f5e',
    },
    semantic: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
  },
  radius: {
    sm: 'rounded-md',    // 6px
    md: 'rounded-lg',    // 8px
    lg: 'rounded-xl',    // 12px
    xl: 'rounded-2xl',   // 16px
    full: 'rounded-full',
  },
  typography: {
    fontSans: "font-sans",
    fontDisplay: "font-display",
    fontMono: "font-mono",
  },
  buttonSizes: {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-3.5 py-2 text-xs font-semibold',
    lg: 'px-4 py-2.5 text-sm font-semibold',
  },
  touchTarget: {
    min: 'min-h-[40px] min-w-[40px]',
    mobile: 'min-h-[44px] min-w-[44px]',
  },
  transition: 'transition-all duration-150 ease-out',
} as const;

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';
