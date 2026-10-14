import React, { useState } from 'react';
import {
  Shield,
  Download,
  Trash2,
  AlertTriangle,
  FileText,
  Database,
  Lock,
  RefreshCw,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useHistory } from '../../context/HistoryContext';
import { firestore } from '../../firebase/firestore';

interface DashboardPrivacyProps {
  setActiveView: (view: string) => void;
  onRefreshData?: () => void;
}

export const DashboardPrivacy: React.FC<DashboardPrivacyProps> = ({ setActiveView, onRefreshData }) => {
  const { user, logout } = useAuth();
  const { clearHistory } = useHistory();
  const { success, error } = useToast();

  const [isExporting, setIsExporting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // 1. Export All User Data
  const handleExportData = async () => {
    if (!user) return;
    setIsExporting(true);
    try {
      const data = await firestore.exportUserData(user.uid);
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pixelforge_data_export_${user.uid}_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      success('Complete data archive downloaded (JSON)');
    } catch (e: any) {
      error(e.message || 'Failed to export account data');
    } finally {
      setIsExporting(false);
    }
  };

  // 2. Clear Generation History
  const handleClearHistory = () => {
    if (window.confirm('Clear all your local and staged AI generation records? This action cannot be undone.')) {
      clearHistory();
      success('Generation history cleared');
      if (onRefreshData) onRefreshData();
    }
  };

  // 3. Delete Account
  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmText !== 'DELETE') return;
    setIsDeletingAccount(true);
    try {
      const ok = await firestore.deleteUserAccount(user.uid);
      if (ok) {
        await logout();
        setDeleteModalOpen(false);
        setActiveView('home');
        success('Account and all associated records permanently erased.');
      } else {
        error('Failed to complete full account deletion. Please try again.');
      }
    } catch (e: any) {
      error(e.message || 'Account deletion failed');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5 dark:border-slate-800">
        <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Shield className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          <span>Privacy & Data Management</span>
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Exercise your GDPR / CCPA rights: export your creative data, erase logs, or delete your account.
        </p>
      </div>

      {/* Section 1: Data Portability & Export */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
        <div className="flex items-center gap-2.5">
          <Database className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Data Portability & Full JSON Archive
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Download all your projects, file metadata, prompt formulas, templates, and bookmarks.
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={isExporting}
          onClick={handleExportData}
          className="mt-2 flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          <span>{isExporting ? 'Generating JSON Package...' : 'Download My Data Archive'}</span>
        </button>
      </div>

      {/* Section 2: Generation History Purge */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
        <div className="flex items-center gap-2.5">
          <RefreshCw className="h-5 w-5 text-amber-500" />
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Clear AI Generation History
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Removes all generated image audit records from your local and staged device cache.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClearHistory}
          className="mt-2 flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
        >
          <Trash2 className="h-4 w-4" />
          <span>Clear Generation Records</span>
        </button>
      </div>

      {/* Section 3: Danger Zone */}
      <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-5 shadow-2xs dark:border-rose-900/60 dark:bg-rose-950/20 space-y-3">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-rose-900 dark:text-rose-200">
              Danger Zone: Permanently Delete Account
            </h2>
            <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
              Permanently purges all your projects, files, templates, bookmarks, notifications, and profile from the Firestore database.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setDeleteModalOpen(true)}
          className="mt-2 flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          <span>Permanently Delete Account</span>
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-6 shadow-2xl dark:border-rose-900 dark:bg-slate-900">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Confirm Account Deletion</h3>
            </div>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              This action is <span className="font-bold text-rose-600">irreversible</span>. All your stored projects, generated images, uploaded files, and saved prompt recipes will be deleted permanently.
            </p>

            <div className="mt-4">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                To confirm, type <span className="font-mono text-rose-600 font-bold">DELETE</span> below:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="mt-1 w-full rounded-xl border border-rose-300 px-3 py-2 text-xs dark:border-rose-800 dark:bg-slate-800 dark:text-slate-100 font-mono"
                autoFocus
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setDeleteConfirmText('');
                }}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmText !== 'DELETE' || isDeletingAccount}
                onClick={handleDeleteAccount}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-40"
              >
                {isDeletingAccount ? 'Erasing Everything...' : 'Confirm Permanent Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
