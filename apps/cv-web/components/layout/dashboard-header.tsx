"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useAuthStore,
  useSubscriptionStore,
  useSidebarStore,
  useNotificationsStore,
} from "@/lib/store";
import { authApi } from "@/lib/api";
import ThemeToggle from "@/components/theme-toggle";
import {
  Menu,
  Bell,
  LogOut,
  ChevronDown,
  Settings,
  CreditCard,
  Sparkles,
  FileText,
} from "lucide-react";

export default function DashboardHeader() {
  const { user, clearAuth } = useAuthStore();
  const { subscription } = useSubscriptionStore();
  const { unreadCount } = useNotificationsStore();
  const { open: openSidebar } = useSidebarStore();
  const router = useRouter();

  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node))
        setShowAccountMenu(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {}
    clearAuth();
    router.push("/login");
  };

  const planLabel =
    subscription?.plan === "enterprise"
      ? "Enterprise"
      : subscription?.plan === "premium"
        ? "Premium"
        : "Free";

  if (!user) return null;

  return (
    <header className="sticky top-0 z-20 border-b border-edge bg-page/80 backdrop-blur-xl">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        {/* Left: hamburger + mobile logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={openSidebar}
            className="rounded-lg p-2 text-content-3 transition hover:bg-card-hover hover:text-content lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          {/* Mobile logo */}
          <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600/20 ring-1 ring-indigo-500/30">
              <FileText className="h-3.5 w-3.5 text-indigo-400" />
            </div>
            <span className="text-base font-bold text-content">
              Go<span className="text-gradient">CV</span>
            </span>
          </Link>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle />

          {/* Notifications */}
          <button
            onClick={() => useNotificationsStore.getState().toggleDrawer()}
            className="relative rounded-lg p-2 text-content-3 transition hover:bg-card-hover hover:text-content"
            aria-label="Notifications"
          >
            <Bell className="h-[18px] w-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* Account */}
          <div ref={accountRef} className="relative">
            <button
              onClick={() => setShowAccountMenu(!showAccountMenu)}
              className="flex items-center gap-2 rounded-lg px-1.5 py-1 transition hover:bg-card-hover sm:px-2"
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-8 w-8 rounded-full ring-1 ring-edge"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600/30 text-sm font-medium text-indigo-300 ring-1 ring-indigo-500/30">
                  {user.name?.charAt(0)?.toUpperCase()}
                </div>
              )}
              <ChevronDown className="hidden h-3.5 w-3.5 text-content-3 sm:block" />
            </button>

            {showAccountMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-2xl border border-edge bg-popover shadow-2xl shadow-black/20 backdrop-blur-xl">
                <div className="border-b border-edge px-4 py-3">
                  <p className="truncate text-sm font-medium text-content">
                    {user.name}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-content-3">
                    {user.email}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-400 ring-1 ring-indigo-500/20">
                    <Sparkles className="h-3 w-3" />
                    {planLabel}
                  </div>
                </div>
                <div className="py-1">
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setShowAccountMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-content-2 transition hover:bg-card-hover hover:text-content"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <Link
                    href="/dashboard/settings/billing"
                    onClick={() => setShowAccountMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-content-2 transition hover:bg-card-hover hover:text-content"
                  >
                    <CreditCard className="h-4 w-4" />
                    Billing & Plan
                  </Link>
                </div>
                <div className="border-t border-edge py-1">
                  <button
                    onClick={() => {
                      setShowAccountMenu(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-400/80 transition hover:bg-red-500/10 hover:text-red-400"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
