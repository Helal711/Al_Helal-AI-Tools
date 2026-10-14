import React, { useState, useEffect } from 'react';
import { Star, Download, Trash2, Sparkles } from 'lucide-react';
import { firestore, FavoriteDoc } from '../firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface FavoritesPageProps {
  setActiveView: (view: string) => void;
}

export const FavoritesPage: React.FC<FavoritesPageProps> = ({ setActiveView }) => {
  const { user } = useAuth();
  const { success } = useToast();
  const [favorites, setFavorites] = useState<FavoriteDoc[]>([]);

  useEffect(() => {
    if (!user?.uid) {
      setFavorites([]);
      return;
    }
    const unsubscribe = firestore.subscribeUserFavorites(user.uid, (items) => {
      setFavorites(items);
    });
    return unsubscribe;
  }, [user?.uid]);

  const handleRemoveFavorite = async (id: string) => {
    await firestore.removeFavorite(id);
    success('Removed from favorites.');
  };

  const handleDownload = (item: FavoriteDoc) => {
    const a = document.createElement('a');
    a.href = item.imageUrl;
    a.download = `pixelforge_favorite_${item.favoriteId}.png`;
    a.click();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="border-b border-slate-200 pb-5 dark:border-slate-800">
        <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Star className="h-6 w-6 text-amber-500 fill-amber-500" />
          <span>Bookmarked Favorites</span>
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Your curated collection of star-rated generated artworks and studio cutouts.
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900">
          <Star className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
          <h3 className="mt-4 text-sm font-bold text-slate-800 dark:text-slate-200">No favorites yet</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            Click the star icon on any generated visual asset or cutout to keep it pinned here.
          </p>
          <button
            type="button"
            onClick={() => setActiveView('tools')}
            className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700"
          >
            Explore AI Workspaces
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {favorites.map((fav) => (
            <div
              key={fav.favoriteId}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="relative aspect-square w-full bg-slate-950 overflow-hidden">
                <img
                  src={fav.imageUrl}
                  alt={fav.title}
                  className="h-full w-full object-contain"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownload(fav)}
                    title="Download"
                    className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveFavorite(fav.favoriteId)}
                    title="Remove from favorites"
                    className="p-2 rounded-lg bg-rose-600 text-white hover:bg-rose-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="p-3">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{fav.title}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{fav.tool}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
