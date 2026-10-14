import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Info,
  Check,
  Trash2,
  Filter,
  CheckCheck,
} from 'lucide-react';
import { NotificationDoc, firestore } from '../../firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface DashboardNotificationsProps {
  notifications: NotificationDoc[];
  onRefreshData?: () => void;
}

export const DashboardNotifications: React.FC<DashboardNotificationsProps> = ({
  notifications,
  onRefreshData,
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [filterMode, setFilterMode] = useState<'all' | 'unread'>('all');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered = notifications.filter((n) => {
    if (filterMode === 'unread') return !n.read;
    return true;
  });

  const handleMarkOne = async (id: string, read: boolean) => {
    try {
      await firestore.markNotificationRead(id, read);
      if (onRefreshData) onRefreshData();
    } catch {
      error('Failed to update notification');
    }
  };

  const handleMarkAll = async () => {
    if (!user) return;
    try {
      await firestore.markAllNotificationsRead(user.uid);
      success('All notifications marked as read');
      if (onRefreshData) onRefreshData();
    } catch {
      error('Failed to mark all as read');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await firestore.deleteNotification(id);
      success('Notification dismissed');
      if (onRefreshData) onRefreshData();
    } catch {
      error('Failed to delete notification');
    }
  };

  const getIcon = (type: NotificationDoc['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-rose-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      default:
        return <Info className="h-4 w-4 text-indigo-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Bell className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <span>Activity Notifications</span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-rose-500 px-2.5 py-0.5 text-xs font-bold text-white">
                {unreadCount} new
              </span>
            )}
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            System alerts, job completion confirmations, and technical limits updates.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAll}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 transition-colors"
          >
            <CheckCheck className="h-4 w-4 text-indigo-600" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFilterMode('all')}
          className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
            filterMode === 'all'
              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
              : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterMode('unread')}
          className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
            filterMode === 'unread'
              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
              : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400'
          }`}
        >
          Unread Only ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900">
          <Bell className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
          <h3 className="mt-4 text-sm font-bold text-slate-800 dark:text-slate-200">
            {filterMode === 'unread' ? 'No unread notifications' : 'No notifications'}
          </h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            You will receive status updates when background AI jobs complete or when technical alerts occur.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.notificationId}
              className={`flex items-start justify-between gap-4 rounded-2xl border p-4 transition-all ${
                item.read
                  ? 'border-slate-200 bg-white/60 dark:border-slate-800 dark:bg-slate-900/60'
                  : 'border-indigo-200 bg-indigo-50/30 shadow-2xs dark:border-indigo-900/50 dark:bg-indigo-950/20'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="mt-0.5 shrink-0 rounded-lg bg-white p-1.5 shadow-2xs dark:bg-slate-800">
                  {getIcon(item.type)}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>{item.title}</span>
                    {!item.read && (
                      <span className="h-2 w-2 rounded-full bg-indigo-600" />
                    )}
                  </h4>
                  <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.message}
                  </p>
                  <span className="mt-2 block text-[10px] text-slate-400 font-mono">
                    {new Date(item.createdAt).toLocaleDateString()}{' '}
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleMarkOne(item.notificationId, !item.read)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title={item.read ? 'Mark as unread' : 'Mark as read'}
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item.notificationId)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  title="Dismiss notification"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
