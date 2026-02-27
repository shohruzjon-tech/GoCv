"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useNotificationsStore } from "@/lib/store";
import { notificationsApi } from "@/lib/api";
import { X, Bell, Check, Zap, Crown, CheckCheck, Trash2 } from "lucide-react";

export default function NotificationDrawer() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    drawerOpen,
    closeDrawer,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useNotificationsStore();

  // Lock body scroll
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [closeDrawer]);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      markAsRead(id);
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      markAllAsRead();
    } catch {}
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationsApi.delete(id);
      removeNotification(id);
    } catch {}
  };

  const handleClickNotification = (notif: any) => {
    handleMarkRead(notif._id);
    if (notif.actionUrl) {
      router.push(notif.actionUrl);
      closeDrawer();
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <Check className="h-4 w-4" />;
      case "upgrade":
        return <Crown className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const getIconColors = (type: string) => {
    switch (type) {
      case "success":
        return "bg-emerald-500/15 text-emerald-400";
      case "warning":
        return "bg-amber-500/15 text-amber-400";
      case "error":
        return "bg-red-500/15 text-red-400";
      case "upgrade":
        return "bg-purple-500/15 text-purple-400";
      default:
        return "bg-indigo-500/15 text-indigo-400";
    }
  };

  const formatTime = (date: string) => {
    const now = new Date();
    const d = new Date(date);
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${
        drawerOpen ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div
        onClick={closeDrawer}
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          drawerOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Drawer panel */}
      <aside
        className={`absolute inset-y-0 right-0 w-full max-w-md bg-surface shadow-2xl transition-transform duration-300 ease-out ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-edge px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                <Bell className="h-[18px] w-[18px]" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-content">
                  Notifications
                </h2>
                {unreadCount > 0 && (
                  <p className="text-xs text-content-3">{unreadCount} unread</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-indigo-400 transition hover:bg-indigo-500/10"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
              <button
                onClick={closeDrawer}
                className="rounded-lg p-2 text-content-3 transition hover:bg-card-hover hover:text-content"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-card">
                  <Bell className="h-6 w-6 text-content-4" />
                </div>
                <p className="text-sm font-medium text-content-2">
                  No notifications yet
                </p>
                <p className="mt-1 text-xs text-content-3">
                  We&apos;ll notify you about important updates
                </p>
              </div>
            ) : (
              <div className="divide-y divide-edge">
                {notifications.map((notif) => (
                  <div
                    key={notif._id}
                    className={`group relative px-5 py-4 transition hover:bg-card-hover ${
                      !notif.read ? "bg-indigo-500/[0.03]" : ""
                    }`}
                  >
                    <button
                      onClick={() => handleClickNotification(notif)}
                      className="flex w-full items-start gap-3 text-left"
                    >
                      <div
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${getIconColors(
                          notif.type,
                        )}`}
                      >
                        {getIcon(notif.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-content">
                            {notif.title}
                          </p>
                          {!notif.read && (
                            <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs text-content-2 leading-relaxed">
                          {notif.message}
                        </p>
                        <p className="mt-1.5 text-[11px] text-content-4">
                          {formatTime(notif.createdAt || "")}
                        </p>
                      </div>
                    </button>
                    {/* Actions (shown on hover) */}
                    <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                      {!notif.read && (
                        <button
                          onClick={() => handleMarkRead(notif._id)}
                          className="rounded-md p-1.5 text-content-4 transition hover:bg-card hover:text-content-2"
                          title="Mark as read"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notif._id)}
                        className="rounded-md p-1.5 text-content-4 transition hover:bg-red-500/10 hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
