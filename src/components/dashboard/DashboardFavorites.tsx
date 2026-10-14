import React, { useState } from 'react';
import {
  Star,
  Search,
  Wand2,
  FolderKanban,
  Sparkles,
  Bookmark,
  FileCode,
  Download,
  Trash2,
  ExternalLink,
  Copy,
  Eye,
} from 'lucide-react';
import { FavoriteDoc, firestore } from '../../firebase/firestore';
import { useToast } from '../../context/ToastContext';

interface DashboardFavoritesProps {
  favorites: FavoriteDoc[];
  setActiveView: (view: string) => void;
  onPreviewImage: (imageUrl: string, title?: string) => void;
  onRefreshData?: () => void;
}

export const DashboardFavorites: React.FC<DashboardFavoritesProps> = ({
  favorites,
  setActiveView,
  onPreviewImage,
  onRefreshData,
}) => {
  const { success, error } = useToast();
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = favorites.filter((f) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!f.title.toLowerCase().includes(q) && !f.tool.toLowerCase().includes(q)) return false;
    }
    if (filterType !== 'all') {
      if (filterType === 'tools' && f.type !== 'tool' && !f.favoriteId.includes('fav_tool_')) return false;
      if (filterType === 'projects' && f.type !== 'project' && !f.projectId) return false;
      if (filterType === 'results' && f.type !== 'result' && !f.imageUrl) return false;
    }
    return true;
  });

  const handleRemove = async (favId: string) => {
    try {
      await firestore.removeFavorite(favId);
      success('Removed from bookmarks');
      if (onRefreshData) onRefreshData();
    } catch {
      error('Failed to remove bookmark');
    }
  };

  const handleOpenItem = (f: FavoriteDoc) => {
    if (f.projectId) {
      setActiveView(`dashboard/projects/${f.projectId}`);
    } else if (f.tool) {
      setActiveView(`tool:${f.tool}`);
    } else {
      setActiveView('tools');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Star className="h-6 w-6 text-amber-500 fill-amber-500" />
            <span>Bookmarked Favorites</span>
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Fast access to pinned AI engines, preferred projects, and standout visual creations.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search favorites..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: 'all', label: 'All Items' },
              { id: 'tools', label: 'Tools' },
              { id: 'projects', label: 'Projects' },
              { id: 'results', label: 'Artworks' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id)}
              className={`rounded-xl border px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                filterType === tab.id
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900">
          <Star className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
          <h3 className="mt-4 text-sm font-bold text-slate-800 dark:text-slate-200">No favorites pinned yet</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            Click the star icon on any tool card, generated image, or studio project to bookmark it here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((fav) => (
            <div
              key={fav.favoriteId}
              className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 transition-all"
            >
              <div>
                {fav.imageUrl ? (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => onPreviewImage(fav.imageUrl, fav.title)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        onPreviewImage(fav.imageUrl, fav.title);
                      }
                    }}
                    className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-950 mb-3 cursor-pointer"
                  >
                    <img
                      src={fav.imageUrl}
                      alt={fav.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                      <Eye className="h-5 w-5" />
                    </div>
                  </div>
                ) : (
                  <div className="flex h-16 w-full items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 mb-3">
                    <Wand2 className="h-7 w-7" />
                  </div>
                )}

                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  {fav.tool || 'Workspace'}
                </span>
                <h3 className="mt-1 text-xs font-bold text-slate-900 dark:text-slate-100 truncate" title={fav.title}>
                  {fav.title}
                </h3>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => handleOpenItem(fav)}
                  className="font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
                >
                  <span>Launch</span>
                  <ExternalLink className="h-3 w-3" />
                </button>

                <button
                  type="button"
                  onClick={() => handleRemove(fav.favoriteId)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
                  title="Remove from favorites"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
