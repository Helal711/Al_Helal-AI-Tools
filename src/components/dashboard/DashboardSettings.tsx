import React, { useState } from 'react';
import {
  Settings,
  Sliders,
  Moon,
  Sun,
  Laptop,
  Check,
  Save,
  Bell,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { firestore } from '../../firebase/firestore';

export const DashboardSettings: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const { success, error } = useToast();

  const [defaultFormat, setDefaultFormat] = useState<'png' | 'webp' | 'jpeg'>(
    user?.preferences.defaultFormat || 'png'
  );
  const [quality, setQuality] = useState<number>(95);
  const [autoEnhance, setAutoEnhance] = useState<boolean>(user?.preferences.autoEnhance ?? true);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [autoSaveProjects, setAutoSaveProjects] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      await updateProfile({
        preferences: {
          theme,
          defaultFormat,
          autoEnhance,
        },
      });
      await firestore.setUserProfile(user.uid, {
        settings: {
          theme,
          defaultFormat,
          autoEnhance,
          notificationsEnabled,
        },
      });
      success('Workspace preferences updated successfully');
    } catch {
      error('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5 dark:border-slate-800">
        <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Settings className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          <span>Studio Preferences & Defaults</span>
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Tailor default image export formats, edge feathering heuristics, and UI appearance.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Export Defaults */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Export & Processing Defaults
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Default Download Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'png', title: 'PNG (Lossless)', desc: 'Best for alpha transparency & cutouts' },
                  { id: 'webp', title: 'WebP (Modern)', desc: 'Ultra compact for modern websites' },
                  { id: 'jpeg', title: 'JPEG (Standard)', desc: 'Universal print & photography format' },
                ] as const
              ).map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => setDefaultFormat(fmt.id)}
                  className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                    defaultFormat === fmt.id
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200 ring-2 ring-indigo-600/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                  }`}
                >
                  <span className="text-xs font-bold">{fmt.title}</span>
                  <span className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    {fmt.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Default Compression Quality
              </label>
              <span className="font-mono font-bold text-indigo-600">{quality}%</span>
            </div>
            <input
              type="range"
              min="70"
              max="100"
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="mt-2 w-full accent-indigo-600 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Auto Edge Feathering & Antialiasing
              </p>
              <p className="text-[11px] text-slate-400">
                Automatically soften mask boundaries on isolated cutouts to eliminate jagged halos.
              </p>
            </div>
            <input
              type="checkbox"
              checked={autoEnhance}
              onChange={(e) => setAutoEnhance(e.target.checked)}
              className="h-4 w-4 rounded-sm text-indigo-600 accent-indigo-600 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Auto-Save Project Checkpoints
              </p>
              <p className="text-[11px] text-slate-400">
                Save work-in-progress edits to your project automatically after each tool run.
              </p>
            </div>
            <input
              type="checkbox"
              checked={autoSaveProjects}
              onChange={(e) => setAutoSaveProjects(e.target.checked)}
              className="h-4 w-4 rounded-sm text-indigo-600 accent-indigo-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Theme Preferences */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Appearance & Interface Theme
          </h2>

          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'light', label: 'Light', icon: Sun },
              { id: 'dark', label: 'Dark', icon: Moon },
              { id: 'system', label: 'System Sync', icon: Laptop },
            ].map((th) => {
              const Icon = th.icon;
              const isSelected = theme === th.id;
              return (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => setTheme(th.id as any)}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 ring-2 ring-indigo-600/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{th.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>{isSaving ? 'Saving...' : 'Save All Preferences'}</span>
        </button>
      </form>
    </div>
  );
};
