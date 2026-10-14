import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, Info, AlertCircle, Check, X } from 'lucide-react';
import { firestore, NotificationDoc } from '../../firebase/firestore';
import { useAuth } from '../../context/AuthContext';

export const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationDoc[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      return;
    }
    const unsubscribe = firestore.subscribeUserNotifications(user.uid, (items) => {
      setNotifications(items);
    });
    return unsubscribe;
  }, [user?.uid]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    notifications.forEach((n) => {
      if (!n.read) {
        firestore.markNotificationRead(n.notificationId).catch(() => {});
      }
    });
  };

  const markSingleRead = (id: string) => {
    firestore.markNotificationRead(id).catch(() => {});
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-xl border border-slate-200 bg-slate-50/80 p-2 text-slate-600 hover:bg-white hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 shadow-2xs transition-colors"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-xs">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl z-50 dark:border-slate-800 dark:bg-slate-900 animate-in fade-in duration-100">
          <div className="flex items-center justify-between border-b border-slate-100 px-2 pb-2.5 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Notifications ({notifications.length})
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-[11px] font-semibold text-indigo-600 hover:underline dark:text-indigo-400 flex items-center gap-1"
              >
                <Check className="h-3 w-3" />
                <span>Mark all as read</span>
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 my-1">
            {notifications.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">No notifications yet</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.notificationId}
                  onClick={() => markSingleRead(n.notificationId)}
                  className={`p-2.5 transition-colors cursor-pointer rounded-xl flex items-start gap-2.5 ${
                    n.read ? 'opacity-65 hover:bg-slate-50 dark:hover:bg-slate-800/60' : 'bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-50'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {n.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                    {n.type === 'error' && <AlertCircle className="h-4 w-4 text-red-600" />}
                    {n.type === 'info' && <Info className="h-4 w-4 text-indigo-600" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">{n.title}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{n.message}</p>
                    <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                window.location.hash = 'dashboard/notifications';
              }}
              className="text-[11px] font-bold text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Open Full Notifications Center →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
