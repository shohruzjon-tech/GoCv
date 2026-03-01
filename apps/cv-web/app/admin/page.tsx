"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { adminApi } from "@/lib/api";
import { useAdminDashboardSocket } from "@/hooks/use-admin-dashboard-socket";
import type { DashboardStats, RegistrationStats } from "@/types";
import {
  Users,
  FileText,
  DollarSign,
  Brain,
  CreditCard,
  Crown,
  Zap,
  Activity,
  WifiOff,
  UserPlus,
  UserCheck,
  Shield,
  ArrowUpRight,
  Eye,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// ─── Helpers ───

function formatTime(ts: number) {
  const d = new Date(ts * 1000);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatHour(hourStr: string) {
  const d = new Date(hourStr + ":00");
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function PulsingDot({ color }: { color: string }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span
        className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${color}`}
      />
      <span
        className={`relative inline-flex h-2.5 w-2.5 rounded-full ${color}`}
      />
    </span>
  );
}

const METHOD_COLORS: Record<string, string> = {
  GET: "#10b981",
  POST: "#8b5cf6",
  PUT: "#f59e0b",
  PATCH: "#06b6d4",
  DELETE: "#ef4444",
  OPTIONS: "#6b7280",
};

const STATUS_COLORS: Record<string, string> = {
  "2xx": "#10b981",
  "3xx": "#06b6d4",
  "4xx": "#f59e0b",
  "5xx": "#ef4444",
};

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-edge bg-surface/95 px-4 py-3 shadow-xl backdrop-blur-sm">
      <p className="mb-1.5 text-xs font-medium text-content-3">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-content-2">{entry.name}:</span>
          <span className="font-semibold text-content">
            {entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Main ───

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [requestHistory, setRequestHistory] = useState<
    { time: string; rps: number }[]
  >([]);

  const {
    connected,
    liveStats,
    joiningDynamics,
    registrationStats,
    requestDynamics,
    onlineAdmins,
  } = useAdminDashboardSocket();

  useEffect(() => {
    adminApi
      .getDashboard()
      .then((r) => setStats(r.data))
      .catch(() => toast.error("Failed to load stats"))
      .finally(() => setLoading(false));
  }, []);

  // Build trading-chart history
  useEffect(() => {
    if (!requestDynamics?.dataPoints?.length) return;
    const latest = requestDynamics.dataPoints.slice(-60);
    setRequestHistory(
      latest.map((p) => ({ time: formatTime(p.timestamp), rps: p.count })),
    );
  }, [requestDynamics]);

  const activeSessions = liveStats?.activeSessions ?? stats?.totalSessions ?? 0;
  const totalUsers =
    liveStats?.registrationStats?.total ?? stats?.totalUsers ?? 0;

  const regStats: RegistrationStats | null = registrationStats ?? null;

  const regPieData = useMemo(() => {
    if (!regStats) return [];
    return [
      { name: "Verified", value: regStats.verified },
      { name: "Unverified", value: regStats.unverified },
    ];
  }, [regStats]);

  const authMethodData = useMemo(() => {
    if (!regStats) return [];
    return [
      { name: "Email/Password", value: regStats.withPassword },
      { name: "Google Only", value: regStats.googleOnly },
    ];
  }, [regStats]);

  const dailyJoinData = useMemo(() => {
    if (!joiningDynamics?.daily) return [];
    return joiningDynamics.daily.map((d) => ({
      date: formatShortDate(d.date),
      "New Users": d.count,
    }));
  }, [joiningDynamics]);

  const hourlyJoinData = useMemo(() => {
    if (!joiningDynamics?.hourly) return [];
    return joiningDynamics.hourly.slice(-24).map((h) => ({
      hour: formatHour(h.hour),
      Users: h.count,
    }));
  }, [joiningDynamics]);

  const cumulativeData = useMemo(() => {
    if (!joiningDynamics?.cumulative) return [];
    return joiningDynamics.cumulative.map((c) => ({
      date: formatShortDate(c.date),
      "Total Users": c.total,
    }));
  }, [joiningDynamics]);

  const methodBreakdown = useMemo(() => {
    if (!requestDynamics?.summary?.methodBreakdown) return [];
    return Object.entries(requestDynamics.summary.methodBreakdown).map(
      ([method, count]) => ({ method, count }),
    );
  }, [requestDynamics]);

  const statusBreakdown = useMemo(() => {
    if (!requestDynamics?.summary?.statusBreakdown) return [];
    return Object.entries(requestDynamics.summary.statusBreakdown).map(
      ([status, count]) => ({ status, count }),
    );
  }, [requestDynamics]);

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
      value: totalUsers,
      icon: Users,
      color: "indigo",
      trend: regStats?.last24h ? `+${regStats.last24h} today` : undefined,
    },
    {
      label: "Active Sessions",
      value: activeSessions,
      icon: Activity,
      color: "emerald",
      live: true,
    },
    {
      label: "Total CVs",
      value: stats?.totalCvs || 0,
      icon: FileText,
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
      label: "Current RPS",
      value: requestDynamics?.summary?.currentRps?.toFixed(1) || "0",
      icon: Zap,
      color: "rose",
      live: true,
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
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-content">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-content-3">
            Real-time platform analytics & monitoring
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-edge bg-card px-4 py-2">
            <Eye className="h-4 w-4 text-content-3" />
            <span className="text-sm font-medium text-content-2">
              {onlineAdmins} admin{onlineAdmins !== 1 ? "s" : ""} online
            </span>
          </div>
          <div
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 ${
              connected
                ? "border-emerald-500/20 bg-emerald-500/5"
                : "border-red-500/20 bg-red-500/5"
            }`}
          >
            {connected ? (
              <>
                <PulsingDot color="bg-emerald-400" />
                <span className="text-sm font-medium text-emerald-400">
                  Live
                </span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-400" />
                <span className="text-sm font-medium text-red-400">
                  Offline
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── KPI Cards ─── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const c = colorMap[card.color] || colorMap.indigo;
          return (
            <div
              key={card.label}
              className="rounded-2xl border border-edge bg-card p-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.bg} ring-1 ${c.ring}`}
                  >
                    <card.icon className={`h-5 w-5 ${c.text}`} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-content-3">
                      {card.label}
                    </p>
                    <p className="text-2xl font-bold text-content">
                      {typeof card.value === "number"
                        ? card.value.toLocaleString()
                        : card.value}
                    </p>
                  </div>
                </div>
                {card.live && <PulsingDot color="bg-emerald-400" />}
              </div>
              {card.trend && (
                <div className="mt-2 flex items-center gap-1 text-xs text-emerald-400">
                  <ArrowUpRight className="h-3 w-3" />
                  {card.trend}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ─── Request Dynamics — Trading Chart ─── */}
      <div className="rounded-2xl border border-edge bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 ring-1 ring-orange-500/20">
              <Activity className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-content">
                Request Dynamics
              </h2>
              <p className="text-xs text-content-3">
                Live request throughput — last 60 seconds
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-content-3">
              Peak:{" "}
              <span className="font-bold text-orange-400">
                {requestDynamics?.summary?.peakRps || 0} rps
              </span>
            </div>
            <div className="text-content-3">
              Avg:{" "}
              <span className="font-bold text-content">
                {requestDynamics?.summary?.avgRps?.toFixed(2) || "0"} rps
              </span>
            </div>
            <div className="text-content-3">
              Total:{" "}
              <span className="font-bold text-content">
                {requestDynamics?.summary?.totalRequests?.toLocaleString() || 0}
              </span>
            </div>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={requestHistory}>
              <defs>
                <linearGradient id="rpsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
              />
              <XAxis
                dataKey="time"
                stroke="#6b7280"
                fontSize={10}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="#6b7280"
                fontSize={10}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="rps"
                name="Requests/sec"
                stroke="#f97316"
                strokeWidth={2}
                fill="url(#rpsGrad)"
                dot={false}
                animationDuration={300}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Method & Status breakdown */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-edge bg-surface/50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-content-2">
              HTTP Methods
            </h3>
            <div className="flex flex-wrap gap-2">
              {methodBreakdown.map((m) => (
                <div
                  key={m.method}
                  className="flex items-center gap-2 rounded-lg border border-edge bg-card px-3 py-1.5"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: METHOD_COLORS[m.method] || "#6b7280",
                    }}
                  />
                  <span className="text-xs font-medium text-content-2">
                    {m.method}
                  </span>
                  <span className="text-xs font-bold text-content">
                    {m.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-edge bg-surface/50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-content-2">
              Status Codes
            </h3>
            <div className="flex flex-wrap gap-2">
              {statusBreakdown.map((s) => (
                <div
                  key={s.status}
                  className="flex items-center gap-2 rounded-lg border border-edge bg-card px-3 py-1.5"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: STATUS_COLORS[s.status] || "#6b7280",
                    }}
                  />
                  <span className="text-xs font-medium text-content-2">
                    {s.status}
                  </span>
                  <span className="text-xs font-bold text-content">
                    {s.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Registration Stats ─── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Verification Funnel */}
        <div className="rounded-2xl border border-edge bg-card p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
              <UserCheck className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-content">
                Registration Stats
              </h2>
              <p className="text-xs text-content-3">
                Verified vs unverified users
              </p>
            </div>
          </div>

          {regStats ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={regPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      dataKey="value"
                      stroke="none"
                    >
                      {regPieData.map((_, i) => (
                        <Cell key={i} fill={i === 0 ? "#10b981" : "#ef4444"} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col justify-center space-y-3">
                <div className="rounded-lg border border-edge bg-surface/50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-content-3">
                      Verification Rate
                    </span>
                    <span className="text-lg font-bold text-emerald-400">
                      {regStats.verificationRate}%
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-edge bg-surface/50 p-2 text-center">
                    <p className="text-xs text-content-3">24h</p>
                    <p className="text-lg font-bold text-content">
                      +{regStats.last24h}
                    </p>
                  </div>
                  <div className="rounded-lg border border-edge bg-surface/50 p-2 text-center">
                    <p className="text-xs text-content-3">7d</p>
                    <p className="text-lg font-bold text-content">
                      +{regStats.last7d}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-edge bg-surface/50 p-2 text-center">
                    <p className="text-xs text-content-3">30d</p>
                    <p className="text-lg font-bold text-content">
                      +{regStats.last30d}
                    </p>
                  </div>
                  <div className="rounded-lg border border-edge bg-surface/50 p-2 text-center">
                    <p className="text-xs text-content-3">Google</p>
                    <p className="text-lg font-bold text-content">
                      {regStats.googleOnly}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center text-content-3">
              Waiting for data...
            </div>
          )}
        </div>

        {/* Auth Methods */}
        <div className="rounded-2xl border border-edge bg-card p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 ring-1 ring-purple-500/20">
              <Shield className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-content">
                Auth Methods
              </h2>
              <p className="text-xs text-content-3">
                Email/Password vs Google OAuth
              </p>
            </div>
          </div>

          {regStats ? (
            <div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={authMethodData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      dataKey="value"
                      stroke="none"
                    >
                      <Cell fill="#8b5cf6" />
                      <Cell fill="#f59e0b" />
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      formatter={(value: string) => (
                        <span className="text-xs text-content-2">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-edge bg-surface/50 p-3 text-center">
                  <p className="text-xs text-content-3">Email/Password</p>
                  <p className="text-xl font-bold text-purple-400">
                    {regStats.withPassword}
                  </p>
                </div>
                <div className="rounded-lg border border-edge bg-surface/50 p-3 text-center">
                  <p className="text-xs text-content-3">Google OAuth</p>
                  <p className="text-xl font-bold text-amber-400">
                    {regStats.googleOnly}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center text-content-3">
              Waiting for data...
            </div>
          )}
        </div>
      </div>

      {/* ─── User Joining Dynamics ─── */}
      <div className="rounded-2xl border border-edge bg-card p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 ring-1 ring-indigo-500/20">
            <UserPlus className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-content">
              User Joining Dynamics
            </h2>
            <p className="text-xs text-content-3">
              New registrations — daily & hourly trends (last 7 days)
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-content-2">
              Daily New Users
            </h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyJoinData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#6b7280"
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#6b7280"
                    fontSize={10}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar
                    dataKey="New Users"
                    fill="#6366f1"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-content-2">
              Hourly Registrations (Last 24h)
            </h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyJoinData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="hour"
                    stroke="#6b7280"
                    fontSize={10}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    stroke="#6b7280"
                    fontSize={10}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="Users" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Cumulative growth */}
        <div className="mt-6">
          <h3 className="mb-2 text-sm font-semibold text-content-2">
            Cumulative User Growth
          </h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cumulativeData}>
                <defs>
                  <linearGradient
                    id="cumulativeGrad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                />
                <XAxis
                  dataKey="date"
                  stroke="#6b7280"
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis
                  stroke="#6b7280"
                  fontSize={10}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="Total Users"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#cumulativeGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ─── Subscriptions Breakdown ─── */}
      {stats?.subscriptions && (
        <div className="rounded-2xl border border-edge bg-card p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 ring-1 ring-amber-500/20">
              <CreditCard className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-content">
                Subscription Breakdown
              </h2>
              <p className="text-xs text-content-3">
                Current plan distribution
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {Object.entries(stats.subscriptions.byPlan || {}).map(
              ([plan, count]) => (
                <div
                  key={plan}
                  className="rounded-xl border border-edge bg-surface/50 p-4 text-center"
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
