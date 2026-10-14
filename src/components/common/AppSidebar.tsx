import React, { useState, useEffect } from 'react';
import {
  Home,
  LayoutDashboard,
  FolderKanban,
  Clock,
  Sparkles,
  Palette,
  UserCheck,
  ShoppingBag,
  Video,
  Scissors,
  Crop,
  Minimize2,
  RefreshCw,
  RotateCw,
  FlipHorizontal,
  Heart,
  History,
  FileCode,
  Bell,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Wand2,
  UploadCloud,
  Cpu,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface AppSidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  activeView,
  setActiveView,
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { user, isAdmin } = useAuth();

  const handleNav = (view: string) => {
    setActiveView(view);
    if (onCloseMobile) onCloseMobile();
  };

  const navSections = [
    {
      title: 'Main',
      items: [
        { id: 'home', label: 'Home', icon: Home },
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'projects', label: 'Projects', icon: FolderKanban },
        { id: 'history', label: 'Recent', icon: Clock },
      ],
    },
    {
      title: 'AI Tools',
      items: [
        { id: 'category:AI_IMAGE', label: 'AI Image', icon: Sparkles },
        { id: 'category:AI_DESIGN', label: 'AI Design', icon: Palette },
        { id: 'category:AI_PORTRAIT', label: 'AI Portrait', icon: UserCheck },
        { id: 'category:AI_ECOMMERCE', label: 'E-commerce', icon: ShoppingBag },
        { id: 'category:AI_VIDEO', label: 'AI Video', icon: Video },
      ],
    },
    {
      title: 'Utilities',
      items: [
        { id: 'tool:image-resize', label: 'Resize', icon: Minimize2 },
        { id: 'tool:image-crop', label: 'Crop', icon: Crop },
        { id: 'tool:image-compress', label: 'Compress', icon: Scissors },
        { id: 'tool:image-convert', label: 'Convert', icon: RefreshCw },
        { id: 'tool:image-rotate', label: 'Rotate', icon: RotateCw },
        { id: 'tool:image-flip', label: 'Flip', icon: FlipHorizontal },
      ],
    },
    {
      title: 'Workspace',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'dashboard/projects', label: 'Projects', icon: FolderKanban },
        { id: 'dashboard/files', label: 'All Files', icon: UploadCloud },
        { id: 'dashboard/history', label: 'AI History', icon: History },
        { id: 'dashboard/jobs', label: 'Jobs Monitor', icon: Cpu },
        { id: 'dashboard/favorites', label: 'Favorites', icon: Heart },
        { id: 'dashboard/templates', label: 'Templates', icon: Layers },
        { id: 'dashboard/prompts', label: 'Saved Prompts', icon: Sparkles },
      ],
    },
    {
      title: 'System',
      items: [
        { id: 'dashboard/settings', label: 'Settings', icon: Settings },
        { id: 'docs', label: 'Help & Docs', icon: HelpCircle },
      ],
    },
  ];

  if (isAdmin) {
    navSections.push({
      title: 'Administration',
      items: [
        { id: 'admin', label: 'Admin Console', icon: ShieldAlert },
      ],
    });
  }

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between overflow-y-auto py-3">
      <div className="space-y-6 px-3">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            {!isCollapsed && (
              <h4 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {section.title}
              </h4>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  activeView === item.id ||
                  (item.id.startsWith('category:') && activeView === item.id) ||
                  (item.id.startsWith('tool:') && activeView === item.id);

                return (
                  <button
                    key={item.id}
                    type="button"
                    title={isCollapsed ? item.label : undefined}
                    onClick={() => handleNav(item.id)}
                    className={`group flex w-full min-h-[40px] sm:min-h-[38px] items-center rounded-xl px-3 py-2 text-xs font-medium transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                      isCollapsed ? 'justify-center px-2' : 'gap-3'
                    } ${
                      isActive
                        ? 'bg-indigo-600 text-white font-semibold shadow-2xs dark:bg-indigo-600'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-transform ${
                        isActive
                          ? 'text-white'
                          : 'text-slate-500 group-hover:text-slate-900 dark:text-slate-400 dark:group-hover:text-slate-200'
                      }`}
                    />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Collapse Toggle for Desktop */}
      {onToggleCollapse && (
        <div className="hidden lg:block border-t border-slate-200/80 px-3 pt-3 dark:border-slate-800">
          <button
            type="button"
            onClick={onToggleCollapse}
            className={`flex w-full items-center rounded-xl p-2 text-xs text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/70 transition-colors ${
              isCollapsed ? 'justify-center' : 'justify-between px-3'
            }`}
          >
            {!isCollapsed && <span>Collapse Sidebar</span>}
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden lg:flex shrink-0 border-r border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/90 transition-all duration-200 ease-in-out ${
          isCollapsed ? 'w-16' : 'w-60'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Panel */}
      {isMobileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 lg:hidden bg-slate-950/60 backdrop-blur-xs flex"
          onClick={(e) => {
            if (e.target === e.currentTarget && onCloseMobile) onCloseMobile();
          }}
        >
          <div className="w-72 max-w-[80vw] h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5 dark:border-slate-800">
              <span className="font-display font-bold text-slate-900 dark:text-slate-100">
                Al_Helal AI Tools
              </span>
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Close navigation menu"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-hidden transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{sidebarContent}</div>
          </div>
        </div>
      )}
    </>
  );
};
