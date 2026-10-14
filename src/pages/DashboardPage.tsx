import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  UploadCloud,
  History,
  Cpu,
  Star,
  Layers,
  Sparkles,
  Bell,
  User,
  Settings,
  Shield,
  LogOut,
  Wand2,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useHistory } from '../context/HistoryContext';
import {
  firestore,
  ProjectDoc,
  FileDoc,
  FavoriteDoc,
  NotificationDoc,
  TemplateDoc,
  SavedPromptDoc,
} from '../firebase/firestore';
import { usageService, UsageCheckResult } from '../services/usageService';

// Dashboard Subcomponents
import { DashboardOverview } from '../components/dashboard/DashboardOverview';
import { DashboardProjects } from '../components/dashboard/DashboardProjects';
import { DashboardFiles } from '../components/dashboard/DashboardFiles';
import { DashboardHistory } from '../components/dashboard/DashboardHistory';
import { DashboardJobs } from '../components/dashboard/DashboardJobs';
import { DashboardFavorites } from '../components/dashboard/DashboardFavorites';
import { DashboardTemplates } from '../components/dashboard/DashboardTemplates';
import { DashboardPrompts } from '../components/dashboard/DashboardPrompts';
import { DashboardNotifications } from '../components/dashboard/DashboardNotifications';
import { DashboardProfile } from '../components/dashboard/DashboardProfile';
import { DashboardSettings } from '../components/dashboard/DashboardSettings';
import { DashboardPrivacy } from '../components/dashboard/DashboardPrivacy';

// Modals
import { NewProjectModal } from '../components/dashboard/NewProjectModal';
import { UploadFileModal } from '../components/dashboard/UploadFileModal';
import { ImageLightboxModal } from '../components/dashboard/ImageLightboxModal';

export type DashboardSection =
  | 'overview'
  | 'projects'
  | 'files'
  | 'history'
  | 'jobs'
  | 'favorites'
  | 'templates'
  | 'prompts'
  | 'notifications'
  | 'profile'
  | 'settings'
  | 'privacy';

interface DashboardPageProps {
  activePath?: string;
  setActiveView: (view: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ activePath = 'dashboard', setActiveView }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { history } = useHistory();

  // Firestore datasets
  const [projects, setProjects] = useState<ProjectDoc[]>([]);
  const [userFiles, setUserFiles] = useState<FileDoc[]>([]);
  const [favorites, setFavorites] = useState<FavoriteDoc[]>([]);
  const [notifications, setNotifications] = useState<NotificationDoc[]>([]);
  const [templates, setTemplates] = useState<TemplateDoc[]>([]);
  const [prompts, setPrompts] = useState<SavedPromptDoc[]>([]);
  const [usageInfo, setUsageInfo] = useState<UsageCheckResult>({
    allowed: true,
    count: 0,
    limit: 25,
    remaining: 25,
  });

  // Modals state
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState<string | undefined>(undefined);

  // Selected project for deep inspection
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Parse path and subroute
  const currentSection: DashboardSection = useMemo(() => {
    const raw = activePath || window.location.hash.replace('#', '') || 'dashboard';

    if (raw.startsWith('dashboard/projects/') || raw.startsWith('projects/')) {
      const parts = raw.split('/');
      const id = parts[parts.length - 1];
      if (id && id !== 'projects') {
        setSelectedProjectId(id);
      }
      return 'projects';
    }

    if (raw === 'dashboard/projects' || raw === 'projects') return 'projects';
    if (raw === 'dashboard/files' || raw === 'files') return 'files';
    if (raw === 'dashboard/history' || raw === 'history') return 'history';
    if (raw === 'dashboard/jobs' || raw === 'jobs') return 'jobs';
    if (raw === 'dashboard/favorites' || raw === 'favorites') return 'favorites';
    if (raw === 'dashboard/templates' || raw === 'templates') return 'templates';
    if (raw === 'dashboard/prompts' || raw === 'prompts') return 'prompts';
    if (raw === 'dashboard/notifications' || raw === 'notifications') return 'notifications';
    if (raw === 'dashboard/profile' || raw === 'profile') return 'profile';
    if (raw === 'dashboard/settings' || raw === 'settings') return 'settings';
    if (raw === 'dashboard/privacy' || raw === 'privacy') return 'privacy';

    return 'overview';
  }, [activePath]);

  // Handle section navigation
  const handleNavSection = (section: DashboardSection) => {
    setSelectedProjectId(null);
    if (section === 'overview') {
      setActiveView('dashboard');
    } else {
      setActiveView(`dashboard/${section}`);
    }
  };

  const handleOpenProject = (id: string) => {
    setSelectedProjectId(id);
    setActiveView(`dashboard/projects/${id}`);
  };

  // Fetch / Sync data from Firestore
  const loadAsyncData = useCallback(() => {
    if (!user?.uid) return;

    firestore.listUserFiles(user.uid).then((res) => {
      if (res) setUserFiles(res);
    }).catch(() => {});

    firestore.listUserTemplates(user.uid).then((res) => {
      if (res) setTemplates(res);
    }).catch(() => {});

    firestore.listUserPrompts(user.uid).then((res) => {
      if (res) setPrompts(res);
    }).catch(() => {});

    usageService.checkUsage(user.uid, 'AI Image Generator').then((res) => {
      setUsageInfo(res);
    }).catch(() => {});
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) {
      setProjects([]);
      setUserFiles([]);
      setFavorites([]);
      setNotifications([]);
      setTemplates([]);
      setPrompts([]);
      return;
    }

    const unsubProjects = firestore.subscribeUserProjects(user.uid, (list) => {
      setProjects(list);
    });

    const unsubFavs = firestore.subscribeUserFavorites(user.uid, (list) => {
      setFavorites(list);
    });

    const unsubNotifs = firestore.subscribeUserNotifications(user.uid, (list) => {
      setNotifications(list);
    });

    loadAsyncData();

    return () => {
      unsubProjects();
      unsubFavs();
      unsubNotifs();
    };
  }, [user?.uid, loadAsyncData]);

  // Unread notifications count
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Sidebar navigation items
  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'projects', label: 'My Projects', icon: FolderKanban, count: projects.length },
    { id: 'files', label: 'All Files', icon: UploadCloud, count: userFiles.length },
    { id: 'history', label: 'AI History', icon: History, count: history.length },
    { id: 'jobs', label: 'Processing Jobs', icon: Cpu },
    { id: 'favorites', label: 'Favorites', icon: Star, count: favorites.length },
    { id: 'templates', label: 'Templates', icon: Layers },
    { id: 'prompts', label: 'Saved Prompts', icon: Sparkles },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Preferences', icon: Settings },
    { id: 'privacy', label: 'Privacy & Data', icon: Shield },
  ];

  // Unauthenticated Barrier
  if (!isAuthenticated && !user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center space-y-5">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
          <LayoutDashboard className="h-8 w-8" />
        </div>
        <h2 className="font-display text-2xl font-extrabold text-slate-900 dark:text-slate-100">
          Sign In to Your Workspace
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
          Al_Helal AI Tools personal workspace provides cloud project management, image versioning, and prompt formula storage.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              sessionStorage.setItem('pf_auth_redirect', activePath);
              setActiveView('login');
            }}
            className="w-full sm:w-auto rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
          >
            Sign In with Account
          </button>
          <button
            type="button"
            onClick={() => {
              sessionStorage.setItem('pf_auth_redirect', activePath);
              setActiveView('register');
            }}
            className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            Create Free Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ================= LEFT WORKSPACE SIDEBAR ================= */}
        <aside className="lg:col-span-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
          {/* User Mini Profile */}
          <div className="flex items-center gap-3 p-2 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-lg shadow-xs overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="h-full w-full object-cover" />
              ) : user?.displayName ? (
                user.displayName[0].toUpperCase()
              ) : (
                'U'
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                {user?.displayName || 'Creator'}
              </p>
              <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold truncate">
                Creator Unlimited
              </p>
              <p className="text-[10px] text-slate-400 font-mono truncate">{user?.email}</p>
            </div>
          </div>

          {/* Navigation Links for 12 Core Sections */}
          <nav className="space-y-1 text-xs">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isSelected = currentSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavSection(item.id as DashboardSection)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 font-semibold transition-colors ${
                    isSelected
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                        {item.badge}
                      </span>
                    )}
                    {item.count !== undefined && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {item.count}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Quick Launch & Sign Out */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-1">
            <button
              type="button"
              onClick={() => setActiveView('tools')}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
            >
              <Wand2 className="h-4 w-4" />
              <span>AI Tools Directory</span>
            </button>
            <button
              type="button"
              onClick={() => {
                logout();
                setActiveView('home');
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* ================= RIGHT MAIN WORKSPACE ================= */}
        <main className="lg:col-span-9 min-w-0">
          {/* Section 1: Overview */}
          {currentSection === 'overview' && (
            <DashboardOverview
              projects={projects}
              history={history}
              userFiles={userFiles}
              usageInfo={usageInfo}
              setActiveView={setActiveView}
              onOpenProject={handleOpenProject}
              onOpenNewProjectModal={() => setIsNewProjectOpen(true)}
              onOpenUploadModal={() => setIsUploadOpen(true)}
              onPreviewImage={(url, title) => {
                setLightboxUrl(url);
                setLightboxTitle(title);
              }}
              onRefreshData={loadAsyncData}
            />
          )}

          {/* Section 2: Projects */}
          {currentSection === 'projects' && (
            <DashboardProjects
              projects={projects}
              selectedProjectId={selectedProjectId}
              onSelectProject={setSelectedProjectId}
              setActiveView={setActiveView}
              onRefreshData={loadAsyncData}
              onPreviewImage={(url, title) => {
                setLightboxUrl(url);
                setLightboxTitle(title);
              }}
              onOpenNewProjectModal={() => setIsNewProjectOpen(true)}
            />
          )}

          {/* Section 3: All Files */}
          {currentSection === 'files' && (
            <DashboardFiles
              files={userFiles}
              projects={projects}
              onOpenUploadModal={() => setIsUploadOpen(true)}
              onPreviewImage={(url, title) => {
                setLightboxUrl(url);
                setLightboxTitle(title);
              }}
              onRefreshData={loadAsyncData}
              setActiveView={setActiveView}
            />
          )}

          {/* Section 4: AI Generation History */}
          {currentSection === 'history' && (
            <DashboardHistory
              history={history}
              projects={projects}
              setActiveView={setActiveView}
              onPreviewImage={(url, title) => {
                setLightboxUrl(url);
                setLightboxTitle(title);
              }}
              onRefreshData={loadAsyncData}
            />
          )}

          {/* Section 5: Processing Jobs */}
          {currentSection === 'jobs' && (
            <DashboardJobs
              setActiveView={setActiveView}
              onPreviewImage={(url, title) => {
                setLightboxUrl(url);
                setLightboxTitle(title);
              }}
            />
          )}

          {/* Section 6: Favorites */}
          {currentSection === 'favorites' && (
            <DashboardFavorites
              favorites={favorites}
              setActiveView={setActiveView}
              onPreviewImage={(url, title) => {
                setLightboxUrl(url);
                setLightboxTitle(title);
              }}
              onRefreshData={loadAsyncData}
            />
          )}

          {/* Section 7: Templates */}
          {currentSection === 'templates' && (
            <DashboardTemplates
              templates={templates}
              setActiveView={setActiveView}
              onRefreshData={loadAsyncData}
            />
          )}

          {/* Section 8: Saved Prompts */}
          {currentSection === 'prompts' && (
            <DashboardPrompts
              prompts={prompts}
              setActiveView={setActiveView}
              onRefreshData={loadAsyncData}
            />
          )}

          {/* Section 9: Notifications */}
          {currentSection === 'notifications' && (
            <DashboardNotifications
              notifications={notifications}
              onRefreshData={loadAsyncData}
            />
          )}

          {/* Section 10: Profile */}
          {currentSection === 'profile' && (
            <DashboardProfile onRefreshData={loadAsyncData} />
          )}

          {/* Section 11: Preferences */}
          {currentSection === 'settings' && <DashboardSettings />}

          {/* Section 12: Privacy & Data Management */}
          {currentSection === 'privacy' && (
            <DashboardPrivacy
              setActiveView={setActiveView}
              onRefreshData={loadAsyncData}
            />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <NewProjectModal
        isOpen={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
        onProjectCreated={(id) => {
          setSelectedProjectId(id);
          setActiveView(`dashboard/projects/${id}`);
          loadAsyncData();
        }}
      />

      <UploadFileModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onFileUploaded={loadAsyncData}
      />

      <ImageLightboxModal
        isOpen={Boolean(lightboxUrl)}
        imageUrl={lightboxUrl}
        title={lightboxTitle}
        onClose={() => {
          setLightboxUrl(null);
          setLightboxTitle(undefined);
        }}
      />
    </div>
  );
};
