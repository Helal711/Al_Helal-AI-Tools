import React, { useState } from 'react';
import {
  User,
  Shield,
  Trash2,
  AlertTriangle,
  Save,
  Check,
  Clock,
  Database,
  Moon,
  Sun,
  Laptop,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase/firebaseConfig';
import { firestore } from '../firebase/firestore';
import { useToast } from '../context/ToastContext';

interface SettingsPageProps {
  setActiveView: (view: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ setActiveView }) => {
  const { user, logout } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'profile' | 'retention' | 'account'>('profile');
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isSaving, setIsSaving] = useState(false);

  // Data Retention Settings
  const [retentionDays, setRetentionDays] = useState('30');
  const [keepProjectsPermanent, setKeepProjectsPermanent] = useState(true);

  // Account Deletion State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await firestore.setUserProfile(user.uid, {
        displayName,
        lastLoginAt: new Date().toISOString(),
      });
      success('Profile updated successfully.');
    } catch (e: any) {
      error(e.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmationText !== 'DELETE') return;
    setIsDeleting(true);

    try {
      const currentFbUser = auth.currentUser;
      if (!currentFbUser) throw new Error('No active authentication session found.');

      // 1. Delete user projects from Firestore
      const projects = await firestore.listUserProjects(user.uid);
      for (const p of projects) {
        await firestore.deleteProject(p.projectId);
      }

      // 2. Delete user files record
      const files = await firestore.listUserFiles(user.uid);
      for (const f of files) {
        await firestore.deleteFile(f.fileId);
      }

      // 3. Delete Firebase Auth account
      await currentFbUser.delete();

      logout();
      setShowDeleteModal(false);
      setActiveView('home');
      success('Your account and all associated creative assets have been permanently deleted.');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        error('Security requirement: Please sign out and log in again before deleting your account.');
      } else {
        error(err.message || 'Account deletion failed. Please contact support.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) {
    return (
      <div className="py-16 text-center space-y-4">
        <p className="text-sm text-slate-500">Please sign in to manage account settings.</p>
        <button
          onClick={() => setActiveView('login')}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Account & System Settings</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage your personal profile, data retention policies, and account privacy.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-bold gap-4">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'profile'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <User className="h-4 w-4" />
          <span>Profile & Preferences</span>
        </button>
        <button
          onClick={() => setActiveTab('retention')}
          className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'retention'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Data Retention</span>
        </button>
        <button
          onClick={() => setActiveTab('account')}
          className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'account'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Shield className="h-4 w-4" />
          <span>Privacy & Deletion</span>
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Public Profile</h2>

          <div className="space-y-4 text-xs">
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1.5 w-full max-w-md rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold">Email Address</label>
              <input
                type="text"
                disabled
                value={user.email}
                className="mt-1.5 w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 px-3 py-2 text-xs text-slate-500 cursor-not-allowed"
              />
              <p className="text-[11px] text-slate-400 mt-1">Managed securely through Firebase Authentication.</p>
            </div>

            <div className="pt-2">
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Retention Tab */}
      {activeTab === 'retention' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Data Retention Policy</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Control how long your temporary image generations and processing history are maintained.
          </p>

          <div className="space-y-4 text-xs">
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold">Temporary Cache Retention</label>
              <select
                value={retentionDays}
                onChange={(e) => setRetentionDays(e.target.value)}
                className="mt-1.5 w-full max-w-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-white"
              >
                <option value="7">7 Days</option>
                <option value="30">30 Days (Default)</option>
                <option value="90">90 Days</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">Temporary processing jobs older than this are swept automatically.</p>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={keepProjectsPermanent}
                  onChange={(e) => setKeepProjectsPermanent(e.target.checked)}
                  className="rounded text-indigo-600 h-4 w-4"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Retain saved Projects permanently until manually deleted
                </span>
              </label>
              <p className="text-[11px] text-slate-400 ml-6 mt-0.5">
                Ensures your curated projects are never deleted automatically.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Account Deletion Tab */}
      {activeTab === 'account' && (
        <div className="rounded-2xl border border-rose-200 dark:border-rose-950 bg-rose-50/50 dark:bg-rose-950/20 p-6 space-y-4">
          <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
            <AlertTriangle className="h-5 w-5" />
            <h3>Delete Account & All Creative Assets</h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Permanently removes your user profile, saved projects, generations history, and private files stored in Firebase Storage. This action cannot be undone.
          </p>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-500 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete My Account</span>
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="max-w-md w-full rounded-3xl border border-rose-200 dark:border-rose-900 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-2xl">
            <h2 className="text-base font-bold text-rose-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Confirm Permanent Account Deletion
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              This will irreversibly delete all your projects, history logs, and uploaded files. Type <strong className="text-rose-600">DELETE</strong> below to confirm.
            </p>
            <input
              type="text"
              placeholder="Type DELETE"
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmationText !== 'DELETE' || isDeleting}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 transition-colors disabled:opacity-40"
              >
                {isDeleting ? 'Deleting Everything...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
