import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HistoryProvider } from './context/HistoryContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppHeader } from './components/common/AppHeader';
import { AppSidebar } from './components/common/AppSidebar';
import { Footer } from './components/common/Footer';
import { CommandPalette } from './components/common/CommandPalette';
import { KeyboardShortcutsDialog } from './components/common/KeyboardShortcutsDialog';
import { AuthModal } from './components/common/AuthModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { OfflineBanner } from './components/common/OfflineBanner';
import { PWAInstallPrompt } from './components/common/PWAInstallPrompt';

import { HomePage } from './pages/HomePage';

// Route-based code splitting & lazy loading (Section 6 & 7)
const AllToolsPage = React.lazy(() => import('./pages/AllToolsPage').then((m) => ({ default: m.AllToolsPage })));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const ProjectsPage = React.lazy(() => import('./pages/ProjectsPage').then((m) => ({ default: m.ProjectsPage })));
const FavoritesPage = React.lazy(() => import('./pages/FavoritesPage').then((m) => ({ default: m.FavoritesPage })));
const ProcessingHistoryPage = React.lazy(() => import('./pages/ProcessingHistoryPage').then((m) => ({ default: m.ProcessingHistoryPage })));
const AdminPage = React.lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })));
const DocsPage = React.lazy(() => import('./pages/DocsPage').then((m) => ({ default: m.DocsPage })));
const LegalPages = React.lazy(() => import('./pages/LegalPages').then((m) => ({ default: m.LegalPages })));
const AuthPages = React.lazy(() => import('./pages/AuthPages').then((m) => ({ default: m.AuthPages })));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const DevelopersPage = React.lazy(() => import('./pages/DevelopersPage').then((m) => ({ default: m.DevelopersPage })));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));
const ToolDispatcher = React.lazy(() => import('./components/tools/ToolDispatcher').then((m) => ({ default: m.ToolDispatcher })));

const PageLoadingFallback = () => (
  <div role="status" aria-label="Loading page" className="min-h-[50vh] flex flex-col items-center justify-center p-8">
    <div className="h-8 w-8 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent dark:border-indigo-400" />
    <span className="mt-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Loading view...</span>
  </div>
);

export function AppContent() {
  const { user, isAuthenticated } = useAuth();
  const [activeView, setActiveView] = useState<string>(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || 'home';
  });

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Sidebar collapse preference in localStorage
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('pf_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('pf_sidebar_collapsed', String(next));
      } catch {
        // storage fallback
      }
      return next;
    });
  };

  // Sync hash for history and deep linking
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        setActiveView(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Global Keyboard listener: Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavigate = (view: string) => {
    setActiveView(view);
    window.location.hash = view === 'home' ? '' : view;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderCurrentView = () => {
    if (activeView === 'home' || activeView === '') {
      return <HomePage setActiveView={handleNavigate} />;
    }

    if (activeView === 'tools') {
      return <AllToolsPage initialCategory="all" setActiveView={handleNavigate} />;
    }

    if (activeView.startsWith('category:')) {
      const cat = activeView.replace('category:', '');
      return <AllToolsPage initialCategory={cat} setActiveView={handleNavigate} />;
    }

    if (activeView.startsWith('tool:')) {
      const slug = activeView.replace('tool:', '');
      return (
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-6">
          <ToolDispatcher toolSlug={slug} setActiveView={handleNavigate} />
        </div>
      );
    }

    // Auth Routes
    if (activeView === 'login') {
      return <AuthPages mode="login" setActiveView={handleNavigate} />;
    }
    if (activeView === 'register') {
      return <AuthPages mode="register" setActiveView={handleNavigate} />;
    }
    if (activeView === 'forgot-password') {
      return <AuthPages mode="forgot-password" setActiveView={handleNavigate} />;
    }
    // Comprehensive User Dashboard & Personal Workspace Routes (PART 08):
    // /dashboard
    // /dashboard/projects
    // /dashboard/projects/:projectId
    // /dashboard/files
    // /dashboard/history
    // /dashboard/jobs
    // /dashboard/favorites
    // /dashboard/templates
    // /dashboard/prompts
    // /dashboard/notifications
    // /dashboard/profile
    // /dashboard/settings
    // /dashboard/privacy
    const isDashboardRoute =
      activeView === 'dashboard' ||
      activeView.startsWith('dashboard/') ||
      activeView === 'projects' ||
      activeView.startsWith('projects/') ||
      activeView === 'files' ||
      activeView === 'history' ||
      activeView === 'jobs' ||
      activeView === 'favorites' ||
      activeView === 'templates' ||
      activeView === 'prompts' ||
      activeView === 'notifications' ||
      activeView === 'profile' ||
      activeView === 'settings' ||
      activeView === 'privacy';

    if (isDashboardRoute) {
      if (!isAuthenticated && !user) {
        sessionStorage.setItem('pf_auth_redirect', activeView);
        return <AuthPages mode="login" setActiveView={handleNavigate} />;
      }
      return <DashboardPage activePath={activeView} setActiveView={handleNavigate} />;
    }

    // Admin & Documentation
    if (activeView === 'admin' || activeView === 'admin/integration-audit') {
      const initialTab = activeView === 'admin/integration-audit' ? 'audit' : 'metrics';
      return <AdminPage initialTab={initialTab} setActiveView={handleNavigate} />;
    }
    if (activeView === 'docs') {
      return <DocsPage setActiveView={handleNavigate} />;
    }
    if (activeView === 'developers' || activeView === 'api') {
      return <DevelopersPage setActiveView={handleNavigate} />;
    }

    // Legal policies
    if (activeView === 'legal:privacy') {
      return <LegalPages type="privacy" setActiveView={handleNavigate} />;
    }
    if (activeView === 'legal:terms') {
      return <LegalPages type="terms" setActiveView={handleNavigate} />;
    }
    if (activeView === 'legal:cookies') {
      return <LegalPages type="cookies" setActiveView={handleNavigate} />;
    }

    // 404 Fallback
    return <NotFoundPage setActiveView={handleNavigate} />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-150">
      {/* Offline Status Warning */}
      <OfflineBanner />

      {/* Top Application Header */}
      <AppHeader
        activeView={activeView}
        setActiveView={handleNavigate}
        onToggleMobileMenu={() => setIsMobileSidebarOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenAuthModal={() => setIsAuthOpen(true)}
      />

      {/* Main Workspace Body with Shell Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Reusable Application Sidebar */}
        <AppSidebar
          activeView={activeView}
          setActiveView={handleNavigate}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Scrollable Content Viewport */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <main className="flex-1 min-w-0">
            <React.Suspense fallback={<PageLoadingFallback />}>
              {renderCurrentView()}
            </React.Suspense>
          </main>

          {/* Footer */}
          <Footer setActiveView={handleNavigate} />
        </div>
      </div>

      {/* Global Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectAction={handleNavigate}
      />

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      {/* PWA Install Banner */}
      <PWAInstallPrompt />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <HistoryProvider>
              <AppContent />
            </HistoryProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
