import React, { useState } from 'react';
import {
  Search,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  Scissors,
  Eraser,
  Maximize2,
  Sliders,
  FileBadge,
  ShoppingBag,
  LayoutTemplate,
  Video,
  Archive,
  User,
  ShieldAlert,
  Sun,
  Moon,
  FolderKanban,
  Settings,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { NotificationBell } from './NotificationBell';
import { ALL_TOOLS } from '../../data/toolsData';

interface NavbarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  onOpenSearch: () => void;
  onOpenAuthModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  setActiveView,
  onOpenSearch,
  onOpenAuthModal,
}) => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { theme, setTheme, isDark } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMegaCategory, setActiveMegaCategory] = useState<string | null>(null);

  const navCategories = [
    { id: 'ai-image', label: 'AI Image' },
    { id: 'ai-design', label: 'AI Design' },
    { id: 'ai-portrait', label: 'AI Portrait' },
    { id: 'ai-ecommerce', label: 'AI E-commerce' },
    { id: 'ai-video', label: 'AI Video' },
    { id: 'all-tools', label: 'All Tools' },
  ];

  const getIcon = (name: string) => {
    switch (name) {
      case 'Scissors': return <Scissors className="h-4 w-4" />;
      case 'Sparkles': return <Sparkles className="h-4 w-4" />;
      case 'Eraser': return <Eraser className="h-4 w-4" />;
      case 'Maximize2': return <Maximize2 className="h-4 w-4" />;
      case 'Sliders': return <Sliders className="h-4 w-4" />;
      case 'FileBadge': return <FileBadge className="h-4 w-4" />;
      case 'ShoppingBag': return <ShoppingBag className="h-4 w-4" />;
      case 'LayoutTemplate': return <LayoutTemplate className="h-4 w-4" />;
      case 'Video': return <Video className="h-4 w-4" />;
      default: return <Archive className="h-4 w-4" />;
    }
  };

  const handleToolClick = (slug: string) => {
    setActiveView(`tool:${slug}`);
    setActiveMegaCategory(null);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setActiveView('home');
              setActiveMegaCategory(null);
            }}
            className="flex items-center gap-2 text-left focus:outline-hidden"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 text-white shadow-sm shadow-indigo-200 dark:shadow-none">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="font-display text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Al_Helal<span className="text-indigo-600 dark:text-indigo-400"> AI Tools</span>
            </span>
          </button>
        </div>

        {/* Zone 2: 4-6 clean text navigation links with hover mega-dropdown */}
        <nav className="hidden lg:flex items-center gap-1">
          {navCategories.map((cat) => {
            if (cat.id === 'all-tools') {
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setActiveView('tools');
                    setActiveMegaCategory(null);
                  }}
                  className={`px-3 py-2 text-sm font-medium transition-colors hover:text-indigo-600 dark:hover:text-indigo-400 ${
                    activeView === 'tools'
                      ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  All Tools
                </button>
              );
            }

            const isHovered = activeMegaCategory === cat.id;
            return (
              <div
                key={cat.id}
                className="relative"
                onMouseEnter={() => setActiveMegaCategory(cat.id)}
                onMouseLeave={() => setActiveMegaCategory(null)}
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveView(`category:${cat.id}`);
                    setActiveMegaCategory(null);
                  }}
                  className={`flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors hover:text-indigo-600 dark:hover:text-indigo-400 ${
                    isHovered
                      ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <span>{cat.label}</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isHovered ? 'rotate-180' : ''}`} />
                </button>

                {/* Mega Menu Dropdown */}
                {isHovered && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-[480px] pt-2 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                      <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-2 text-xs font-semibold text-slate-400 dark:border-slate-800 uppercase tracking-wider">
                        <span>{cat.label} Suite</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-normal lowercase">100% free · zero credits</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {ALL_TOOLS.filter((t) => t.category === cat.id).map((tool) => (
                          <button
                            key={tool.id}
                            type="button"
                            onClick={() => handleToolClick(tool.slug)}
                            className="flex items-start gap-2.5 rounded-xl p-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 group"
                          >
                            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-950/60 dark:text-indigo-400 transition-colors">
                              {getIcon(tool.iconName)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                                {tool.name}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 leading-snug">
                                {tool.shortDescription}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Zone 3: 1-2 primary actions + search + notification + theme */}
        <div className="flex items-center gap-2">
          {/* Search Button */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-xs text-slate-500 hover:border-slate-300 hover:bg-white hover:text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 shadow-2xs transition-colors"
            title="Search tools (Ctrl+K)"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden sm:inline rounded bg-slate-200 px-1 py-0.5 text-[10px] font-mono text-slate-600 dark:bg-slate-800 dark:text-slate-400">⌘K</kbd>
          </button>

          {/* Theme Mode Toggle */}
          <button
            type="button"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="rounded-xl border border-slate-200 bg-slate-50/80 p-2 text-slate-600 hover:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 shadow-2xs transition-colors"
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Notification Bell */}
          <NotificationBell />

          {/* Admin link (if admin role) */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveView('admin')}
              className={`hidden md:flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                activeView === 'admin'
                  ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
                  : 'text-amber-800 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300'
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Admin</span>
            </button>
          )}

          {/* User Profile / Dashboard / Login */}
          {isAuthenticated ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveView('dashboard')}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeView === 'dashboard'
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <User className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{user?.displayName?.split(' ')[0] || 'Studio'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveView('settings')}
                className={`p-1.5 rounded-xl transition-colors ${
                  activeView === 'settings'
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title="Account Settings & Privacy"
                aria-label="Account Settings"
              >
                <Settings className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={logout}
                className="hidden lg:inline text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 px-1 py-1"
                title="Log out"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="text-xs font-semibold text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 px-3 py-1.5"
            >
              Sign In
            </button>
          )}

          {/* Primary CTA */}
          <button
            type="button"
            onClick={() => setActiveView('tools')}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors whitespace-nowrap"
          >
            Start Creating
          </button>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="grid grid-cols-2 gap-2 pb-2">
            {navCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  if (cat.id === 'all-tools') {
                    setActiveView('tools');
                  } else {
                    setActiveView(`category:${cat.id}`);
                  }
                  setMobileMenuOpen(false);
                }}
                className="rounded-lg p-2 text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveView('dashboard');
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 rounded-lg p-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <User className="h-4 w-4" />
              <span>User Dashboard</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveView('projects');
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 rounded-lg p-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <FolderKanban className="h-4 w-4" />
              <span>My Projects</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveView('settings');
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 rounded-lg p-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Settings className="h-4 w-4" />
              <span>Settings & Privacy</span>
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setActiveView('admin');
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 rounded-lg p-2 text-xs font-medium text-amber-800 dark:text-amber-300 hover:bg-amber-50"
              >
                <ShieldAlert className="h-4 w-4" />
                <span>Admin Console</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
