import React, { useState } from 'react';
import {
  Layers,
  Search,
  Plus,
  Play,
  Copy,
  Trash2,
  Edit3,
  Globe,
  Lock,
  Sparkles,
  ShoppingBag,
  Instagram,
  Youtube,
  UserCheck,
  Check,
} from 'lucide-react';
import { TemplateDoc, firestore } from '../../firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface DashboardTemplatesProps {
  templates: TemplateDoc[];
  setActiveView: (view: string) => void;
  onRefreshData?: () => void;
}

// Built-in presets for quick productivity
const BUILTIN_PRESETS: TemplateDoc[] = [
  {
    templateId: 'preset_amazon_square',
    userId: 'system',
    name: 'Amazon E-Commerce Hero (1:1)',
    description: 'Square 2000x2000 pure white background cutout compliant with Amazon & Shopify requirements.',
    category: 'E-Commerce',
    toolId: 'ecommerce-staging',
    settings: { aspectRatio: '1:1', width: 2000, height: 2000, background: 'pure_white', format: 'png' },
    visibility: 'PUBLIC',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    templateId: 'preset_instagram_story',
    userId: 'system',
    name: 'Instagram & TikTok Vertical (9:16)',
    description: 'High-impact 1080x1920 vertical canvas tailored for stories, reels, and mobile feeds.',
    category: 'Social Media',
    toolId: 'image-generator',
    settings: { aspectRatio: '9:16', width: 1080, height: 1920, style: 'Cinematic Vibrance' },
    visibility: 'PUBLIC',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    templateId: 'preset_youtube_thumb',
    userId: 'system',
    name: 'YouTube Video Thumbnail (16:9)',
    description: 'Vibrant 1280x720 cinematic 16:9 frame with high clarity, punchy contrast, and bold focus.',
    category: 'Marketing',
    toolId: 'photo-enhancer',
    settings: { aspectRatio: '16:9', width: 1280, height: 720, clarity: 'high' },
    visibility: 'PUBLIC',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    templateId: 'preset_passport_standard',
    userId: 'system',
    name: 'Standard Passport Photo (2x2")',
    description: 'Official biometric passport & visa sizing with light neutral background and head centering.',
    category: 'Identity',
    toolId: 'passport-photo-maker',
    settings: { dimensions: '2x2 in', background: 'white', dpi: 300 },
    visibility: 'PUBLIC',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    templateId: 'preset_linkedin_headshot',
    userId: 'system',
    name: 'Executive Studio Headshot (1:1)',
    description: 'Warm studio backlight with subtle bokeh blur and natural facial detail enhancement.',
    category: 'Portraits',
    toolId: 'face-restoration',
    settings: { style: 'Corporate Studio', bokeh: true },
    visibility: 'PUBLIC',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
];

export const DashboardTemplates: React.FC<DashboardTemplatesProps> = ({
  templates,
  setActiveView,
  onRefreshData,
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // New Template form
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCat, setNewCat] = useState('Social Media');
  const [newTool, setNewTool] = useState('image-generator');
  const [newVisibility, setNewVisibility] = useState<'PRIVATE' | 'PUBLIC'>('PRIVATE');

  const allTemplates = [...BUILTIN_PRESETS, ...templates];

  const filtered = allTemplates.filter((t) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!t.name.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) return false;
    }
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    return true;
  });

  const categories = Array.from(new Set(allTemplates.map((t) => t.category).filter(Boolean)));

  const handleUseTemplate = (t: TemplateDoc) => {
    sessionStorage.setItem('pf_prefill_template', JSON.stringify(t.settings));
    setActiveView(`tool:${t.toolId}`);
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTitle.trim()) return;

    const newDoc: TemplateDoc = {
      templateId: `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: user.uid,
      name: newTitle.trim(),
      description: newDesc.trim() || 'Custom creative preset',
      category: newCat,
      toolId: newTool,
      settings: { createdBy: user.displayName || 'User' },
      visibility: newVisibility,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await firestore.saveTemplate(newDoc);
      success('Template created successfully');
      setIsCreateOpen(false);
      setNewTitle('');
      setNewDesc('');
      if (onRefreshData) onRefreshData();
    } catch {
      error('Failed to create template');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (window.confirm('Delete this template?')) {
      try {
        await firestore.deleteTemplate(id);
        success('Template removed');
        if (onRefreshData) onRefreshData();
      } catch {
        error('Failed to delete template');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <span>Creative Templates & Presets</span>
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Standard aspect ratios, e-commerce specs, and customizable production presets.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Template</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search templates and presets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 focus:outline-hidden"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((t) => {
          const isSystem = t.userId === 'system';
          return (
            <div
              key={t.templateId}
              className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 transition-all"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] mb-2">
                  <span className="rounded-md bg-indigo-50 px-2 py-0.5 font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400">
                    {t.category}
                  </span>
                  <span className="flex items-center gap-1 text-slate-400 text-[10px]">
                    {t.visibility === 'PUBLIC' ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                    <span>{isSystem ? 'Verified Preset' : t.visibility}</span>
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{t.name}</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {t.description}
                </p>

                {t.settings && (
                  <div className="mt-3 flex flex-wrap gap-1 text-[10px] font-mono text-slate-400">
                    {Object.entries(t.settings).slice(0, 3).map(([k, v]) => (
                      <span key={k} className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">
                        {k}: {String(v)}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleUseTemplate(t)}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-colors"
                >
                  <Play className="h-3 w-3 fill-white" />
                  <span>Use Template</span>
                </button>

                {!isSystem && (
                  <button
                    type="button"
                    onClick={() => handleDeleteTemplate(t.templateId)}
                    className="p-1.5 text-slate-400 hover:text-rose-600"
                    title="Delete template"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Template Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Create New Custom Template</h3>
            <p className="text-xs text-slate-500 mt-1">Save reusable workflow configurations and dimensions.</p>

            <form onSubmit={handleCreateTemplate} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Template Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Etsy Banner 1200x300"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Description</label>
                <input
                  type="text"
                  placeholder="Short explanation of specs"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Category</label>
                  <select
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="Social Media">Social Media</option>
                    <option value="E-Commerce">E-Commerce</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Identity">Identity</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Associated Tool</label>
                  <select
                    value={newTool}
                    onChange={(e) => setNewTool(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="image-generator">AI Image Generator</option>
                    <option value="background-remover">Background Remover</option>
                    <option value="photo-enhancer">Photo Enhancer</option>
                    <option value="passport-photo-maker">Passport Maker</option>
                    <option value="ecommerce-staging">E-Commerce Staging</option>
                    <option value="image-editor">Image Editor</option>
                  </select>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
