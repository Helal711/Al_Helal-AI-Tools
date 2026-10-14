import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Shield,
  Wand2,
  Cpu,
  Boxes,
  Activity,
  BarChart3,
  DollarSign,
  AlertOctagon,
  Layers,
  Bell,
  Settings,
  Flag,
  FileText,
  HeartPulse,
  AlertTriangle,
  Database,
  User,
  LogOut,
  Menu,
  X,
  Search,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type AdminSection =
  | 'overview'
  | 'users'
  | 'roles'
  | 'tools'
  | 'providers'
  | 'models'
  | 'jobs'
  | 'analytics'
  | 'costs'
  | 'content'
  | 'templates'
  | 'notifications'
  | 'settings'
  | 'feature-flags'
  | 'audit-logs'
  | 'system-health'
  | 'errors'
  | 'retention'
  | 'profile';

interface AdminLayoutProps {
  currentSection: AdminSection;
  onNavigateSection: (section: AdminSection) => void;
  setActiveView: (view: string) => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentSection,
  onNavigateSection,
  setActiveView,
  children,
}) => {
  const { user, isSuperAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navGroups = [
    {
      title: 'Core Administration',
      items: [
        { id: 'overview' as AdminSection, label: 'Control Center', icon: LayoutDashboard },
        { id: 'users' as AdminSection, label: 'User Management', icon: Users },
        { id: 'roles' as AdminSection, label: 'Roles & Permissions', icon: Shield },
        { id: 'audit-logs' as AdminSection, label: 'Security Audit Logs', icon: FileText },
      ],
    },
    {
      title: 'AI Pipeline & Models',
      items: [
        { id: 'tools' as AdminSection, label: 'AI Tool Controls', icon: Wand2 },
        { id: 'providers' as AdminSection, label: 'Provider Registry', icon: Cpu },
        { id: 'models' as AdminSection, label: 'Model Directory', icon: Boxes },
        { id: 'jobs' as AdminSection, label: 'Job Monitoring', icon: Activity },
      ],
    },
    {
      title: 'Operations & Performance',
      items: [
        { id: 'analytics' as AdminSection, label: 'Usage Analytics', icon: BarChart3 },
        { id: 'costs' as AdminSection, label: 'Cost Monitoring', icon: DollarSign },
        { id: 'system-health' as AdminSection, label: 'System Health', icon: HeartPulse },
        { id: 'errors' as AdminSection, label: 'Error Diagnostics', icon: AlertTriangle },
        { id: 'retention' as AdminSection, label: 'Data Retention', icon: Database },
      ],
    },
    {
      title: 'Content & Moderation',
      items: [
        { id: 'content' as AdminSection, label: 'Content Moderation', icon: AlertOctagon },
        { id: 'templates' as AdminSection, label: 'Official Templates', icon: Layers },
        { id: 'notifications' as AdminSection, label: 'Announcements', icon: Bell },
      ],
    },
    {
      title: 'System & Configuration',
      items: [
        { id: 'settings' as AdminSection, label: 'System Settings', icon: Settings },
        { id: 'feature-flags' as AdminSection, label: 'Feature Flags', icon: Flag },
        { id: 'profile' as AdminSection, label: 'Admin Profile', icon: User },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <span className="font-display font-extrabold text-sm tracking-tight text-white hidden sm:inline">
              PixelForge <span className="text-indigo-400">Control Center</span>
            </span>
          </div>

          <span className="rounded-full bg-indigo-950/80 border border-indigo-800/80 px-2.5 py-0.5 text-[10px] font-bold text-indigo-300">
            {isSuperAdmin ? 'SUPER ADMIN' : 'ADMINISTRATOR'}
          </span>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveView('dashboard')}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <span>User Studio</span>
            <ExternalLink className="h-3 w-3" />
          </button>

          <div className="h-4 w-px bg-slate-800" />

          <button
            type="button"
            onClick={() => onNavigateSection('profile')}
            className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-xs">
              {user?.displayName ? user.displayName[0].toUpperCase() : 'A'}
            </div>
            <span className="hidden md:inline">{user?.displayName || 'Admin'}</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex flex-1 min-h-[calc(100vh-3.5rem)]">
        {/* Sidebar Desktop */}
        <aside
          className={`fixed inset-y-14 left-0 z-30 w-64 border-r border-slate-800 bg-slate-900/95 overflow-y-auto p-4 transition-transform lg:static lg:translate-x-0 ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <nav className="space-y-6 text-xs">
            {navGroups.map((group) => (
              <div key={group.title} className="space-y-1.5">
                <span className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {group.title}
                </span>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isSelected = currentSection === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onNavigateSection(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 font-medium transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs font-bold'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="mt-8 border-t border-slate-800/80 pt-4">
            <button
              type="button"
              onClick={() => {
                logout();
                setActiveView('home');
              }}
              className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-950/30 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Exit Admin Console</span>
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto max-w-7xl">
          {children}
        </main>
      </div>
    </div>
  );
};
