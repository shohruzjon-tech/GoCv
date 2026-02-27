"use client";

import { useEffect, useState, useCallback } from "react";
import { adminApi } from "@/lib/api";
import toast from "react-hot-toast";
import {
  CreditCard,
  Loader2,
  Crown,
  Zap,
  Shield,
  Search,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Ban,
  Save,
  FileText,
  Users,
  TrendingUp,
} from "lucide-react";

type Plan = "free" | "premium" | "enterprise";
type Status = "active" | "cancelled" | "expired" | "trial";

interface SubRecord {
  _id: string;
  userId: { _id: string; name: string; email: string } | string;
  plan: Plan;
  status: Status;
  limits: {
    maxCvs: number;
    maxProjects: number;
    maxAiCreditsPerMonth: number;
    maxPdfExportsPerMonth: number;
    hasCustomDomain: boolean;
    hasAdvancedAiTools: boolean;
    hasPremiumTemplates: boolean;
    hasCustomBranding: boolean;
    hasPrioritySupport: boolean;
  };
  currentUsage: {
    aiCreditsUsed: number;
    pdfExportsUsed: number;
    cvsCreated: number;
    projectsCreated: number;
  };
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  cancelAtPeriodEnd?: boolean;
  pricePerMonth: number;
  pricePerYear: number;
  createdAt: string;
}

export default function AdminSubscriptionsPage() {
  const [subs, setSubs] = useState<SubRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filterPlan, setFilterPlan] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [editingSub, setEditingSub] = useState<SubRecord | null>(null);
  const [editPlan, setEditPlan] = useState<Plan>("free");
  const [editStatus, setEditStatus] = useState<Status>("active");
  const [editExtendDays, setEditExtendDays] = useState(0);
  const [saving, setSaving] = useState(false);

  const limit = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (filterPlan) filters.plan = filterPlan;
      if (filterStatus) filters.status = filterStatus;

      const [subsRes, statsRes] = await Promise.all([
        adminApi.getSubscriptions(page, limit, filters),
        adminApi.getSubscriptionStats(),
      ]);
      const data = subsRes.data;
      setSubs(data.subscriptions || data);
      setTotal(data.total || 0);
      setStats(statsRes.data);
    } catch {
      toast.error("Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  }, [page, filterPlan, filterStatus]);

  useEffect(() => {
    load();
  }, [load]);

  const getUserInfo = (sub: SubRecord) => {
    if (typeof sub.userId === "object" && sub.userId !== null) {
      return {
        name: sub.userId.name,
        email: sub.userId.email,
        id: sub.userId._id,
      };
    }
    return { name: "Unknown", email: "", id: String(sub.userId) };
  };

  const planIcon = (plan: string) => {
    if (plan === "enterprise")
      return <Shield className="h-4 w-4 text-purple-400" />;
    if (plan === "premium") return <Crown className="h-4 w-4 text-amber-400" />;
    return <Zap className="h-4 w-4 text-zinc-400" />;
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-500/10 text-emerald-400";
      case "trial":
        return "bg-blue-500/10 text-blue-400";
      case "cancelled":
        return "bg-red-500/10 text-red-400";
      case "expired":
        return "bg-zinc-500/10 text-zinc-400";
      default:
        return "bg-zinc-500/10 text-zinc-400";
    }
  };

  const planColor = (plan: string) => {
    switch (plan) {
      case "enterprise":
        return "bg-purple-500/10 text-purple-400";
      case "premium":
        return "bg-amber-500/10 text-amber-400";
      default:
        return "bg-zinc-500/10 text-zinc-400";
    }
  };

  const openEdit = (sub: SubRecord) => {
    setEditingSub(sub);
    setEditPlan(sub.plan);
    setEditStatus(sub.status);
    setEditExtendDays(0);
  };

  const handleSave = async () => {
    if (!editingSub) return;
    setSaving(true);
    try {
      const userInfo = getUserInfo(editingSub);
      const payload: any = {};

      if (editPlan !== editingSub.plan) payload.plan = editPlan;
      if (editStatus !== editingSub.status) payload.status = editStatus;
      if (editExtendDays > 0) payload.extendDays = editExtendDays;

      if (Object.keys(payload).length === 0) {
        toast("No changes to save");
        setEditingSub(null);
        return;
      }

      await adminApi.updateSubscription(userInfo.id, payload);
      toast.success("Subscription updated");
      setEditingSub(null);
      load();
    } catch {
      toast.error("Failed to update subscription");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (sub: SubRecord) => {
    const user = getUserInfo(sub);
    if (
      !confirm(
        `Cancel subscription for ${user.name || user.email}? This will downgrade to Free.`,
      )
    )
      return;
    try {
      await adminApi.cancelSubscription(user.id);
      toast.success("Subscription cancelled");
      load();
    } catch {
      toast.error("Failed to cancel subscription");
    }
  };

  const handleResetUsage = async (sub: SubRecord) => {
    const user = getUserInfo(sub);
    if (!confirm(`Reset usage counters for ${user.name || user.email}?`))
      return;
    try {
      await adminApi.resetSubscriptionUsage(user.id);
      toast.success("Usage reset");
      load();
    } catch {
      toast.error("Failed to reset usage");
    }
  };

  const usagePercent = (used: number, max: number) => {
    if (max === -1) return 0;
    if (max === 0) return 100;
    return Math.min(100, Math.round((used / max) * 100));
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Subscriptions</h1>
          <p className="text-sm text-zinc-500">
            Manage user subscriptions, plans, and usage
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2 text-sm text-zinc-400 transition hover:bg-white/[0.04] hover:text-white"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-indigo-400/10 p-2.5">
                <Users className="h-4 w-4 text-indigo-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-500">Total</p>
                <p className="text-lg font-bold text-white">
                  {(stats.totalFree || 0) +
                    (stats.totalPremium || 0) +
                    (stats.totalEnterprise || 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-zinc-400/10 p-2.5">
                <Zap className="h-4 w-4 text-zinc-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-500">Free</p>
                <p className="text-lg font-bold text-white">
                  {stats.totalFree || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-400/10 p-2.5">
                <Crown className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-500">Premium</p>
                <p className="text-lg font-bold text-white">
                  {stats.totalPremium || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-purple-400/10 p-2.5">
                <Shield className="h-4 w-4 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-500">Enterprise</p>
                <p className="text-lg font-bold text-white">
                  {stats.totalEnterprise || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-400/10 p-2.5">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-500">Est. MRR</p>
                <p className="text-lg font-bold text-white">
                  ${((stats.totalRevenue || 0) / 100).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
          <Search className="h-4 w-4 text-zinc-500" />
          <select
            value={filterPlan}
            onChange={(e) => {
              setFilterPlan(e.target.value);
              setPage(1);
            }}
            className="bg-transparent text-sm text-zinc-300 outline-none"
          >
            <option value="" className="bg-[#0a0a1e]">
              All Plans
            </option>
            <option value="free" className="bg-[#0a0a1e]">
              Free
            </option>
            <option value="premium" className="bg-[#0a0a1e]">
              Premium
            </option>
            <option value="enterprise" className="bg-[#0a0a1e]">
              Enterprise
            </option>
          </select>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
            className="bg-transparent text-sm text-zinc-300 outline-none"
          >
            <option value="" className="bg-[#0a0a1e]">
              All Status
            </option>
            <option value="active" className="bg-[#0a0a1e]">
              Active
            </option>
            <option value="cancelled" className="bg-[#0a0a1e]">
              Cancelled
            </option>
            <option value="expired" className="bg-[#0a0a1e]">
              Expired
            </option>
            <option value="trial" className="bg-[#0a0a1e]">
              Trial
            </option>
          </select>
        </div>
        {(filterPlan || filterStatus) && (
          <button
            onClick={() => {
              setFilterPlan("");
              setFilterStatus("");
              setPage(1);
            }}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-zinc-500 hover:text-zinc-300"
          >
            <X className="h-3 w-3" /> Clear filters
          </button>
        )}
        <span className="ml-auto text-xs text-zinc-600">
          {total} subscription{total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/[0.06]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">
                    Plan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">
                    AI Usage
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">
                    PDF Exports
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">
                    Period End
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">
                    Price
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => {
                  const user = getUserInfo(s);
                  const aiPct = usagePercent(
                    s.currentUsage?.aiCreditsUsed || 0,
                    s.limits?.maxAiCreditsPerMonth || 0,
                  );
                  const pdfPct = usagePercent(
                    s.currentUsage?.pdfExportsUsed || 0,
                    s.limits?.maxPdfExportsPerMonth || 0,
                  );
                  return (
                    <tr
                      key={s._id}
                      className="border-b border-white/[0.04] transition hover:bg-white/[0.02]"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-white">
                            {user.name}
                          </p>
                          <p className="text-xs text-zinc-500">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${planColor(s.plan)}`}
                        >
                          {planIcon(s.plan)} {s.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusColor(s.status)}`}
                        >
                          {s.status}
                          {s.cancelAtPeriodEnd && (
                            <span className="ml-1 text-[10px] opacity-60">
                              (ends)
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-24">
                          <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-0.5">
                            <span>{s.currentUsage?.aiCreditsUsed || 0}</span>
                            <span>
                              {s.limits?.maxAiCreditsPerMonth === -1
                                ? "∞"
                                : s.limits?.maxAiCreditsPerMonth}
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.04]">
                            <div
                              className={`h-full rounded-full transition-all ${aiPct > 80 ? "bg-red-500" : aiPct > 50 ? "bg-amber-500" : "bg-emerald-500"}`}
                              style={{
                                width: `${s.limits?.maxAiCreditsPerMonth === -1 ? 0 : aiPct}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-20">
                          <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-0.5">
                            <span>{s.currentUsage?.pdfExportsUsed || 0}</span>
                            <span>
                              {s.limits?.maxPdfExportsPerMonth === -1
                                ? "∞"
                                : s.limits?.maxPdfExportsPerMonth}
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.04]">
                            <div
                              className={`h-full rounded-full transition-all ${pdfPct > 80 ? "bg-red-500" : pdfPct > 50 ? "bg-amber-500" : "bg-indigo-500"}`}
                              style={{
                                width: `${s.limits?.maxPdfExportsPerMonth === -1 ? 0 : pdfPct}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-500">
                        {s.currentPeriodEnd
                          ? new Date(s.currentPeriodEnd).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-300">
                        {s.pricePerMonth
                          ? `$${(s.pricePerMonth / 100).toFixed(0)}/mo`
                          : "Free"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(s)}
                            className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-white/[0.06] hover:text-white"
                            title="Edit subscription"
                          >
                            <FileText className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleResetUsage(s)}
                            className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-amber-500/10 hover:text-amber-400"
                            title="Reset usage"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                          {s.plan !== "free" && (
                            <button
                              onClick={() => handleCancel(s)}
                              className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-red-500/10 hover:text-red-400"
                              title="Cancel subscription"
                            >
                              <Ban className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {subs.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-12 text-center text-sm text-zinc-500"
                    >
                      No subscriptions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-600">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-white/[0.06] p-2 text-zinc-400 transition hover:bg-white/[0.04] disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg border border-white/[0.06] p-2 text-zinc-400 transition hover:bg-white/[0.04] disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#0c0c20] p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Edit Subscription
                </h2>
                <p className="text-sm text-zinc-500">
                  {getUserInfo(editingSub).name} —{" "}
                  {getUserInfo(editingSub).email}
                </p>
              </div>
              <button
                onClick={() => setEditingSub(null)}
                className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-white/[0.06] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Plan */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Plan
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["free", "premium", "enterprise"] as Plan[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setEditPlan(p)}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium capitalize transition ${
                        editPlan === p
                          ? "border-orange-500/30 bg-orange-500/10 text-orange-400"
                          : "border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:bg-white/[0.04]"
                      }`}
                    >
                      {planIcon(p)} {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as Status)}
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-sm text-zinc-300 outline-none focus:border-orange-500/30"
                >
                  <option value="active" className="bg-[#0a0a1e]">
                    Active
                  </option>
                  <option value="cancelled" className="bg-[#0a0a1e]">
                    Cancelled
                  </option>
                  <option value="expired" className="bg-[#0a0a1e]">
                    Expired
                  </option>
                  <option value="trial" className="bg-[#0a0a1e]">
                    Trial
                  </option>
                </select>
              </div>

              {/* Extend Period */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  Extend Period (days)
                </label>
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={editExtendDays}
                  onChange={(e) => setEditExtendDays(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-sm text-zinc-300 outline-none focus:border-orange-500/30"
                  placeholder="0"
                />
                <p className="mt-1 text-[10px] text-zinc-600">
                  Current period ends:{" "}
                  {editingSub.currentPeriodEnd
                    ? new Date(editingSub.currentPeriodEnd).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>

              {/* Current Usage Summary */}
              <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                  Current Usage
                </p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-zinc-500">AI Credits: </span>
                    <span className="text-white">
                      {editingSub.currentUsage?.aiCreditsUsed || 0} /{" "}
                      {editingSub.limits?.maxAiCreditsPerMonth === -1
                        ? "∞"
                        : editingSub.limits?.maxAiCreditsPerMonth}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500">PDF Exports: </span>
                    <span className="text-white">
                      {editingSub.currentUsage?.pdfExportsUsed || 0} /{" "}
                      {editingSub.limits?.maxPdfExportsPerMonth === -1
                        ? "∞"
                        : editingSub.limits?.maxPdfExportsPerMonth}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500">CVs: </span>
                    <span className="text-white">
                      {editingSub.currentUsage?.cvsCreated || 0} /{" "}
                      {editingSub.limits?.maxCvs === -1
                        ? "∞"
                        : editingSub.limits?.maxCvs}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Projects: </span>
                    <span className="text-white">
                      {editingSub.currentUsage?.projectsCreated || 0} /{" "}
                      {editingSub.limits?.maxProjects === -1
                        ? "∞"
                        : editingSub.limits?.maxProjects}
                    </span>
                  </div>
                </div>
                {editingSub.stripeSubscriptionId && (
                  <div className="mt-2 border-t border-white/[0.04] pt-2">
                    <span className="text-[10px] text-zinc-600">
                      Stripe ID:{" "}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {editingSub.stripeSubscriptionId}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setEditingSub(null)}
                className="rounded-xl border border-white/[0.06] px-4 py-2 text-sm text-zinc-400 transition hover:bg-white/[0.04]"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2 text-sm font-medium text-white transition hover:bg-orange-600 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
