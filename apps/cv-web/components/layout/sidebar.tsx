"use client";

import { useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useAuthStore,
  useSidebarStore,
  useSubscriptionStore,
} from "@/lib/store";
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Palette,
  Wand2,
  Settings,
  CreditCard,
  Shield,
  Crown,
  Building2,
  X,
} from "lucide-react";

const mainLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/cv/generate", label: "CV Builder", icon: FileText },
  { href: "/dashboard/projects", label: "Projects", icon: FolderOpen },
  { href: "/dashboard/templates", label: "Templates", icon: Palette },
  { href: "/dashboard/ai-tools", label: "AI Tools", icon: Wand2 },
  { href: "/dashboard/organizations", label: "Organizations", icon: Building2 },
];

const bottomLinks = [
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/dashboard/settings/billing", label: "Billing", icon: CreditCard },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { subscription } = useSubscriptionStore();
  const { isOpen, close } = useSidebarStore();

  const isActive = (path: string) => {
    if (!pathname) return false;
    if (path === "/dashboard") return pathname === "/dashboard";
    // For settings root, only match exact — not sub-routes like billing
    if (path === "/dashboard/settings") {
      return (
        pathname === "/dashboard/settings" ||
        pathname === "/dashboard/settings/api-keys"
      );
    }
    return pathname.startsWith(path);
  };

  // Close sidebar on route change (mobile)
  useEffect(() => {
    close();
  }, [pathname, close]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [close]);

  const planLabel =
    subscription?.plan === "enterprise"
      ? "Enterprise"
      : subscription?.plan === "premium"
        ? "Premium"
        : "Free";

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-edge px-5">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5"
          onClick={close}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/20 ring-1 ring-indigo-500/30">
            <FileText className="h-4 w-4 text-indigo-400" />
          </div>
          <span className="text-lg font-bold tracking-tight text-content">
            Go<span className="text-gradient">CV</span>
          </span>
        </Link>
        <button
          onClick={close}
          className="rounded-lg p-1.5 text-content-3 transition hover:bg-card-hover hover:text-content lg:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Upgrade banner */}
      {subscription?.plan === "free" && (
        <div className="mx-3 mt-4">
          <Link
            href="/dashboard/settings/billing"
            onClick={close}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600/10 to-purple-600/10 px-3 py-2.5 text-sm font-medium text-indigo-400 ring-1 ring-indigo-500/20 transition hover:from-indigo-600/20 hover:to-purple-600/20"
          >
            <Crown className="h-4 w-4" />
            <span>Upgrade to Pro</span>
          </Link>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-content-4">
          Menu
        </p>
        <div className="space-y-0.5">
          {mainLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                isActive(link.href)
                  ? "bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/15"
                  : "text-content-2 hover:bg-card-hover hover:text-content"
              }`}
            >
              <link.icon className="h-[18px] w-[18px]" />
              {link.label}
            </Link>
          ))}
          {(user?.role === "admin" || user?.role === "super_admin") && (
            <Link
              href="/admin"
              onClick={close}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                pathname?.startsWith("/admin")
                  ? "bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/15"
                  : "text-orange-400/70 hover:bg-orange-500/10 hover:text-orange-400"
              }`}
            >
              <Shield className="h-[18px] w-[18px]" />
              Admin Panel
            </Link>
          )}
        </div>

        <div className="my-4 h-px bg-edge" />

        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-content-4">
          Account
        </p>
        <div className="space-y-0.5">
          {bottomLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                isActive(link.href)
                  ? "bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/15"
                  : "text-content-2 hover:bg-card-hover hover:text-content"
              }`}
            >
              <link.icon className="h-[18px] w-[18px]" />
              {link.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* User Info */}
      <div className="shrink-0 border-t border-edge p-3">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="h-9 w-9 shrink-0 rounded-full ring-1 ring-edge"
            />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600/30 text-sm font-semibold text-indigo-300 ring-1 ring-indigo-500/30">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-content">
              {user?.name}
            </p>
            <div className="flex items-center gap-1.5">
              <div
                className={`h-1.5 w-1.5 rounded-full ${
                  subscription?.plan === "premium" ||
                  subscription?.plan === "enterprise"
                    ? "bg-indigo-400"
                    : "bg-content-4"
                }`}
              />
              <p className="text-xs text-content-3">{planLabel}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] border-r border-edge bg-surface lg:block">
        {sidebarContent}
      </aside>

      {/* Mobile drawer overlay */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${
          isOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          onClick={close}
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        {/* Panel */}
        <aside
          className={`absolute inset-y-0 left-0 w-[280px] bg-surface shadow-2xl transition-transform duration-300 ease-out ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {sidebarContent}
        </aside>
      </div>
    </>
  );
}
