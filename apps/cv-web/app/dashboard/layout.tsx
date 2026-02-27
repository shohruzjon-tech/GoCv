"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useAuthStore,
  useNotificationsStore,
  useSubscriptionStore,
  useOrganizationStore,
} from "@/lib/store";
import {
  notificationsApi,
  subscriptionsApi,
  organizationsApi,
} from "@/lib/api";
import Sidebar from "@/components/layout/sidebar";
import DashboardHeader from "@/components/layout/dashboard-header";
import NotificationDrawer from "@/components/layout/notification-drawer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuthStore();
  const { setNotifications, setUnreadCount } = useNotificationsStore();
  const { setSubscription } = useSubscriptionStore();
  const { setOrganizations } = useOrganizationStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // Load notifications & subscription
  useEffect(() => {
    if (user) {
      notificationsApi
        .getAll()
        .then((r) => setNotifications(r.data))
        .catch(() => {});
      notificationsApi
        .getUnreadCount()
        .then((r) => setUnreadCount(r.data.count ?? r.data))
        .catch(() => {});
      subscriptionsApi
        .getMy()
        .then((r) => setSubscription(r.data))
        .catch(() => {});
      organizationsApi
        .getAll()
        .then((r) => setOrganizations(r.data))
        .catch(() => {});
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-page">
      <Sidebar />
      <NotificationDrawer />
      <div className="lg:pl-[260px]">
        <DashboardHeader />
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
