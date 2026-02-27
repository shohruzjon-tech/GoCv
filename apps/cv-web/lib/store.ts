"use client";

import { create } from "zustand";
import { User, Subscription, Notification } from "@/types";

// ─── Auth Store ───

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  loadFromStorage: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  setAuth: (user: User, token: string) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    set({ user, token, isLoading: false });
  },
  clearAuth: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ user: null, token: null, isLoading: false });
  },
  setLoading: (isLoading: boolean) => set({ isLoading }),
  loadFromStorage: () => {
    try {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");
      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({ user, token, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
  updateUser: (updates: Partial<User>) => {
    const current = get().user;
    if (current) {
      const updated = { ...current, ...updates };
      localStorage.setItem("user", JSON.stringify(updated));
      set({ user: updated });
    }
  },
}));

// ─── Subscription Store ───

interface SubscriptionState {
  subscription: Subscription | null;
  isLoading: boolean;
  setSubscription: (sub: Subscription) => void;
  clearSubscription: () => void;
  setLoading: (loading: boolean) => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  subscription: null,
  isLoading: true,
  setSubscription: (subscription) => set({ subscription, isLoading: false }),
  clearSubscription: () => set({ subscription: null, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
}));

// ─── Notifications Store ───

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (notifications: Notification[]) => void;
  setUnreadCount: (count: number) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) => set({ notifications }),
  setUnreadCount: (unreadCount) => set({ unreadCount }),
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n._id === id ? { ...n, read: true } : n,
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n._id !== id),
    })),
}));

// ─── Theme Store ───

type Theme = "dark" | "light";

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  loadTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: "dark",
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === "dark" ? "light" : "dark";
      localStorage.setItem("theme", next);
      document.documentElement.setAttribute("data-theme", next);
      return { theme: next };
    }),
  setTheme: (theme) => {
    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
    set({ theme });
  },
  loadTheme: () => {
    const saved = localStorage.getItem("theme") as Theme | null;
    const theme = saved || "dark";
    document.documentElement.setAttribute("data-theme", theme);
    set({ theme });
  },
}));
