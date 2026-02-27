"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useNotificationsStore } from "@/lib/store";
import { Check, Crown, Zap, X, ArrowRight } from "lucide-react";

interface ToastNotification {
  id: string;
  _id: string;
  title: string;
  message: string;
  type: string;
  actionUrl?: string;
  visible: boolean;
}

export default function NotificationToastContainer() {
  const router = useRouter();
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const { lastIncoming } = useNotificationsStore();

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, visible: false } : t)),
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  useEffect(() => {
    if (!lastIncoming) return;

    const toastId = `${lastIncoming._id}-${Date.now()}`;
    const newToast: ToastNotification = {
      id: toastId,
      ...lastIncoming,
      visible: false,
    };

    setToasts((prev) => [...prev.slice(-4), newToast]);

    // Animate in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setToasts((prev) =>
          prev.map((t) => (t.id === toastId ? { ...t, visible: true } : t)),
        );
      });
    });

    // Auto dismiss after 5s
    const timer = setTimeout(() => dismissToast(toastId), 5000);
    return () => clearTimeout(timer);
  }, [lastIncoming, dismissToast]);

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

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col-reverse gap-2 sm:bottom-6 sm:right-6">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`w-[320px] max-w-[calc(100vw-2rem)] rounded-2xl border border-edge bg-surface p-4 shadow-2xl shadow-black/20 transition-all duration-300 sm:w-[360px] ${
            toast.visible
              ? "translate-y-0 opacity-100"
              : "translate-y-3 opacity-0"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${getIconColors(
                toast.type,
              )}`}
            >
              {getIcon(toast.type)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-content">{toast.title}</p>
              <p className="mt-0.5 line-clamp-2 text-xs text-content-2">
                {toast.message}
              </p>
              {toast.actionUrl && (
                <button
                  onClick={() => {
                    router.push(toast.actionUrl!);
                    dismissToast(toast.id);
                  }}
                  className="mt-2 flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300"
                >
                  View
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 rounded-md p-1 text-content-4 transition hover:bg-card-hover hover:text-content-3"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
