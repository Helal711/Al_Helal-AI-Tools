import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  Sparkles,
  Command,
  Sun,
  Moon,
  User,
  LogOut,
  FolderKanban,
  Heart,
  Settings,
  ShieldAlert,
  HelpCircle,
  Keyboard,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { NotificationBell } from './NotificationBell';

export interface AppHeaderProps {
  onToggleMobileMenu: () => void;
  onOpenCommandPalette: () => void;
  onOpenShortcuts: () => void;
  activeView: string;
  setActiveView: (view: string) => void;
  onOpenAuthModal: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onToggleMobileMenu,
  onOpenCommandPalette,
  onOpenShortcuts,
  activeView,
  setActiveView,
  onOpenAuthModal,
}) => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 shrink-0">
      <div className="flex h-15 items-center justify-between px-4 sm:px-6">
        {/* Left: Mobile hamburger & Brand */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            aria-label="Open mobile navigation menu"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => setActiveView('home')}
            className="flex items-center gap-2.5 text-left focus:outline-hidden"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 text-white shadow-xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="hidden sm:block">
              <span className="font-display text-base font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                Al_Helal<span className="text-indigo-600 dark:text-indigo-400"> AI Tools</span>
              </span>
            </div>
          </button>
        </div>

        {/* Center: Global Search & Command Palette Bar */}
        <div className="flex flex-1 max-w-md mx-4">
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs text-slate-500 hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:bg-slate-800 transition-colors shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
              <span>Search tools, projects, actions...</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
              {isMac ? '⌘' : 'Ctrl'} K
            </kbd>
          </button>
        </div>

        {/* Right: Quick actions, notifications, user avatar */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Shortcuts Dialog Trigger */}
          <button
            type="button"
            onClick={onOpenShortcuts}
            title="Keyboard shortcuts"
            className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <Keyboard className="h-4 w-4" />
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Notification Bell */}
          <NotificationBell />

          {/* User Menu */}
          {isAuthenticated && user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-xl p-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-hidden"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 font-bold text-xs text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {user.displayName || 'PixelForge Creator'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {user.email}
                    </p>
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveView('profile');
                        setUserMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span>Profile</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveView('projects');
                        setUserMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <FolderKanban className="h-3.5 w-3.5 text-slate-400" />
                      <span>My Projects</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveView('favorites');
                        setUserMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <Heart className="h-3.5 w-3.5 text-slate-400" />
                      <span>Favorites</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveView('settings');
                        setUserMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <Settings className="h-3.5 w-3.5 text-slate-400" />
                      <span>Settings</span>
                    </button>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveView('admin');
                          setUserMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
                      >
                        <ShieldAlert className="h-3.5 w-3.5" />
                        <span>Admin Console</span>
                      </button>
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-1 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setUserMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 shadow-2xs transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
