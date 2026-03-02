"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";
import {
  ArrowLeft,
  User,
  Mail,
  MapPin,
  Globe,
  Calendar,
  Clock,
  Shield,
  Activity,
  CreditCard,
  FileText,
  Brain,
  Monitor,
  Loader2,
  UserCheck,
  UserX,
  Key,
  Trash2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Zap,
  BarChart3,
  History,
  LogOut,
} from "lucide-react";
import toast from "react-hot-toast";

type Tab = "overview" | "activity" | "sessions" | "ai-usage";

export default function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    loadUser();
  }, [id]);

  const loadUser = async () => {
    try {
      const res = await adminApi.getUserDetail(id);
      setData(res.data);
    } catch {
      toast.error("Failed to load user details");
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async () => {
    if (!data) return;
    const isActive = data.user.isActive !== false;
    try {
      await adminApi.toggleUserActive(id, !isActive);
      setData((prev: any) => ({
        ...prev,
        user: { ...prev.user, isActive: !isActive },
      }));
      toast.success(isActive ? "User deactivated" : "User activated");
    } catch {
      toast.error("Failed to update user");
    }
  };

  const terminateSessions = async () => {
    try {
      await adminApi.terminateAllUserSessions(id);
      setData((prev: any) => ({
        ...prev,
        activeSessions: 0,
        sessions: prev.sessions.map((s: any) => ({
          ...s,
          isActive: false,
        })),
      }));
      toast.success("All sessions terminated");
    } catch {
      toast.error("Failed to terminate sessions");
    }
  };

  const deleteUser = async () => {
    if (!confirm("Are you sure? This action is irreversible.")) return;
    try {
      await adminApi.deleteUser(id);
      toast.success("User deleted");
      router.push("/admin/users");
    } catch {
      toast.error("Failed to delete user");
    }
  };

  const changeRole = async (role: string) => {
    try {
      await adminApi.changeUserRole(id, role);
      setData((prev: any) => ({
        ...prev,
        user: { ...prev.user, role },
      }));
      toast.success("Role updated");
    } catch {
      toast.error("Failed to update role");
    }
  };

  const formatDate = (d: string | undefined) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatRelative = (d: string | undefined) => {
    if (!d) return "Never";
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return formatDate(d);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <XCircle className="h-10 w-10 text-red-400" />
        <p className="text-content-2">User not found</p>
        <button
          onClick={() => router.push("/admin/users")}
          className="text-sm text-orange-400 hover:text-orange-300"
        >
          ← Back to Users
        </button>
      </div>
    );
  }

  const user = data.user;
  const isActive = user.isActive !== false;

  const TABS: { key: Tab; label: string; icon: any }[] = [
    { key: "overview", label: "Overview", icon: User },
    { key: "activity", label: "Activity Log", icon: History },
    { key: "sessions", label: "Sessions", icon: Monitor },
    { key: "ai-usage", label: "AI Usage", icon: Brain },
  ];

  return (
    <div>
      {/* Back button */}
      <button
        onClick={() => router.push("/admin/users")}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-content-3 transition hover:text-content-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Users
      </button>

      {/* User Header Card */}
      <div className="mb-6 rounded-2xl border border-edge bg-card p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {/* Avatar */}
          <div className="relative shrink-0">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt=""
                className="h-20 w-20 rounded-2xl object-cover ring-2 ring-edge"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 text-2xl font-bold text-orange-400 ring-2 ring-orange-500/20">
                {user.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
            )}
            <div
              className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-card ${
                isActive ? "bg-emerald-400" : "bg-red-400"
              }`}
            />
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold text-content">{user.name}</h1>
                {user.headline && (
                  <p className="mt-0.5 text-sm text-content-2">
                    {user.headline}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-content-3">
                  <span className="inline-flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    {user.email}
                  </span>
                  {user.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {user.location}
                    </span>
                  )}
                  {user.website && (
                    <a
                      href={user.website}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-orange-400 hover:text-orange-300"
                    >
                      <Globe className="h-3.5 w-3.5" />
                      Website
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {/* Role badge */}
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      user.role === "admin" || user.role === "super_admin"
                        ? "bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20"
                        : "bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/20"
                    }`}
                  >
                    <Shield className="h-3 w-3" />
                    {user.role === "super_admin"
                      ? "Super Admin"
                      : user.role === "admin"
                        ? "Admin"
                        : "User"}
                  </span>
                  {/* Active badge */}
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      isActive
                        ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                        : "bg-red-500/10 text-red-400 ring-1 ring-red-500/20"
                    }`}
                  >
                    {isActive ? "Active" : "Inactive"}
                  </span>
                  {/* Email verification */}
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      user.isEmailVerified
                        ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20"
                    }`}
                  >
                    {user.isEmailVerified ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" /> Verified
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3" /> Unverified
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={toggleActive}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-red-600/10 text-red-400 ring-1 ring-red-500/20 hover:bg-red-600/20"
                      : "bg-emerald-600/10 text-emerald-400 ring-1 ring-emerald-500/20 hover:bg-emerald-600/20"
                  }`}
                >
                  {isActive ? (
                    <>
                      <UserX className="h-4 w-4" /> Deactivate
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4" /> Activate
                    </>
                  )}
                </button>
                <button
                  onClick={terminateSessions}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600/10 px-4 py-2 text-sm font-medium text-orange-400 ring-1 ring-orange-500/20 transition hover:bg-orange-600/20"
                >
                  <Key className="h-4 w-4" /> End Sessions
                </button>
                <button
                  onClick={deleteUser}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-red-600/10 px-3 py-2 text-sm font-medium text-red-400 ring-1 ring-red-500/20 transition hover:bg-red-600/20"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={<FileText className="h-5 w-5 text-sky-400" />}
          label="CVs Created"
          value={data.cvCount}
        />
        <StatCard
          icon={<Brain className="h-5 w-5 text-purple-400" />}
          label="AI Requests"
          value={data.totalAiRequests}
        />
        <StatCard
          icon={<Monitor className="h-5 w-5 text-emerald-400" />}
          label="Active Sessions"
          value={data.activeSessions}
        />
        <StatCard
          icon={<Activity className="h-5 w-5 text-orange-400" />}
          label="Audit Events"
          value={data.auditTotal}
        />
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl border border-edge bg-card/60 p-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                tab === t.key
                  ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20"
                  : "text-content-3 hover:text-content-2 hover:bg-card-hover"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {tab === "overview" && (
        <OverviewTab data={data} onRoleChange={changeRole} />
      )}
      {tab === "activity" && <ActivityTab logs={data.auditLogs} />}
      {tab === "sessions" && (
        <SessionsTab
          sessions={data.sessions}
          formatDate={formatDate}
          formatRelative={formatRelative}
        />
      )}
      {tab === "ai-usage" && (
        <AiUsageTab
          aiStats={data.aiStats}
          recentUsage={data.recentAiUsage}
          formatDate={formatDate}
        />
      )}
    </div>
  );
}

/* ─── Stat Card ───────────────────────────────────────────── */
function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-edge bg-card p-4">
      <div className="mb-2">{icon}</div>
      <p className="text-2xl font-bold text-content">{value ?? 0}</p>
      <p className="text-xs text-content-3">{label}</p>
    </div>
  );
}

/* ─── Overview Tab ────────────────────────────────────────── */
function OverviewTab({
  data,
  onRoleChange,
}: {
  data: any;
  onRoleChange: (role: string) => void;
}) {
  const user = data.user;
  const sub = data.subscription;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* User Details */}
      <div className="rounded-2xl border border-edge bg-card p-6">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-content">
          <User className="h-4 w-4 text-orange-400" />
          User Details
        </h3>
        <div className="space-y-3">
          <InfoRow label="Name" value={user.name} />
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="Username" value={user.username || "—"} />
          <InfoRow label="Location" value={user.location || "—"} />
          <InfoRow label="Bio" value={user.bio || "—"} />
          <InfoRow
            label="Joined"
            value={new Date(user.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          />
          <InfoRow
            label="Last Login"
            value={
              user.lastLoginAt
                ? new Date(user.lastLoginAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Never"
            }
          />
          <div className="flex items-center justify-between py-1.5">
            <span className="text-sm text-content-3">Role</span>
            <div className="flex gap-1">
              {["user", "admin", "super_admin"].map((r) => (
                <button
                  key={r}
                  onClick={() => onRoleChange(r)}
                  className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                    user.role === r
                      ? "bg-orange-600 text-white"
                      : "bg-card-hover text-content-3 hover:text-content-2"
                  }`}
                >
                  {r === "super_admin"
                    ? "Super Admin"
                    : r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Subscription */}
      <div className="rounded-2xl border border-edge bg-card p-6">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-content">
          <CreditCard className="h-4 w-4 text-orange-400" />
          Subscription
        </h3>
        {sub ? (
          <div className="space-y-3">
            <InfoRow
              label="Plan"
              value={
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2.5 py-0.5 text-xs font-medium text-orange-400 ring-1 ring-orange-500/20">
                  {sub.plan || sub.planId || "—"}
                </span>
              }
            />
            <InfoRow
              label="Status"
              value={
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    sub.status === "active"
                      ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                      : sub.status === "trialing"
                        ? "bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/20"
                        : "bg-red-500/10 text-red-400 ring-1 ring-red-500/20"
                  }`}
                >
                  {sub.status}
                </span>
              }
            />
            <InfoRow
              label="Period End"
              value={
                sub.currentPeriodEnd
                  ? new Date(sub.currentPeriodEnd).toLocaleDateString()
                  : "—"
              }
            />
            {sub.usage && (
              <>
                <InfoRow
                  label="AI Requests"
                  value={`${sub.usage.aiRequests ?? 0} / ${sub.limits?.aiRequests ?? "∞"}`}
                />
                <InfoRow
                  label="CV Exports"
                  value={`${sub.usage.cvExports ?? 0} / ${sub.limits?.cvExports ?? "∞"}`}
                />
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-content-4">
            <CreditCard className="mb-2 h-8 w-8" />
            <p className="text-sm">No subscription</p>
          </div>
        )}
      </div>

      {/* AI Stats */}
      <div className="rounded-2xl border border-edge bg-card p-6">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-content">
          <BarChart3 className="h-4 w-4 text-orange-400" />
          AI Usage (This Month)
        </h3>
        {data.aiStats ? (
          <div className="space-y-3">
            <InfoRow
              label="Total Requests"
              value={data.aiStats.totalRequests ?? 0}
            />
            <InfoRow
              label="Total Tokens"
              value={(data.aiStats.totalTokens ?? 0).toLocaleString()}
            />
            <InfoRow
              label="Estimated Cost"
              value={`$${(data.aiStats.totalCost ?? 0).toFixed(4)}`}
            />
            <InfoRow
              label="Success Rate"
              value={
                data.aiStats.totalRequests
                  ? `${(
                      ((data.aiStats.totalRequests -
                        (data.aiStats.failedRequests ?? 0)) /
                        data.aiStats.totalRequests) *
                      100
                    ).toFixed(1)}%`
                  : "—"
              }
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-content-4">
            <Brain className="mb-2 h-8 w-8" />
            <p className="text-sm">No AI usage data</p>
          </div>
        )}
      </div>

      {/* Social Links */}
      <div className="rounded-2xl border border-edge bg-card p-6">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-content">
          <Globe className="h-4 w-4 text-orange-400" />
          Social Links
        </h3>
        <div className="space-y-3">
          <InfoRow
            label="LinkedIn"
            value={
              user.socialLinks?.linkedin ? (
                <a
                  href={user.socialLinks.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-orange-400 hover:text-orange-300"
                >
                  {user.socialLinks.linkedin
                    .replace(/^https?:\/\/(www\.)?/, "")
                    .slice(0, 40)}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                "—"
              )
            }
          />
          <InfoRow
            label="GitHub"
            value={
              user.socialLinks?.github ? (
                <a
                  href={user.socialLinks.github}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-orange-400 hover:text-orange-300"
                >
                  {user.socialLinks.github
                    .replace(/^https?:\/\/(www\.)?/, "")
                    .slice(0, 40)}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                "—"
              )
            }
          />
          <InfoRow
            label="Twitter"
            value={
              user.socialLinks?.twitter ? (
                <a
                  href={user.socialLinks.twitter}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-orange-400 hover:text-orange-300"
                >
                  {user.socialLinks.twitter
                    .replace(/^https?:\/\/(www\.)?/, "")
                    .slice(0, 40)}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                "—"
              )
            }
          />
          <InfoRow
            label="Website"
            value={
              user.website ? (
                <a
                  href={user.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-orange-400 hover:text-orange-300"
                >
                  {user.website
                    .replace(/^https?:\/\/(www\.)?/, "")
                    .slice(0, 40)}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                "—"
              )
            }
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Activity Tab ────────────────────────────────────────── */
function ActivityTab({ logs }: { logs: any[] }) {
  if (!logs || logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-edge bg-card py-16 text-content-4">
        <History className="mb-2 h-8 w-8" />
        <p className="text-sm">No activity records</p>
      </div>
    );
  }

  const actionColor = (action: string) => {
    if (action.includes("delete") || action.includes("remove"))
      return "text-red-400 bg-red-500/10";
    if (action.includes("create") || action.includes("register"))
      return "text-emerald-400 bg-emerald-500/10";
    if (action.includes("login") || action.includes("auth"))
      return "text-sky-400 bg-sky-500/10";
    if (action.includes("update") || action.includes("edit"))
      return "text-amber-400 bg-amber-500/10";
    return "text-content-3 bg-card-hover";
  };

  return (
    <div className="rounded-2xl border border-edge bg-card">
      <div className="divide-y divide-edge">
        {logs.map((log, i) => (
          <div key={log._id || i} className="flex items-start gap-4 px-6 py-4">
            <div
              className={`mt-0.5 rounded-lg p-2 ${actionColor(log.action || "")}`}
            >
              <Activity className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-content">
                {log.action || "Unknown action"}
              </p>
              {log.details && (
                <p className="mt-0.5 text-xs text-content-3 truncate">
                  {typeof log.details === "string"
                    ? log.details
                    : JSON.stringify(log.details)}
                </p>
              )}
              {log.resource && (
                <p className="mt-0.5 text-xs text-content-4">
                  Resource: {log.resource}
                  {log.resourceId ? ` (${log.resourceId})` : ""}
                </p>
              )}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs text-content-3">
                {log.createdAt
                  ? new Date(log.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"}
              </p>
              {log.ipAddress && (
                <p className="mt-0.5 text-[10px] text-content-4">
                  {log.ipAddress}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Sessions Tab ────────────────────────────────────────── */
function SessionsTab({
  sessions,
  formatDate,
  formatRelative,
}: {
  sessions: any[];
  formatDate: (d: string | undefined) => string;
  formatRelative: (d: string | undefined) => string;
}) {
  if (!sessions || sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-edge bg-card py-16 text-content-4">
        <Monitor className="mb-2 h-8 w-8" />
        <p className="text-sm">No session records</p>
      </div>
    );
  }

  const activeSessions = sessions.filter((s) => s.isActive);
  const pastSessions = sessions.filter((s) => !s.isActive);

  return (
    <div className="space-y-6">
      {/* Active Sessions */}
      {activeSessions.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-content">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Active Sessions ({activeSessions.length})
          </h3>
          <div className="space-y-2">
            {activeSessions.map((s, i) => (
              <SessionCard
                key={s._id || i}
                session={s}
                active
                formatDate={formatDate}
                formatRelative={formatRelative}
              />
            ))}
          </div>
        </div>
      )}

      {/* Past Sessions */}
      {pastSessions.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-content-2">
            Past Sessions ({pastSessions.length})
          </h3>
          <div className="space-y-2">
            {pastSessions.slice(0, 20).map((s, i) => (
              <SessionCard
                key={s._id || i}
                session={s}
                formatDate={formatDate}
                formatRelative={formatRelative}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SessionCard({
  session,
  active,
  formatDate,
  formatRelative,
}: {
  session: any;
  active?: boolean;
  formatDate: (d: string | undefined) => string;
  formatRelative: (d: string | undefined) => string;
}) {
  return (
    <div
      className={`rounded-xl border bg-card p-4 ${
        active ? "border-emerald-500/20" : "border-edge"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Monitor
            className={`h-4 w-4 ${active ? "text-emerald-400" : "text-content-4"}`}
          />
          <div>
            <p className="text-sm font-medium text-content">
              {session.userAgent
                ? session.userAgent.slice(0, 60) +
                  (session.userAgent.length > 60 ? "..." : "")
                : "Unknown Device"}
            </p>
            <div className="flex items-center gap-3 text-xs text-content-3">
              {session.ipAddress && <span>IP: {session.ipAddress}</span>}
              <span>Created: {formatDate(session.createdAt)}</span>
              {session.lastAccessedAt && (
                <span>Last: {formatRelative(session.lastAccessedAt)}</span>
              )}
            </div>
          </div>
        </div>
        {active && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 ring-1 ring-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Active
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── AI Usage Tab ────────────────────────────────────────── */
function AiUsageTab({
  aiStats,
  recentUsage,
  formatDate,
}: {
  aiStats: any;
  recentUsage: any[];
  formatDate: (d: string | undefined) => string;
}) {
  return (
    <div className="space-y-6">
      {/* Monthly Stats Summary */}
      {aiStats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MiniStat
            icon={<Zap className="h-4 w-4 text-amber-400" />}
            label="Requests"
            value={aiStats.totalRequests ?? 0}
          />
          <MiniStat
            icon={<BarChart3 className="h-4 w-4 text-sky-400" />}
            label="Tokens"
            value={(aiStats.totalTokens ?? 0).toLocaleString()}
          />
          <MiniStat
            icon={<CreditCard className="h-4 w-4 text-emerald-400" />}
            label="Cost"
            value={`$${(aiStats.totalCost ?? 0).toFixed(4)}`}
          />
          <MiniStat
            icon={<XCircle className="h-4 w-4 text-red-400" />}
            label="Failures"
            value={aiStats.failedRequests ?? 0}
          />
        </div>
      )}

      {/* Recent Usage Records */}
      <div className="rounded-2xl border border-edge bg-card">
        <div className="border-b border-edge px-6 py-4">
          <h3 className="text-sm font-semibold text-content">
            Recent AI Requests
          </h3>
        </div>
        {!recentUsage || recentUsage.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-content-4">
            <Brain className="mb-2 h-8 w-8" />
            <p className="text-sm">No AI usage records</p>
          </div>
        ) : (
          <div className="divide-y divide-edge">
            {recentUsage.map((usage, i) => (
              <div
                key={usage._id || i}
                className="flex items-center gap-4 px-6 py-3"
              >
                <div
                  className={`rounded-lg p-2 ${
                    usage.status === "success" || usage.success
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-red-500/10 text-red-400"
                  }`}
                >
                  <Brain className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-content truncate">
                    {usage.action || usage.provider || "AI Request"}
                    {usage.model ? ` — ${usage.model}` : ""}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-content-3">
                    {usage.tokensUsed != null && (
                      <span>{usage.tokensUsed.toLocaleString()} tokens</span>
                    )}
                    {usage.inputTokens != null &&
                      usage.outputTokens != null && (
                        <span>
                          {usage.inputTokens.toLocaleString()} in /{" "}
                          {usage.outputTokens.toLocaleString()} out
                        </span>
                      )}
                    {usage.cost != null && (
                      <span>${usage.cost.toFixed(6)}</span>
                    )}
                    {usage.duration != null && (
                      <span>{(usage.duration / 1000).toFixed(1)}s</span>
                    )}
                  </div>
                </div>
                <span className="shrink-0 text-xs text-content-3">
                  {formatDate(usage.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Helper Components ───────────────────────────────────── */
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-content-3">{label}</span>
      <span className="text-sm font-medium text-content">{value}</span>
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-edge bg-card p-3">
      <div className="mb-1.5">{icon}</div>
      <p className="text-lg font-bold text-content">{value}</p>
      <p className="text-[11px] text-content-3">{label}</p>
    </div>
  );
}
