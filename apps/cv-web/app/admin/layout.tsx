"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/store";
import {
  Shield,
  Users,
  Key,
  FileText,
  LayoutDashboard,
  LogOut,
  ArrowLeft,
  Palette,
  CreditCard,
  Brain,
  ScrollText,
  Flag,
  DollarSign,
  Bell,
  Tag,
  UserCircle,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, clearAuth } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (!isLoginPage && !isLoading && (!user || user.role !== "admin")) {
      router.push("/admin/login");
    }
  }, [user, isLoading, router, isLoginPage]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (!user || user.role !== "admin") return null;

  const sections = [
    {
      title: "Overview",
      links: [
        { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
        { href: "/admin/revenue", icon: DollarSign, label: "Revenue" },
        { href: "/admin/creator", icon: UserCircle, label: "About Creator" },
      ],
    },
    {
      title: "Management",
      links: [
        { href: "/admin/users", icon: Users, label: "Users" },
        { href: "/admin/cvs", icon: FileText, label: "CVs" },
        { href: "/admin/templates", icon: Palette, label: "Templates" },
        {
          href: "/admin/subscriptions",
          icon: CreditCard,
          label: "Subscriptions",
        },
        { href: "/admin/plans", icon: Tag, label: "Plans & Pricing" },
      ],
    },
    {
      title: "AI & System",
      links: [
        { href: "/admin/ai-usage", icon: Brain, label: "AI Usage" },
        { href: "/admin/feature-flags", icon: Flag, label: "Feature Flags" },
        { href: "/admin/audit-logs", icon: ScrollText, label: "Audit Logs" },
        { href: "/admin/sessions", icon: Key, label: "Sessions" },
      ],
    },
  ];

  const handleLogout = () => {
    clearAuth();
    router.push("/admin/login");
  };

  return (
    <div className="flex min-h-screen bg-page">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-edge bg-surface">
        <div className="flex h-16 items-center gap-2 border-b border-edge px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 ring-1 ring-orange-500/20">
            <Shield className="h-4 w-4 text-orange-400" />
          </div>
          <span className="text-lg font-bold text-content">Admin Panel</span>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-content-4">
                {section.title}
              </p>
              <div className="space-y-1">
                {section.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      pathname === link.href
                        ? "bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20"
                        : "text-content-2 hover:bg-card-hover hover:text-content"
                    }`}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-edge p-4">
          <Link
            href="/dashboard"
            className="mb-2 flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-content-3 transition hover:bg-card-hover hover:text-content-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to App
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8">{children}</main>
    </div>
  );
}
