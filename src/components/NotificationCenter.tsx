import React, { useState } from 'react';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/socialService';
import { formatRelativeTime } from '../utils/date';

export const NotificationCenter: React.FC = () => {
  const { notifications, unreadNotificationCount } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleOpenNotification = async (id: string, linkPath: string, isRead: boolean) => {
    setOpen(false);
    if (!isRead) {
      await markNotificationRead(id);
    }
    navigate(linkPath || '/dashboard');
  };

  const handleMarkAll = async () => {
    await markAllNotificationsRead(notifications);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications (${unreadNotificationCount} unread)`}
        className="relative inline-flex items-center justify-center w-10 h-10 rounded-xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-zinc-800 transition-colors"
      >
        <Bell className="w-4 h-4" />
        {unreadNotificationCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-orange-600 text-white text-[10px] font-mono font-semibold flex items-center justify-center tabular-nums">
            {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed right-3 left-3 top-16 sm:left-auto sm:right-6 md:absolute md:right-0 md:top-12 md:left-auto md:w-96 z-50 rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  Notifications
                </h3>
                {unreadNotificationCount > 0 && (
                  <span className="text-xs font-mono text-orange-600 dark:text-orange-400 tabular-nums">
                    {unreadNotificationCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadNotificationCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAll}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close notifications"
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-stone-100 dark:divide-zinc-800">
              {notifications.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
                    The heavens are currently quiet.
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                    Incoming blessings, friend requests, and promotions appear here.
                  </p>
                </div>
              ) : (
                notifications.slice(0, 20).map((n) => (
                  <div
                    key={n.notificationId}
                    className={`flex items-start gap-3 px-4 py-3.5 transition-colors ${
                      n.read
                        ? 'bg-white dark:bg-zinc-900 opacity-75'
                        : 'bg-orange-50/50 dark:bg-orange-950/20'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenNotification(n.notificationId, n.linkPath, n.read)
                      }
                      className="flex-1 text-left min-w-0"
                    >
                      <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 leading-snug">
                        {n.title}
                      </p>
                      <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-[11px] font-mono text-stone-400 dark:text-stone-500 mt-1.5">
                        {formatRelativeTime(n.createdAt)}
                      </p>
                    </button>
                    {!n.read && (
                      <button
                        type="button"
                        onClick={() => markNotificationRead(n.notificationId)}
                        title="Mark as read"
                        aria-label="Mark as read"
                        className="shrink-0 p-1.5 rounded-lg text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-950/50"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
