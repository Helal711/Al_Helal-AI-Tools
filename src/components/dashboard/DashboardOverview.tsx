import React, { useState } from 'react';
import {
  Sparkles,
  Scissors,
  Maximize2,
  Eraser,
  Palette,
  UploadCloud,
  FolderPlus,
  ArrowRight,
  Download,
  Trash2,
  Edit3,
  Copy,
  Star,
  ExternalLink,
  Layers,
  Clock,
  HardDrive,
  Activity,
  CheckCircle2,
  Cpu,
  Eye,
  RefreshCw,
  FolderKanban,
  Zap,
} from 'lucide-react';
import { ProjectDoc, FileDoc, firestore } from '../../firebase/firestore';
import { HistoryItem } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { UsageCheckResult } from '../../services/usageService';

interface DashboardOverviewProps {
  projects: ProjectDoc[];
  history: HistoryItem[];
  userFiles: FileDoc[];
  usageInfo: UsageCheckResult;
  setActiveView: (view: string) => void;
  onOpenProject: (projectId: string) => void;
  onOpenNewProjectModal: () => void;
  onOpenUploadModal: () => void;
  onPreviewImage: (imageUrl: string, title?: string) => void;
  onRefreshData?: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  projects,
  history,
  userFiles,
  usageInfo,
  setActiveView,
  onOpenProject,
  onOpenNewProjectModal,
  onOpenUploadModal,
  onPreviewImage,
  onRefreshData,
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();

  // Rename modal state
  const [renamingProject, setRenamingProject] = useState<ProjectDoc | null>(null);
  const [newProjectName, setNewProjectName] = useState('');

  // Quick action buttons
  const quickActions = [
    {
      id: 'gen-image',
      title: 'Create AI Image',
      desc: 'Synthesize photorealistic art & concepts',
      icon: Sparkles,
      color: 'indigo',
      action: () => setActiveView('tool:image-generator'),
    },
    {
      id: 'bg-remove',
      title: 'Remove Background',
      desc: 'Isolate subjects with 1-click cutout',
      icon: Scissors,
      color: 'violet',
      action: () => setActiveView('tool:background-remover'),
    },
    {
      id: 'enhance',
      title: 'Enhance Image',
      desc: 'Sharpen details & reconstruct faces',
      icon: Maximize2,
      color: 'cyan',
      action: () => setActiveView('tool:photo-enhancer'),
    },
    {
      id: 'upscale',
      title: 'Upscale Image',
      desc: 'Super-resolution 2x/4x magnification',
      icon: Zap,
      color: 'amber',
      action: () => setActiveView('tool:image-upscaler'),
    },
    {
      id: 'object-remove',
      title: 'Remove Object',
      desc: 'Inpaint & erase unwanted items',
      icon: Eraser,
      color: 'rose',
      action: () => setActiveView('tool:object-remover'),
    },
    {
      id: 'editor',
      title: 'Open Image Editor',
      desc: 'Layers, crop, filters & adjustments',
      icon: Palette,
      color: 'emerald',
      action: () => setActiveView('tool:image-editor'),
    },
    {
      id: 'upload',
      title: 'Upload Image',
      desc: 'Add assets to personal cloud storage',
      icon: UploadCloud,
      color: 'blue',
      action: onOpenUploadModal,
    },
    {
      id: 'create-proj',
      title: 'Create Project',
      desc: 'Start a new organized studio workspace',
      icon: FolderPlus,
      color: 'purple',
      action: onOpenNewProjectModal,
    },
  ];

  // Actions for recent projects
  const handleToggleFavoriteProject = async (project: ProjectDoc) => {
    try {
      await firestore.setProject({
        ...project,
        favorite: !project.favorite,
        updatedAt: new Date().toISOString(),
      });
      success(project.favorite ? 'Removed from favorites' : 'Pinned to favorites');
      if (onRefreshData) onRefreshData();
    } catch {
      error('Failed to update favorite status');
    }
  };

  const handleDuplicateProject = async (project: ProjectDoc) => {
    try {
      const duplicated = await firestore.duplicateProject(project.projectId);
      if (duplicated) {
        success(`Project duplicated as "${duplicated.name}"`);
        if (onRefreshData) onRefreshData();
      }
    } catch {
      error('Failed to duplicate project');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await firestore.deleteProject(projectId);
        success('Project deleted');
        if (onRefreshData) onRefreshData();
      } catch {
        error('Failed to delete project');
      }
    }
  };

  const handleStartRename = (project: ProjectDoc) => {
    setRenamingProject(project);
    setNewProjectName(project.name);
  };

  const handleSaveRename = async () => {
    if (!renamingProject || !newProjectName.trim()) return;
    try {
      await firestore.setProject({
        ...renamingProject,
        name: newProjectName.trim(),
        updatedAt: new Date().toISOString(),
      });
      success('Project renamed');
      setRenamingProject(null);
      if (onRefreshData) onRefreshData();
    } catch {
      error('Failed to rename project');
    }
  };

  // Recent Activity Generation from user events
  const recentActivities = [
    ...projects.map((p) => ({
      id: `act_p_${p.projectId}`,
      title: `Project "${p.name}" updated`,
      type: 'project',
      date: p.updatedAt || p.createdAt,
      icon: FolderKanban,
      color: 'text-indigo-600 dark:text-indigo-400',
    })),
    ...history.slice(0, 5).map((h) => ({
      id: `act_h_${h.id}`,
      title: `AI operation executed: ${h.tool || 'Visual Transformation'}`,
      type: 'generation',
      date: h.createdAt || new Date().toISOString(),
      icon: Sparkles,
      color: 'text-emerald-600 dark:text-emerald-400',
    })),
    ...userFiles.slice(0, 5).map((f) => ({
      id: `act_f_${f.fileId}`,
      title: `Asset stored: ${f.name}`,
      type: 'file',
      date: f.createdAt,
      icon: UploadCloud,
      color: 'text-blue-600 dark:text-blue-400',
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  // Storage calculation
  const totalSizeBytes = userFiles.reduce((acc, f) => acc + (f.size || 0), 0);
  const storageUsedMB = (totalSizeBytes / (1024 * 1024)).toFixed(1);

  return (
    <div className="space-y-8">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-indigo-50/80 via-white to-violet-50/50 p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/30">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/60 bg-white/80 px-3 py-1 text-xs font-semibold text-indigo-700 shadow-2xs backdrop-blur-sm dark:border-indigo-900/60 dark:bg-slate-800/80 dark:text-indigo-300">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            <span>Unified AI Creative Workspace</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Welcome back{user?.displayName ? `, ${user.displayName}` : ''}!
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Continue creating, enhancing, and organizing your visual content with high-precision AI engines.
          </p>
        </div>

        {/* Decorative corner accent */}
        <div className="pointer-events-none absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl dark:bg-indigo-600/15" />
      </div>

      {/* 2. Technical Usage & Processing Limits Summary Card (NO CREDITS) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Cpu className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>Technical Usage & Service Limits</span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Transparent service capacity monitoring. Al_Helal AI Tools offers unlimited free creative access within dynamic fair-use rate limits.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 self-start sm:self-auto">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Service Limits: Normal & Unrestricted</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Daily Processing Jobs</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-mono text-xl font-bold text-slate-900 dark:text-slate-100">
                {usageInfo.count}
              </span>
              <span className="text-xs text-slate-400 font-mono">/ {usageInfo.limit} limit</span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (usageInfo.count / (usageInfo.limit || 1)) * 100)}%`,
                }}
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Rate Limit Status</span>
            <p className="mt-1 font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {usageInfo.remaining} available
            </p>
            <p className="mt-1 text-[10px] text-slate-400">Resets daily at 00:00 UTC</p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Cloud Storage Staged</span>
            <p className="mt-1 font-mono text-xl font-bold text-slate-900 dark:text-slate-100">
              {storageUsedMB} MB
            </p>
            <p className="mt-1 text-[10px] text-slate-400">{userFiles.length} indexed files</p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Creative Assets</span>
            <p className="mt-1 font-mono text-xl font-bold text-indigo-600 dark:text-indigo-400">
              {projects.length + history.length}
            </p>
            <p className="mt-1 text-[10px] text-slate-400">
              {projects.length} projects · {history.length} AI results
            </p>
          </div>
        </div>
      </div>

      {/* 3. Quick Actions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Quick Actions
          </h2>
          <button
            type="button"
            onClick={() => setActiveView('tools')}
            className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400 flex items-center gap-1"
          >
            <span>Browse All Tools</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3.5">
          {quickActions.map((qa) => {
            const Icon = qa.icon;
            return (
              <button
                key={qa.id}
                type="button"
                onClick={qa.action}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 text-left shadow-2xs hover:border-indigo-400 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-all duration-150"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-950/60 dark:text-indigo-400 transition-colors mb-3">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {qa.title}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                    {qa.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Recent Projects & Recent AI Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Recent Projects (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>Recent Projects</span>
            </h2>
            <button
              type="button"
              onClick={() => setActiveView('dashboard/projects')}
              className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400 flex items-center gap-1"
            >
              <span>View all ({projects.length})</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-800">
              <FolderKanban className="mx-auto h-9 w-9 text-slate-300 dark:text-slate-700" />
              <p className="mt-2 text-xs font-bold text-slate-700 dark:text-slate-300">No projects yet</p>
              <p className="mt-1 text-[11px] text-slate-500 max-w-xs mx-auto">
                Create a project to organize your visual assets, versions, and generated exports.
              </p>
              <button
                type="button"
                onClick={onOpenNewProjectModal}
                className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
              >
                + Create First Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {projects.slice(0, 4).map((p) => (
                <div
                  key={p.projectId}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 transition-all"
                >
                  <div>
                    {/* Thumbnail preview */}
                    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-950/80 mb-3 border border-slate-100 dark:border-slate-800">
                      {p.processedImage || p.originalImage ? (
                        <img
                          src={p.processedImage || p.originalImage}
                          alt={p.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-600">
                          <Layers className="h-6 w-6" />
                        </div>
                      )}
                      {p.favorite && (
                        <span className="absolute top-2 right-2 rounded-full bg-amber-500/90 p-1 text-white shadow-xs">
                          <Star className="h-3 w-3 fill-white" />
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400 truncate max-w-[140px]">
                        {p.tool || 'Studio Project'}
                      </span>
                      <span className="font-mono">
                        {new Date(p.updatedAt || p.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="mt-1 text-xs font-bold text-slate-900 dark:text-slate-100 truncate" title={p.name}>
                      {p.name}
                    </h3>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => onOpenProject(p.projectId)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
                    >
                      <span>Open</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleToggleFavoriteProject(p)}
                        title={p.favorite ? 'Unfavorite' : 'Favorite'}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Star className={`h-3.5 w-3.5 ${p.favorite ? 'text-amber-500 fill-amber-500' : ''}`} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartRename(p)}
                        title="Rename"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicateProject(p)}
                        title="Duplicate"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProject(p.projectId)}
                        title="Delete"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Recent AI Results (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Recent AI Results</span>
            </h2>
            <button
              type="button"
              onClick={() => setActiveView('dashboard/history')}
              className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400 flex items-center gap-1"
            >
              <span>History ({history.length})</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {history.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-800">
              <Sparkles className="mx-auto h-9 w-9 text-slate-300 dark:text-slate-700" />
              <p className="mt-2 text-xs font-bold text-slate-700 dark:text-slate-300">No generated visuals</p>
              <p className="mt-1 text-[11px] text-slate-500 max-w-xs mx-auto">
                Generate or enhance an image to view recent outputs and variations here.
              </p>
              <button
                type="button"
                onClick={() => setActiveView('tool:image-generator')}
                className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
              >
                Launch AI Generator
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {history.slice(0, 4).map((item) => {
                const imgUrl = item.processedImage || item.url || '';
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 transition-all"
                  >
                    {/* Thumbnail */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => onPreviewImage(imgUrl, item.tool)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          onPreviewImage(imgUrl, item.tool);
                        }
                      }}
                      className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-950 cursor-pointer"
                    >
                      <img
                        src={imgUrl}
                        alt={item.tool}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                        <Eye className="h-4 w-4" />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 truncate max-w-[120px]">
                          {item.tool || 'AI Generation'}
                        </span>
                        <span className="text-slate-400 font-mono">
                          {new Date(item.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-800 dark:text-slate-200 truncate font-medium">
                        {item.prompt ? `"${item.prompt}"` : 'Visual Enhancement'}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <a
                          href={imgUrl}
                          download={`pixelforge_${item.id}.png`}
                          className="text-[11px] font-semibold text-slate-600 hover:text-indigo-600 dark:text-slate-400 flex items-center gap-1"
                        >
                          <Download className="h-3 w-3" />
                          <span>Save</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => setActiveView('tool:image-editor')}
                          className="text-[11px] font-semibold text-indigo-600 hover:underline dark:text-indigo-400 flex items-center gap-1"
                        >
                          <Palette className="h-3 w-3" />
                          <span>Editor</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 5. Recent Activity Timeline */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-4">
          <Activity className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <span>Recent Studio Activity</span>
        </h2>

        {recentActivities.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">
            No recent activity recorded. Create a project or run an AI tool to view your event timeline.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentActivities.map((act) => {
              const Icon = act.icon;
              return (
                <div key={act.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                      <Icon className={`h-4 w-4 ${act.color}`} />
                    </div>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{act.title}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(act.date).toLocaleDateString()} {new Date(act.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Inline Rename Project Modal */}
      {renamingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Rename Project</h3>
            <p className="text-xs text-slate-500 mt-1">Enter a new title for this studio project.</p>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:outline-hidden"
              autoFocus
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRenamingProject(null)}
                className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRename}
                className="rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"
              >
                Save Name
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
