import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
  Sparkles,
  Download,
  Trash2,
  Copy,
  FolderPlus,
  RefreshCw,
  Palette,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Cpu,
} from 'lucide-react';
import { HistoryItem } from '../../types';
import { ProjectDoc, firestore } from '../../firebase/firestore';
import { useHistory } from '../../context/HistoryContext';
import { useToast } from '../../context/ToastContext';

interface DashboardHistoryProps {
  history: HistoryItem[];
  projects: ProjectDoc[];
  setActiveView: (view: string) => void;
  onPreviewImage: (imageUrl: string, title?: string) => void;
  onRefreshData?: () => void;
}

export const DashboardHistory: React.FC<DashboardHistoryProps> = ({
  history,
  projects,
  setActiveView,
  onPreviewImage,
  onRefreshData,
}) => {
  const { removeHistoryItem } = useHistory();
  const { success, error } = useToast();

  const [searchPrompt, setSearchPrompt] = useState('');
  const [filterTool, setFilterTool] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Save to project modal
  const [savingItem, setSavingItem] = useState<HistoryItem | null>(null);
  const [targetProjectId, setTargetProjectId] = useState<string>('');

  // Parameters modal
  const [viewingParamsItem, setViewingParamsItem] = useState<HistoryItem | null>(null);

  const filteredHistory = history.filter((item) => {
    if (searchPrompt) {
      const q = searchPrompt.toLowerCase();
      const matches =
        (item.prompt && item.prompt.toLowerCase().includes(q)) ||
        (item.tool && item.tool.toLowerCase().includes(q));
      if (!matches) return false;
    }
    if (filterTool !== 'all' && item.tool !== filterTool) return false;
    return true;
  });

  const uniqueTools = Array.from(new Set(history.map((h) => h.tool).filter(Boolean)));

  const handleCopyPrompt = (prompt?: string) => {
    if (!prompt) return;
    navigator.clipboard.writeText(prompt);
    success('Prompt copied to clipboard');
  };

  const handleCreateVariation = (item: HistoryItem) => {
    if (item.prompt) {
      sessionStorage.setItem('pf_prefill_prompt', item.prompt);
    }
    setActiveView('tool:image-generator');
  };

  const handleOpenInEditor = () => {
    setActiveView('tool:image-editor');
  };

  const handleDownload = (item: HistoryItem) => {
    const imgUrl = item.processedImage || item.url;
    if (!imgUrl) return;
    const a = document.createElement('a');
    a.href = imgUrl;
    a.download = `pixelforge_${item.id}.png`;
    a.click();
  };

  const handleDelete = (id: string) => {
    removeHistoryItem(id);
    success('Generation record removed');
    if (onRefreshData) onRefreshData();
  };

  const handleSaveToProject = async () => {
    if (!savingItem || !targetProjectId) return;
    const proj = projects.find((p) => p.projectId === targetProjectId);
    if (!proj) return;

    try {
      await firestore.setProject({
        ...proj,
        processedImage: savingItem.processedImage || savingItem.url,
        updatedAt: new Date().toISOString(),
      });
      success(`Saved result to project "${proj.name}"`);
      setSavingItem(null);
      if (onRefreshData) onRefreshData();
    } catch {
      error('Failed to attach result to project');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <History className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <span>AI Generation History</span>
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Chronological audit timeline of multimodal model inferences, prompt iterations, and visual outputs.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setActiveView('tool:image-generator')}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-colors"
        >
          <Sparkles className="h-4 w-4" />
          <span>New Generation</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search prompt text or tool..."
            value={searchPrompt}
            onChange={(e) => setSearchPrompt(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {uniqueTools.length > 0 && (
            <select
              value={filterTool}
              onChange={(e) => setFilterTool(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 focus:outline-hidden"
            >
              <option value="all">All AI Tools</option>
              {uniqueTools.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}

          <span className="text-xs text-slate-400 font-mono">
            {filteredHistory.length} Total Generations
          </span>
        </div>
      </div>

      {/* Timeline List */}
      {filteredHistory.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900">
          <History className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
          <h3 className="mt-4 text-sm font-bold text-slate-800 dark:text-slate-200">No generation history</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            {searchPrompt || filterTool !== 'all'
              ? 'No generations match the filter criteria. Clear search to see all records.'
              : 'Synthesize images or perform visual enhancements to see your AI operation history timeline.'}
          </p>
          <button
            type="button"
            onClick={() => setActiveView('tool:image-generator')}
            className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700"
          >
            Launch Image Generator
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((item) => {
            const imgUrl = item.processedImage || item.url || '';
            return (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 transition-all"
              >
                {/* Left: Thumbnail & Details */}
                <div className="flex items-start gap-4 min-w-0">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => onPreviewImage(imgUrl, item.tool)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        onPreviewImage(imgUrl, item.tool);
                      }
                    }}
                    className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-950 cursor-pointer"
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

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                        {item.tool || 'AI Synthesis'}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Completed</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(item.createdAt || Date.now()).toLocaleDateString()}{' '}
                        {new Date(item.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {item.prompt ? (
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">
                        &quot;{item.prompt}&quot;
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No text prompt (Visual transformation)</p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span className="font-mono">ID: {item.id}</span>
                      <span>·</span>
                      <span>Engine: Gemini Multimodal</span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 self-end sm:self-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
                  {item.prompt && (
                    <button
                      type="button"
                      onClick={() => handleCopyPrompt(item.prompt)}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 flex items-center gap-1"
                      title="Copy Prompt"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleCreateVariation(item)}
                    className="rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 flex items-center gap-1"
                    title="Create Variation"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Variation</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownload(item)}
                    className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Download Result"
                  >
                    <Download className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setSavingItem(item)}
                    className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Save to Project"
                  >
                    <FolderPlus className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    title="Delete record"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Save to Project Modal */}
      {savingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Save Result to Project</h3>
            <p className="text-xs text-slate-500 mt-1">
              Select which creative project to store this generated asset inside.
            </p>

            <select
              value={targetProjectId}
              onChange={(e) => setTargetProjectId(e.target.value)}
              className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="">-- Choose Project --</option>
              {projects.map((p) => (
                <option key={p.projectId} value={p.projectId}>
                  {p.name} ({p.tool})
                </option>
              ))}
            </select>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSavingItem(null)}
                className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!targetProjectId}
                onClick={handleSaveToProject}
                className="rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                Save Asset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
