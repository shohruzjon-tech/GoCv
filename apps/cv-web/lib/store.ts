"use client";

import { create } from "zustand";
import {
  User,
  Subscription,
  Notification,
  Organization,
  OrgMembership,
  OrgRole,
} from "@/types";

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
  drawerOpen: boolean;
  lastIncoming: Notification | null;
  setNotifications: (notifications: Notification[]) => void;
  setUnreadCount: (count: number) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  notifications: [],
  unreadCount: 0,
  drawerOpen: false,
  lastIncoming: null,
  setNotifications: (notifications) => set({ notifications }),
  setUnreadCount: (unreadCount) => set({ unreadCount }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
      lastIncoming: notification,
    })),
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
  openDrawer: () => set({ drawerOpen: true }),
  closeDrawer: () => set({ drawerOpen: false }),
  toggleDrawer: () => set((s) => ({ drawerOpen: !s.drawerOpen })),
}));

// ─── Sidebar Store ───

interface SidebarState {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isOpen: false,
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));

// ─── Organization Store ───

interface OrganizationState {
  organizations: Organization[];
  activeOrg: Organization | null;
  activeOrgRole: OrgRole | null;
  isLoading: boolean;
  setOrganizations: (orgs: Organization[]) => void;
  setActiveOrg: (org: Organization | null) => void;
  setActiveOrgRole: (role: OrgRole | null) => void;
  setLoading: (loading: boolean) => void;
  addOrganization: (org: Organization) => void;
  updateOrganization: (id: string, updates: Partial<Organization>) => void;
  removeOrganization: (id: string) => void;
  switchOrg: (org: Organization, role: OrgRole) => void;
}

export const useOrganizationStore = create<OrganizationState>((set, get) => ({
  organizations: [],
  activeOrg: null,
  activeOrgRole: null,
  isLoading: false,
  setOrganizations: (organizations) => set({ organizations }),
  setActiveOrg: (activeOrg) => set({ activeOrg }),
  setActiveOrgRole: (activeOrgRole) => set({ activeOrgRole }),
  setLoading: (isLoading) => set({ isLoading }),
  addOrganization: (org) =>
    set((state) => ({
      organizations: [...state.organizations, org],
    })),
  updateOrganization: (id, updates) =>
    set((state) => ({
      organizations: state.organizations.map((o) =>
        o._id === id ? { ...o, ...updates } : o,
      ),
      activeOrg:
        state.activeOrg?._id === id
          ? { ...state.activeOrg, ...updates }
          : state.activeOrg,
    })),
  removeOrganization: (id) =>
    set((state) => ({
      organizations: state.organizations.filter((o) => o._id !== id),
      activeOrg: state.activeOrg?._id === id ? null : state.activeOrg,
      activeOrgRole: state.activeOrg?._id === id ? null : state.activeOrgRole,
    })),
  switchOrg: (org, role) =>
    set({
      activeOrg: org,
      activeOrgRole: role,
    }),
}));
