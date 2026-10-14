import React, { useState } from 'react';
import {
  User,
  Mail,
  Calendar,
  Shield,
  Sparkles,
  Check,
  Save,
  Cpu,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { firestore } from '../../firebase/firestore';

interface DashboardProfileProps {
  onRefreshData?: () => void;
}

export const DashboardProfile: React.FC<DashboardProfileProps> = ({ onRefreshData }) => {
  const { user, updateProfile } = useAuth();
  const { success, error } = useToast();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      await updateProfile({
        displayName: displayName.trim(),
        photoURL: photoURL.trim() || undefined,
      });
      await firestore.setUserProfile(user.uid, {
        displayName: displayName.trim(),
        photoURL: photoURL.trim() || undefined,
        lastLoginAt: new Date().toISOString(),
      });
      success('Profile updated successfully');
      if (onRefreshData) onRefreshData();
    } catch {
      error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5 dark:border-slate-800">
        <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <User className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          <span>Profile & Account Credentials</span>
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Manage your creator profile, public avatar, and authentication details.
        </p>
      </div>

      {/* User Card */}
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-2xl font-bold text-white shadow-sm overflow-hidden">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Avatar" className="h-full w-full object-cover" />
          ) : user?.displayName ? (
            user.displayName[0].toUpperCase()
          ) : (
            'U'
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
              {user?.displayName || 'Creator'}
            </h2>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              Active Creator
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{user?.email}</p>
          <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-1">
            <Calendar className="h-3 w-3" />
            <span>Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '2025'}</span>
          </p>
        </div>
      </div>

      {/* Technical Usage Tier Overview (NO CREDITS) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Cpu className="h-4 w-4 text-indigo-600" />
          <span>Technical Plan & Allocation Tier</span>
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Al_Helal AI Tools does not use a credit-based business model. Your account has access to all visual generation models, upscalers, background isolation algorithms, and editors.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/40">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Tier</span>
            <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">Creator Unlimited</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/40">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Daily Request Capacity</span>
            <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">Unrestricted (Fair-use)</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/40">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Max Ingest File Size</span>
            <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">25 MB / upload</p>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSave} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-100 pb-3 dark:border-slate-800">
          Edit Profile Information
        </h3>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Display Name</label>
          <input
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:outline-hidden"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Avatar Image URL</label>
          <input
            type="url"
            placeholder="https://example.com/avatar.jpg"
            value={photoURL}
            onChange={(e) => setPhotoURL(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:outline-hidden"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Email Address (Verified)</label>
          <input
            type="email"
            disabled
            value={user?.email || ''}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400 cursor-not-allowed"
          />
          <p className="mt-1 text-[11px] text-slate-400">Email address is managed by Firebase Authentication.</p>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
        </button>
      </form>
    </div>
  );
};
