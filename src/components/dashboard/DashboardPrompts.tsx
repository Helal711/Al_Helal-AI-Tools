import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  Plus,
  Copy,
  Star,
  Trash2,
  Edit3,
  Tag,
  ArrowRight,
  ExternalLink,
  Bookmark,
  Check,
} from 'lucide-react';
import { SavedPromptDoc, firestore } from '../../firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface DashboardPromptsProps {
  prompts: SavedPromptDoc[];
  setActiveView: (view: string) => void;
  onRefreshData?: () => void;
}

// Built-in high-quality inspiration prompts
const INSPIRATION_PROMPTS: SavedPromptDoc[] = [
  {
    promptId: 'insp_1',
    userId: 'system',
    name: 'Cinematic Cyberpunk Rain Alley',
    promptText:
      'Cinematic wide shot of a futuristic cyberpunk alley drenched in neon rain reflections, glowing holographic signage in cyan and magenta, atmospheric volumetric fog, high fidelity, 8k octane render.',
    category: 'Cinematic',
    tags: ['Cyberpunk', 'Neon', 'Cinematic', '8K'],
    favorite: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    promptId: 'insp_2',
    userId: 'system',
    name: 'Luxury Perfume Product Commercial Shoot',
    promptText:
      'Minimalist commercial product photography of an amber crystal perfume bottle on a smooth travertine stone pedestal, soft morning sunlight casting elegant caustics, clean neutral studio aesthetic, Vogue magazine.',
    category: 'Product',
    tags: ['Commercial', 'Product', 'Travertine', 'Studio'],
    favorite: false,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    promptId: 'insp_3',
    userId: 'system',
    name: 'Ethereal Forest Spirit Watercolor',
    promptText:
      'Intricate watercolor and gold leaf illustration of an ancient forest guardian elk crowned with glowing bioluminescent wisteria flowers, soft bleed paper texture, studio Ghibli aesthetic.',
    category: 'Illustration',
    tags: ['Watercolor', 'Gold Leaf', 'Fantasy', 'Ghibli'],
    favorite: false,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    promptId: 'insp_4',
    userId: 'system',
    name: 'Editorial Fashion Portrait in High Desert',
    promptText:
      'High fashion editorial portrait of a model in a sculptural silk trench coat standing amidst undulating terracotta desert sand dunes during golden hour, sharp depth of field, Hasselblad 100mm lens.',
    category: 'Portrait',
    tags: ['Editorial', 'Fashion', 'Desert', 'Golden Hour'],
    favorite: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
];

export const DashboardPrompts: React.FC<DashboardPromptsProps> = ({
  prompts,
  setActiveView,
  onRefreshData,
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // New prompt state
  const [title, setTitle] = useState('');
  const [promptText, setPromptText] = useState('');
  const [category, setCategory] = useState('Photorealistic');
  const [tagsInput, setTagsInput] = useState('');

  const allPrompts = [...INSPIRATION_PROMPTS, ...prompts];

  const filtered = allPrompts.filter((p) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchText =
        p.name.toLowerCase().includes(q) ||
        p.promptText.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchText) return false;
    }
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    return true;
  });

  const categories = Array.from(new Set(allPrompts.map((p) => p.category).filter(Boolean)));

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    success('Prompt copied to clipboard');
  };

  const handleUseInGenerator = (text: string) => {
    sessionStorage.setItem('pf_prefill_prompt', text);
    setActiveView('tool:image-generator');
  };

  const handleToggleFavorite = async (p: SavedPromptDoc) => {
    if (p.userId === 'system') {
      // Create local user copy if toggling system preset
      if (!user) return;
      const copyDoc: SavedPromptDoc = {
        ...p,
        promptId: `prompt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: user.uid,
        favorite: true,
      };
      await firestore.savePrompt(copyDoc);
      success('Saved and pinned to your prompts');
      if (onRefreshData) onRefreshData();
      return;
    }

    try {
      await firestore.toggleFavoritePrompt(p.promptId, !p.favorite);
      success(p.favorite ? 'Removed from favorites' : 'Pinned to favorites');
      if (onRefreshData) onRefreshData();
    } catch {
      error('Failed to update favorite');
    }
  };

  const handleCreatePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !promptText.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const newDoc: SavedPromptDoc = {
      promptId: `prompt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: user.uid,
      name: title.trim(),
      promptText: promptText.trim(),
      category,
      tags: tags.length > 0 ? tags : ['General'],
      favorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await firestore.savePrompt(newDoc);
      success('Prompt added to your creative library');
      setIsCreateOpen(false);
      setTitle('');
      setPromptText('');
      setTagsInput('');
      if (onRefreshData) onRefreshData();
    } catch {
      error('Failed to save prompt');
    }
  };

  const handleDeletePrompt = async (id: string) => {
    if (window.confirm('Delete this prompt?')) {
      try {
        await firestore.deletePrompt(id);
        success('Prompt deleted');
        if (onRefreshData) onRefreshData();
      } catch {
        error('Failed to delete prompt');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <span>Saved Prompts & Creative Library</span>
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Curate generative prompt engineering formulas, lighting presets, and artistic recipes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Save New Prompt</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search prompts by title, keywords or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((p) => {
          const isSystem = p.userId === 'system';
          return (
            <div
              key={p.promptId}
              className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 transition-all"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400">
                    {p.category}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleToggleFavorite(p)}
                    className="p-1 text-slate-400 hover:text-amber-500"
                  >
                    <Star className={`h-4 w-4 ${p.favorite ? 'text-amber-500 fill-amber-500' : ''}`} />
                  </button>
                </div>

                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">{p.name}</h3>

                <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  &quot;{p.promptText}&quot;
                </p>

                {p.tags && p.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                      >
                        <Tag className="h-2.5 w-2.5" />
                        <span>{tag}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleUseInGenerator(p.promptText)}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Use in Generator</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleCopy(p.promptText)}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400"
                    title="Copy prompt text"
                  >
                    <Copy className="h-3 w-3" />
                    <span>Copy</span>
                  </button>

                  {!isSystem && (
                    <button
                      type="button"
                      onClick={() => handleDeletePrompt(p.promptId)}
                      className="p-1.5 text-slate-400 hover:text-rose-600"
                      title="Delete prompt"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Prompt Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Save Prompt to Library</h3>
            <p className="text-xs text-slate-500 mt-1">Keep track of effective prompts and styles.</p>

            <form onSubmit={handleCreatePrompt} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Prompt Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Moody Neon Rain Portrait"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Prompt Text</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Enter the full generative prompt formula..."
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="Photorealistic">Photorealistic</option>
                    <option value="Cinematic">Cinematic</option>
                    <option value="Portrait">Portrait</option>
                    <option value="Product">Product</option>
                    <option value="Illustration">Illustration</option>
                    <option value="Architecture">Architecture</option>
                    <option value="Fantasy">Fantasy</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Tags (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. 8k, Octane, Studio"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
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
                  Save Prompt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
