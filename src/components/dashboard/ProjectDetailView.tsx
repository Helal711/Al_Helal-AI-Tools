import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Layers,
  Sparkles,
  Download,
  Trash2,
  Edit3,
  Star,
  ExternalLink,
  Sliders,
  Check,
  Maximize2,
  FileCode,
  Share2,
  Palette,
  Eye,
  Copy,
} from 'lucide-react';
import { ProjectDoc, firestore } from '../../firebase/firestore';
import { useToast } from '../../context/ToastContext';

interface ProjectDetailViewProps {
  project: ProjectDoc;
  onBack: () => void;
  setActiveView: (view: string) => void;
  onRefreshData?: () => void;
  onPreviewImage: (imageUrl: string, title?: string) => void;
}

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
  project,
  onBack,
  setActiveView,
  onRefreshData,
  onPreviewImage,
}) => {
  const { success, error } = useToast();
  const [viewMode, setViewMode] = useState<'compare' | 'split' | 'processed' | 'original'>('compare');
  const [sliderPos, setSliderPos] = useState(50);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(project.name);

  const originalImg = project.originalImage || project.originalFile || '';
  const processedImg = project.processedImage || project.resultFile || originalImg;

  const handleToggleFavorite = async () => {
    try {
      await firestore.setProject({
        ...project,
        favorite: !project.favorite,
        updatedAt: new Date().toISOString(),
      });
      success(project.favorite ? 'Removed from favorites' : 'Marked as favorite');
      if (onRefreshData) onRefreshData();
    } catch {
      error('Failed to update favorite status');
    }
  };

  const handleSaveRename = async () => {
    if (!newName.trim()) return;
    try {
      await firestore.setProject({
        ...project,
        name: newName.trim(),
        updatedAt: new Date().toISOString(),
      });
      setIsRenaming(false);
      success('Project renamed successfully');
      if (onRefreshData) onRefreshData();
    } catch {
      error('Failed to rename project');
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete project "${project.name}"?`)) {
      try {
        await firestore.deleteProject(project.projectId);
        success('Project deleted');
        if (onRefreshData) onRefreshData();
        onBack();
      } catch {
        error('Failed to delete project');
      }
    }
  };

  const handleDownloadSingle = (url: string, suffix: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/\s+/g, '_')}_${suffix}.png`;
    a.click();
  };

  const handleExportMetadata = () => {
    const jsonStr = JSON.stringify(project, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/\s+/g, '_')}_metadata.json`;
    a.click();
    URL.revokeObjectURL(url);
    success('Project metadata exported as JSON');
  };

  const handleOpenInEditor = () => {
    setActiveView('tool:image-editor');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 shadow-2xs transition-colors"
            title="Back to all projects"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              {isRenaming ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-base font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleSaveRename}
                    className="rounded-lg bg-indigo-600 p-1.5 text-white hover:bg-indigo-700"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                    {project.name}
                  </h1>
                  <button
                    type="button"
                    onClick={() => setIsRenaming(true)}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    title="Rename"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400">
                {project.tool}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
              {project.updatedAt && (
                <span>· Updated: {new Date(project.updatedAt).toLocaleDateString()}</span>
              )}
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleFavorite}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold shadow-2xs transition-colors ${
              project.favorite
                ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            <Star className={`h-3.5 w-3.5 ${project.favorite ? 'fill-amber-500 text-amber-500' : ''}`} />
            <span>{project.favorite ? 'Favorited' : 'Favorite'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenInEditor}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-colors"
          >
            <Palette className="h-3.5 w-3.5" />
            <span>Open in Editor</span>
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-600 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400 transition-colors"
            title="Delete project"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Comparison & Asset Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Interactive Visual Canvas (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Mode Selector */}
          <div className="flex items-center justify-between">
            <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800 text-xs">
              {(
                [
                  { id: 'compare', label: 'Interactive Slider' },
                  { id: 'split', label: 'Side by Side' },
                  { id: 'processed', label: 'Processed Result' },
                  { id: 'original', label: 'Original Source' },
                ] as const
              ).map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setViewMode(mode.id)}
                  className={`rounded-lg px-3 py-1 font-semibold transition-all ${
                    viewMode === mode.id
                      ? 'bg-white text-indigo-700 shadow-2xs dark:bg-slate-900 dark:text-indigo-300'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => onPreviewImage(processedImg, project.name)}
              className="text-xs font-semibold text-slate-600 hover:text-indigo-600 dark:text-slate-400 flex items-center gap-1"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span>Full Screen</span>
            </button>
          </div>

          {/* Canvas Box */}
          <div className="relative min-h-[420px] rounded-3xl border border-slate-200 bg-slate-950 overflow-hidden flex items-center justify-center p-4 dark:border-slate-800 shadow-sm">
            {/* 1. Compare Slider View */}
            {viewMode === 'compare' && (
              <div className="relative w-full h-[400px] select-none overflow-hidden rounded-2xl">
                {/* Background (Original Image) */}
                {originalImg ? (
                  <img
                    src={originalImg}
                    alt="Original"
                    className="absolute inset-0 h-full w-full object-contain pointer-events-none"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs">
                    No original source preview
                  </div>
                )}

                {/* Foreground (Processed Image clipped) */}
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                  style={{ width: `${sliderPos}%` }}
                >
                  <img
                    src={processedImg}
                    alt="Processed"
                    className="absolute inset-0 h-full w-full object-contain"
                    style={{
                      width: '100%',
                      maxWidth: 'none',
                    }}
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Vertical Divider Line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.8)] pointer-events-none"
                  style={{ left: `${sliderPos}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-indigo-600 shadow-lg pointer-events-auto cursor-ew-resize">
                    <Sliders className="h-4 w-4 rotate-90" />
                  </div>
                </div>

                {/* Interactive Slider Input Overlay */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderPos}
                  onChange={(e) => setSliderPos(Number(e.target.value))}
                  className="absolute inset-0 opacity-0 cursor-ew-resize z-20 w-full h-full"
                  aria-label="Image comparison slider"
                />

                {/* Labels */}
                <span className="absolute top-3 left-3 rounded-lg bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-wider backdrop-blur-xs pointer-events-none">
                  Processed
                </span>
                <span className="absolute top-3 right-3 rounded-lg bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-wider backdrop-blur-xs pointer-events-none">
                  Original
                </span>
              </div>
            )}

            {/* 2. Side by Side Split View */}
            {viewMode === 'split' && (
              <div className="grid grid-cols-2 gap-4 w-full h-[400px]">
                <div className="relative rounded-2xl bg-black/40 overflow-hidden flex flex-col items-center justify-center">
                  <span className="absolute top-2 left-2 z-10 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                    Original
                  </span>
                  {originalImg && (
                    <img src={originalImg} alt="Original" className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                  )}
                </div>
                <div className="relative rounded-2xl bg-black/40 overflow-hidden flex flex-col items-center justify-center">
                  <span className="absolute top-2 left-2 z-10 rounded-md bg-indigo-600/80 px-2 py-0.5 text-[10px] font-bold text-white">
                    Processed
                  </span>
                  <img src={processedImg} alt="Processed" className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                </div>
              </div>
            )}

            {/* 3. Processed Result Only */}
            {viewMode === 'processed' && (
              <div className="relative w-full h-[400px] flex items-center justify-center">
                <img src={processedImg} alt="Processed" className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
              </div>
            )}

            {/* 4. Original Source Only */}
            {viewMode === 'original' && (
              <div className="relative w-full h-[400px] flex items-center justify-center">
                {originalImg ? (
                  <img src={originalImg} alt="Original" className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <p className="text-xs text-slate-500">No original image recorded</p>
                )}
              </div>
            )}
          </div>

          {/* Quick Download Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => handleDownloadSingle(processedImg, 'processed')}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download Processed Image (PNG)</span>
            </button>
            {originalImg && (
              <button
                type="button"
                onClick={() => handleDownloadSingle(originalImg, 'original')}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Original Source</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleExportMetadata}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <FileCode className="h-3.5 w-3.5" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        {/* Right: Project Metadata & Assets List (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Metadata Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-100 pb-3 dark:border-slate-800">
              Project Specification
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Project ID</span>
                <span className="font-mono text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                  {project.projectId}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Primary AI Engine</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {project.tool}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Processing Status</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                  <Check className="h-3 w-3" />
                  <span>{project.status || 'Completed'}</span>
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Created At</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>

              {project.description && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block mb-1">Description</span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                    {project.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Associated Assets Gallery */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Project Assets ({[originalImg, processedImg].filter(Boolean).length})
            </h3>

            <div className="space-y-2">
              {processedImg && (
                <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-2 dark:border-slate-800">
                  <div className="h-12 w-12 rounded-lg bg-slate-950 overflow-hidden shrink-0">
                    <img src={processedImg} alt="Processed Asset" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="min-w-0 flex-1 text-xs">
                    <p className="font-bold text-slate-900 dark:text-slate-100 truncate">Result Asset</p>
                    <p className="text-[10px] text-emerald-600 font-semibold">Active High-Res Output</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownloadSingle(processedImg, 'result')}
                    className="p-1.5 text-slate-400 hover:text-indigo-600"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              )}

              {originalImg && (
                <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-2 dark:border-slate-800">
                  <div className="h-12 w-12 rounded-lg bg-slate-950 overflow-hidden shrink-0">
                    <img src={originalImg} alt="Original Asset" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="min-w-0 flex-1 text-xs">
                    <p className="font-bold text-slate-900 dark:text-slate-100 truncate">Source Asset</p>
                    <p className="text-[10px] text-slate-400">Input Reference File</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownloadSingle(originalImg, 'source')}
                    className="p-1.5 text-slate-400 hover:text-indigo-600"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
