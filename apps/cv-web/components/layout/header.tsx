"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  useAuthStore,
  useThemeStore,
  useNotificationsStore,
  useSubscriptionStore,
} from "@/lib/store";
import {
  authApi,
  notificationsApi,
  subscriptionsApi,
} from "@/lib/api";
import {
  LogOut,
  User,
  FileText,
  FolderOpen,
  LayoutDashboard,
  Shield,
  Bell,
  Sun,
  Moon,
  Sparkles,
  Crown,
  ChevronDown,
  Settings,
  CreditCard,
  Palette,
  Wand2,
  X,
  Check,
  Zap,
  Menu,
} from "lucide-react";

export default function Header() {
  const { user, clearAuth } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { notifications, unreadCount, setNotifications, setUnreadCount, markAsRead, markAllAsRead } =
    useNotificationsStore();
  const { subscription, setSubscription } = useSubscriptionStore();
  const router = useRouter();
  const pathname = usePathname();

  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      notificationsApi.getAll().then((r) => setNotifications(r.data)).catch(() => {});
      notificationsApi.getUnreadCount().then((r) => setUnreadCount(r.data.count ?? r.data)).catch(() => {});
      subscriptionsApi.getMy().then((r) => setSubscription(r.data)).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setShowAccountMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    clearAuth();
    router.push("/login");
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      markAllAsRead();
    } catch {}
  };

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      markAsRead(id);
    } catch {}
  };

  if (!user) return null;

  const planLabel = subscription?.plan === "enterprise"
    ? "Enterprise"
    : subscription?.plan === "premium"
      ? "Premium"
      : "Free";

  const isActive = (path: string) =>
    pathname === path || pathname?.startsWith(path + "/");

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/cv/builder", label: "CV Builder", icon: FileText },
    { href: "/dashboard/projects", label: "Projects", icon: FolderOpen },
    { href: "/dashboard/templates", label: "Templates", icon: Palette },
    { href: "/dashboard/ai-tools", label: "AI Tools", icon: Wand2 },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#08081a]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/20 ring-1 ring-indigo-500/30">
            <FileText className="h-4 w-4 text-indigo-400" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            Go<span className="text-gradient">CV</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-0.5 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                isActive(link.href)
                  ? "bg-white/[0.08] text-white"
                  : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
          {user.role === "admin" && (
            <Link
              href="/admin"
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                isActive("/admin")
                  ? "bg-orange-500/10 text-orange-400"
                  : "text-orange-400/80 hover:bg-orange-500/10 hover:text-orange-400"
              }`}
            >
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Upgrade button (only for free users) */}
          {subscription?.plan === "free" && (
            <Link
              href="/dashboard/settings/billing"
              className="hidden items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:shadow-indigo-500/40 sm:flex"
            >
              <Crown className="h-3.5 w-3.5" />
              Upgrade
            </Link>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="rounded-xl p-2 text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-300"
            title={theme === "dark" ? "Switch to light" : "Switch to dark"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative rounded-xl p-2 text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-300"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0f0f23]/95 shadow-2xl shadow-black/40 backdrop-blur-xl sm:w-96">
                <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                  <h3 className="text-sm font-semibold text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-zinc-500">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((notif) => (
                      <button
                        key={notif._id}
                        onClick={() => {
                          handleMarkRead(notif._id);
                          if (notif.actionUrl) router.push(notif.actionUrl);
                          setShowNotifications(false);
                        }}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-white/[0.03] ${
                          !notif.read ? "bg-indigo-500/[0.04]" : ""
                        }`}
                      >
                        <div
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                            notif.type === "success"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : notif.type === "warning"
                                ? "bg-amber-500/20 text-amber-400"
                                : notif.type === "error"
                                  ? "bg-red-500/20 text-red-400"
                                  : notif.type === "upgrade"
                                    ? "bg-purple-500/20 text-purple-400"
                                    : "bg-indigo-500/20 text-indigo-400"
                          }`}
                        >
                          {notif.type === "upgrade" ? (
                            <Crown className="h-4 w-4" />
                          ) : notif.type === "success" ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Zap className="h-4 w-4" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-white">{notif.title}</p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-zinc-400">
                            {notif.message}
                          </p>
                          <p className="mt-1 text-[10px] text-zinc-600">
                            {new Date(notif.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {!notif.read && (
                          <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Account Dropdown */}
          <div ref={accountRef} className="relative">
            <button
              onClick={() => setShowAccountMenu(!showAccountMenu)}
              className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-white/[0.04]"
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-8 w-8 rounded-full ring-1 ring-white/10"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600/30 text-sm font-medium text-indigo-300 ring-1 ring-indigo-500/30">
                  {user.name?.charAt(0)?.toUpperCase()}
                </div>
              )}
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium leading-none text-zinc-200">{user.name}</p>
                <p className="mt-0.5 text-xs text-zinc-500">{planLabel} Plan</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
            </button>

            {showAccountMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0f0f23]/95 shadow-2xl shadow-black/40 backdrop-blur-xl">
                <div className="border-b border-white/[0.06] px-4 py-3">
                  <p className="text-sm font-medium text-white">{user.name}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">{user.email}</p>
                  <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-400 ring-1 ring-indigo-500/20">
                    <Sparkles className="h-3 w-3" />
                    {planLabel}
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setShowAccountMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-400 transition hover:bg-white/[0.04] hover:text-white"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <Link
                    href="/dashboard/settings/billing"
                    onClick={() => setShowAccountMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-400 transition hover:bg-white/[0.04] hover:text-white"
                  >
                    <CreditCard className="h-4 w-4" />
                    Billing & Plan
                  </Link>
                </div>

                <div className="border-t border-white/[0.06] py-1">
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

          {/* Mobile menu toggle */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="rounded-xl p-2 text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-300 lg:hidden"
          >
            {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {showMobileMenu && (
        <div className="border-t border-white/[0.06] bg-[#08081a]/95 px-4 py-3 backdrop-blur-xl lg:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setShowMobileMenu(false)}
                className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive(link.href)
                    ? "bg-white/[0.08] text-white"
                    : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
            {user.role === "admin" && (
              <Link
                href="/admin"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-orange-400/80 transition hover:bg-orange-500/10 hover:text-orange-400"
              >
                <Shield className="h-4 w-4" />
                Admin
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
