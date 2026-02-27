"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { DashboardStats } from "@/types";
import {
  Users,
  FileText,
  Key,
  DollarSign,
  Brain,
  CreditCard,
  TrendingUp,
  Crown,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .getDashboard()
      .then((r) => setStats(r.data))
      .catch(() => toast.error("Failed to load stats"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  const cards = [
    {
      label: "Total Users",
      value: stats?.totalUsers || 0,
      icon: Users,
      color: "indigo",
    },
    {
      label: "Total CVs",
      value: stats?.totalCvs || 0,
      icon: FileText,
      color: "emerald",
    },
    {
      label: "Active Sessions",
      value: stats?.totalSessions || 0,
      icon: Key,
      color: "purple",
    },
    {
      label: "Est. MRR",
      value: `$${stats?.estimatedMrr?.toFixed(0) || 0}`,
      icon: DollarSign,
      color: "amber",
    },
    {
      label: "AI Requests",
      value: stats?.aiUsage?.totalRequests || 0,
      icon: Brain,
      color: "cyan",
    },
    {
      label: "AI Cost",
      value: `$${(stats?.aiUsage?.totalCostUsd || 0).toFixed(2)}`,
      icon: Zap,
      color: "rose",
    },
  ];

  const colorMap: Record<string, { bg: string; ring: string; text: string }> = {
    indigo: {
      bg: "bg-indigo-600/20",
      ring: "ring-indigo-500/20",
      text: "text-indigo-400",
    },
    emerald: {
      bg: "bg-emerald-600/20",
      ring: "ring-emerald-500/20",
      text: "text-emerald-400",
    },
    purple: {
      bg: "bg-purple-600/20",
      ring: "ring-purple-500/20",
      text: "text-purple-400",
    },
    amber: {
      bg: "bg-amber-600/20",
      ring: "ring-amber-500/20",
      text: "text-amber-400",
    },
    cyan: {
      bg: "bg-cyan-600/20",
      ring: "ring-cyan-500/20",
      text: "text-cyan-400",
    },
    rose: {
      bg: "bg-rose-600/20",
      ring: "ring-rose-500/20",
      text: "text-rose-400",
    },
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-content">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-content-3">
          Platform overview and analytics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const c = colorMap[card.color] || colorMap.indigo;
          return (
            <div
              key={card.label}
              className="rounded-2xl border border-edge bg-card p-6"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${c.bg} ring-1 ${c.ring}`}
                >
                  <card.icon className={`h-6 w-6 ${c.text}`} />
                </div>
                <div>
                  <p className="text-sm text-content-3">{card.label}</p>
                  <p className="text-3xl font-bold text-content">
                    {card.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Subscriptions Breakdown */}
      {stats?.subscriptions && (
        <div className="rounded-2xl border border-edge bg-card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-content">
            <CreditCard className="h-5 w-5 text-indigo-400" />
            Subscription Breakdown
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {Object.entries(stats.subscriptions.byPlan || {}).map(
              ([plan, count]) => (
                <div
                  key={plan}
                  className="rounded-xl border border-edge bg-card p-4 text-center"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    {plan === "premium" ? (
                      <Crown className="h-4 w-4 text-amber-400" />
                    ) : plan === "enterprise" ? (
                      <Crown className="h-4 w-4 text-purple-400" />
                    ) : (
                      <Zap className="h-4 w-4 text-content-2" />
                    )}
                    <p className="text-sm font-medium capitalize text-content">
                      {plan}
                    </p>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-content">
                    {count as number}
                  </p>
                </div>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}
