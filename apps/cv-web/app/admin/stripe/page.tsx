"use client";

import { useState, useEffect, useCallback } from "react";
import { adminApi } from "@/lib/api";
import {
  CreditCard,
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Zap,
  Shield,
  Key,
  Tag,
  Webhook,
  Activity,
  TrendingUp,
  Users,
  Clock,
  Globe,
  Gauge,
  CircleDot,
  Banknote,
  XOctagon,
  Timer,
  Wallet,
  ChevronDown,
  ChevronUp,
  BarChart3,
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
} from "recharts";

// --- Types ---

interface StripeConfig {
  enabled: boolean;
  hasSecretKey: boolean;
  hasWebhookSecret: boolean;
  premiumMonthlyPriceId: string;
  premiumYearlyPriceId: string;
  enterpriseMonthlyPriceId: string;
  enterpriseYearlyPriceId: string;
}

interface StripeHealth {
  health: {
    status: "connected" | "disconnected" | "degraded";
    latencyMs: number;
    apiVersion: string;
    lastCheckedAt: string;
  };
  overview: {
    totalCustomers: number;
    activeSubscriptions: number;
    totalBalance: number;
    currency: string;
  };
  recentCharges: {
    total: number;
    succeeded: number;
    failed: number;
    incomplete: number;
    totalAmount: number;
    failedAmount: number;
  };
  webhookEvents: {
    recentEvents: Array<{
      id: string;
      type: string;
      created: number;
      status: string;
    }>;
    totalRecent: number;
  };
  subscriptionBreakdown: {
    active: number;
    pastDue: number;
    canceled: number;
    trialing: number;
    incomplete: number;
  };
  revenueTimeline: Array<{
    date: string;
    amount: number;
    count: number;
  }>;
}

type Tab = "overview" | "configuration";

// --- Custom Chart Tooltip ---

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-edge bg-surface px-3.5 py-2.5 shadow-xl shadow-black/20">
      <p className="mb-1 text-[11px] font-medium text-content-3">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs font-semibold" style={{ color: p.color }}>
          {p.name}: {p.name === "Revenue" ? `$${p.value}` : p.value}
        </p>
      ))}
    </div>
  );
}

const PIE_COLORS = ["#22c55e", "#f59e0b", "#ef4444", "#6366f1", "#64748b"];

// --- Main Component ---

export default function AdminStripePage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [config, setConfig] = useState<StripeConfig | null>(null);
  const [health, setHealth] = useState<StripeHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [healthLoading, setHealthLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [reloading, setReloading] = useState(false);
  const [connectionOk, setConnectionOk] = useState<boolean | null>(null);

  // Config form fields
  const [enabled, setEnabled] = useState(false);
  const [secretKey, setSecretKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [premiumMonthly, setPremiumMonthly] = useState("");
  const [premiumYearly, setPremiumYearly] = useState("");
  const [enterpriseMonthly, setEnterpriseMonthly] = useState("");
  const [enterpriseYearly, setEnterpriseYearly] = useState("");
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [showEvents, setShowEvents] = useState(false);

  // --- Data Loading ---

  const loadConfig = useCallback(async () => {
    try {
      const res = await adminApi.getStripeConfig();
      const d = res.data;
      setConfig(d);
      setEnabled(d.enabled);
      setPremiumMonthly(d.premiumMonthlyPriceId || "");
      setPremiumYearly(d.premiumYearlyPriceId || "");
      setEnterpriseMonthly(d.enterpriseMonthlyPriceId || "");
      setEnterpriseYearly(d.enterpriseYearlyPriceId || "");
      setSecretKey("");
      setWebhookSecret("");
      if (d.enabled && d.hasSecretKey) setConnectionOk(true);
    } catch {
      toast.error("Failed to load Stripe configuration");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const res = await adminApi.getStripeHealth();
      setHealth(res.data);
      if (res.data?.health?.status === "connected") setConnectionOk(true);
      else if (res.data?.health?.status === "disconnected")
        setConnectionOk(false);
    } catch {
      /* silent */
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
    loadHealth();
  }, [loadConfig, loadHealth]);

  // --- Actions ---

  const handleTestConnection = async () => {
    if (!secretKey) return toast.error("Enter a secret key to test");
    setTesting(true);
    try {
      const res = await adminApi.testStripeConnection(secretKey);
      if (res.data.ok) {
        setConnectionOk(true);
        toast.success("Stripe connection successful!");
      } else {
        setConnectionOk(false);
        toast.error(`Connection failed: ${res.data.error}`);
      }
    } catch {
      setConnectionOk(false);
      toast.error("Failed to test connection");
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = {
        enabled,
        premiumMonthlyPriceId: premiumMonthly,
        premiumYearlyPriceId: premiumYearly,
        enterpriseMonthlyPriceId: enterpriseMonthly,
        enterpriseYearlyPriceId: enterpriseYearly,
      };
      if (secretKey) payload.secretKey = secretKey;
      if (webhookSecret) payload.webhookSecret = webhookSecret;

      const res = await adminApi.updateStripeConfig(payload);
      if (res.data?.connection?.ok) {
        setConnectionOk(true);
        toast.success("Stripe configuration saved & connected!");
      } else if (res.data?.connection?.ok === false) {
        setConnectionOk(false);
        toast.error(
          `Saved but connection failed: ${res.data.connection.error}`
        );
      } else {
        toast.success("Stripe configuration saved!");
      }
      await loadConfig();
      await loadHealth();
    } catch {
      toast.error("Failed to save Stripe configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleReload = async () => {
    setReloading(true);
    try {
      const res = await adminApi.reloadStripe();
      if (res.data.ok) {
        setConnectionOk(true);
        toast.success("Stripe reloaded successfully!");
      } else {
        setConnectionOk(false);
        toast.error(`Reload failed: ${res.data.error}`);
      }
      await loadHealth();
    } catch {
      toast.error("Failed to reload Stripe");
    } finally {
      setReloading(false);
    }
  };

  // --- Computed ---

  const successRate =
    health && health.recentCharges.total > 0
      ? Math.round(
          (health.recentCharges.succeeded / health.recentCharges.total) * 100
        )
      : 0;

  const subPieData = health
    ? [
        { name: "Active", value: health.subscriptionBreakdown.active },
        { name: "Past Due", value: health.subscriptionBreakdown.pastDue },
        { name: "Canceled", value: health.subscriptionBreakdown.canceled },
        { name: "Trialing", value: health.subscriptionBreakdown.trialing },
        { name: "Incomplete", value: health.subscriptionBreakdown.incomplete },
      ].filter((d) => d.value > 0)
    : [];

  const totalSubs = subPieData.reduce((s, d) => s + d.value, 0);

  const latencyColor =
    (health?.health.latencyMs ?? 0) < 500
      ? "text-emerald-400"
      : (health?.health.latencyMs ?? 0) < 2000
        ? "text-amber-400"
        : "text-red-400";

  // --- Loading State ---

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
          <p className="text-sm text-content-3">Loading Stripe settings...</p>
        </div>
      </div>
    );
  }

  // --- Render ---

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 ring-1 ring-violet-500/30">
            <Wallet className="h-6 w-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-content">Stripe Gateway</h1>
            <p className="text-sm text-content-3">
              Payment infrastructure, health monitoring & configuration
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              loadHealth();
              loadConfig();
            }}
            disabled={healthLoading}
            className="flex items-center gap-2 rounded-xl border border-edge bg-card px-3.5 py-2 text-xs font-medium text-content-2 transition hover:bg-card-hover disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${healthLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
          <button
            onClick={handleReload}
            disabled={reloading}
            className="flex items-center gap-2 rounded-xl border border-orange-500/20 bg-orange-500/5 px-3.5 py-2 text-xs font-medium text-orange-400 transition hover:bg-orange-500/10 disabled:opacity-50"
          >
            <Zap
              className={`h-3.5 w-3.5 ${reloading ? "animate-pulse" : ""}`}
            />
            Reconnect
          </button>
        </div>
      </div>

      {/* HEALTH BANNER */}
      <div
        className={`relative overflow-hidden rounded-2xl border p-[1px] ${
          connectionOk === true
            ? "border-emerald-500/20"
            : connectionOk === false
              ? "border-red-500/20"
              : "border-edge"
        }`}
      >
        <div
          className={`absolute inset-0 rounded-2xl ${
            connectionOk === true
              ? "bg-gradient-to-r from-emerald-500/5 via-transparent to-emerald-500/5"
              : connectionOk === false
                ? "bg-gradient-to-r from-red-500/5 via-transparent to-red-500/5"
                : ""
          }`}
        />
        <div className="relative flex items-center justify-between rounded-2xl bg-card/80 px-5 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div
              className={`relative flex h-10 w-10 items-center justify-center rounded-xl ${
                connectionOk === true
                  ? "bg-emerald-500/10 ring-1 ring-emerald-500/30"
                  : connectionOk === false
                    ? "bg-red-500/10 ring-1 ring-red-500/30"
                    : "bg-content-4/10 ring-1 ring-content-4/20"
              }`}
            >
              {connectionOk === true ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              ) : connectionOk === false ? (
                <XCircle className="h-5 w-5 text-red-400" />
              ) : (
                <CreditCard className="h-5 w-5 text-content-3" />
              )}
              {connectionOk === true && (
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-card">
                  <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-75" />
                </span>
              )}
            </div>
            <div>
              <p
                className={`text-sm font-semibold ${
                  connectionOk === true
                    ? "text-emerald-400"
                    : connectionOk === false
                      ? "text-red-400"
                      : "text-content-2"
                }`}
              >
                {health?.health.status === "connected"
                  ? "Stripe Connected & Healthy"
                  : health?.health.status === "degraded"
                    ? "Stripe Connected - Degraded Performance"
                    : connectionOk === false
                      ? "Stripe Disconnected"
                      : "Stripe Not Configured"}
              </p>
              <div className="mt-0.5 flex items-center gap-3 text-[11px] text-content-4">
                {health?.health.latencyMs ? (
                  <span className="flex items-center gap-1">
                    <Gauge className="h-3 w-3" />
                    <span className={latencyColor}>
                      {health.health.latencyMs}ms
                    </span>{" "}
                    latency
                  </span>
                ) : null}
                {health?.health.apiVersion && (
                  <span className="flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    API v{health.health.apiVersion}
                  </span>
                )}
                {health?.health.lastCheckedAt && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Checked{" "}
                    {new Date(health.health.lastCheckedAt).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Enable / Disable Toggle */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-content-3">
              {enabled ? "Enabled" : "Disabled"}
            </span>
            <button
              onClick={() => setEnabled(!enabled)}
              className={`relative h-7 w-12 rounded-full transition-all duration-300 ${
                enabled
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-lg shadow-emerald-500/20"
                  : "bg-content-4/20"
              }`}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-all duration-300 ${
                  enabled ? "translate-x-[22px]" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex gap-1 rounded-xl border border-edge bg-card p-1">
        {(
          [
            { id: "overview", label: "Health & Analytics", icon: Activity },
            { id: "configuration", label: "Configuration", icon: Key },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${
              tab === t.id
                ? "bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20"
                : "text-content-3 hover:bg-card-hover hover:text-content-2"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {tab === "overview" && (
        <div className="space-y-6">
          {healthLoading && !health ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-orange-400" />
            </div>
          ) : !health || health.health.status === "disconnected" ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-edge bg-card/50 py-20">
              <CreditCard className="mb-3 h-10 w-10 text-content-4" />
              <p className="text-sm font-medium text-content-2">
                No analytics available
              </p>
              <p className="mt-1 text-xs text-content-4">
                Connect Stripe to see health metrics and payment analytics
              </p>
              <button
                onClick={() => setTab("configuration")}
                className="mt-4 rounded-xl bg-orange-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-orange-600"
              >
                Configure Stripe
              </button>
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                  {
                    label: "Total Customers",
                    value: health.overview.totalCustomers,
                    suffix: health.overview.totalCustomers >= 100 ? "+" : "",
                    icon: Users,
                    gradient: "from-blue-500/10 to-cyan-500/10",
                    ring: "ring-blue-500/20",
                    iconColor: "text-blue-400",
                    valueColor: "text-blue-400",
                  },
                  {
                    label: "Active Subscriptions",
                    value: health.overview.activeSubscriptions,
                    suffix: "",
                    icon: CreditCard,
                    gradient: "from-emerald-500/10 to-green-500/10",
                    ring: "ring-emerald-500/20",
                    iconColor: "text-emerald-400",
                    valueColor: "text-emerald-400",
                  },
                  {
                    label: "Available Balance",
                    value: `$${health.overview.totalBalance.toLocaleString()}`,
                    suffix: "",
                    icon: Banknote,
                    gradient: "from-violet-500/10 to-purple-500/10",
                    ring: "ring-violet-500/20",
                    iconColor: "text-violet-400",
                    valueColor: "text-violet-400",
                  },
                  {
                    label: "30d Revenue",
                    value: `$${health.recentCharges.totalAmount.toLocaleString()}`,
                    suffix: "",
                    icon: TrendingUp,
                    gradient: "from-orange-500/10 to-amber-500/10",
                    ring: "ring-orange-500/20",
                    iconColor: "text-orange-400",
                    valueColor: "text-orange-400",
                  },
                ].map((kpi) => (
                  <div
                    key={kpi.label}
                    className={`group relative overflow-hidden rounded-2xl border border-edge bg-card p-5 transition hover:border-transparent hover:ring-1 hover:${kpi.ring}`}
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${kpi.gradient} opacity-0 transition group-hover:opacity-100`}
                    />
                    <div className="relative">
                      <div className="flex items-center justify-between">
                        <kpi.icon className={`h-5 w-5 ${kpi.iconColor}`} />
                      </div>
                      <p
                        className={`mt-3 text-2xl font-bold ${kpi.valueColor}`}
                      >
                        {kpi.value}
                        {kpi.suffix}
                      </p>
                      <p className="mt-1 text-xs text-content-3">{kpi.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Charge Success Ring + Revenue Chart */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {/* Charges Summary */}
                <div className="rounded-2xl border border-edge bg-card p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-content-3" />
                    <h3 className="text-sm font-semibold text-content">
                      Charges (30 days)
                    </h3>
                  </div>
                  <div className="flex items-center gap-6">
                    {/* Success rate ring */}
                    <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
                      <svg className="h-full w-full -rotate-90">
                        <circle
                          cx="56"
                          cy="56"
                          r="48"
                          fill="none"
                          stroke="currentColor"
                          className="text-edge"
                          strokeWidth="8"
                        />
                        <circle
                          cx="56"
                          cy="56"
                          r="48"
                          fill="none"
                          stroke="url(#successGrad)"
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={`${successRate * 3.016} ${301.6 - successRate * 3.016}`}
                        />
                        <defs>
                          <linearGradient
                            id="successGrad"
                            x1="0"
                            y1="0"
                            x2="1"
                            y2="1"
                          >
                            <stop offset="0%" stopColor="#22c55e" />
                            <stop offset="100%" stopColor="#10b981" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-xl font-bold text-content">
                          {successRate}%
                        </span>
                        <span className="text-[10px] text-content-3">
                          Success
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-3">
                      {[
                        {
                          label: "Succeeded",
                          value: health.recentCharges.succeeded,
                          icon: CheckCircle2,
                          color: "text-emerald-400",
                          bg: "bg-emerald-500/10",
                        },
                        {
                          label: "Failed",
                          value: health.recentCharges.failed,
                          icon: XOctagon,
                          color: "text-red-400",
                          bg: "bg-red-500/10",
                        },
                        {
                          label: "Incomplete",
                          value: health.recentCharges.incomplete,
                          icon: Timer,
                          color: "text-amber-400",
                          bg: "bg-amber-500/10",
                        },
                      ].map((row) => (
                        <div
                          key={row.label}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`flex h-6 w-6 items-center justify-center rounded-lg ${row.bg}`}
                            >
                              <row.icon className={`h-3 w-3 ${row.color}`} />
                            </div>
                            <span className="text-xs text-content-2">
                              {row.label}
                            </span>
                          </div>
                          <span className={`text-sm font-bold ${row.color}`}>
                            {row.value}
                          </span>
                        </div>
                      ))}
                      <div className="border-t border-edge pt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-content-3">
                            Failed amount
                          </span>
                          <span className="text-xs font-semibold text-red-400">
                            ${health.recentCharges.failedAmount}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Revenue Area Chart */}
                <div className="col-span-1 rounded-2xl border border-edge bg-card p-6 lg:col-span-2">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-content-3" />
                      <h3 className="text-sm font-semibold text-content">
                        Revenue Timeline (30 days)
                      </h3>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 ring-1 ring-emerald-500/20">
                      ${health.recentCharges.totalAmount.toLocaleString()} total
                    </span>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart
                      data={health.revenueTimeline}
                      margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="revenueGrad"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#f97316"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="100%"
                            stopColor="#f97316"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="opacity-10"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "var(--t-content-4)" }}
                        tickFormatter={(v: string) => {
                          const d = new Date(v);
                          return `${d.getMonth() + 1}/${d.getDate()}`;
                        }}
                        interval={4}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "var(--t-content-4)" }}
                        tickFormatter={(v: number) => `$${v}`}
                        width={50}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        name="Revenue"
                        stroke="#f97316"
                        strokeWidth={2}
                        fill="url(#revenueGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Subscription Pie + Daily Transactions Bar */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Subscription Pie Chart */}
                <div className="rounded-2xl border border-edge bg-card p-6">
                  <div className="mb-2 flex items-center gap-2">
                    <CircleDot className="h-4 w-4 text-content-3" />
                    <h3 className="text-sm font-semibold text-content">
                      Subscription Breakdown
                    </h3>
                  </div>
                  {totalSubs === 0 ? (
                    <div className="flex h-48 items-center justify-center">
                      <p className="text-xs text-content-4">
                        No subscriptions yet
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-6">
                      <ResponsiveContainer width={160} height={160}>
                        <PieChart>
                          <Pie
                            data={subPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={72}
                            dataKey="value"
                            strokeWidth={2}
                            stroke="var(--t-card)"
                          >
                            {subPieData.map((_, i) => (
                              <Cell
                                key={i}
                                fill={PIE_COLORS[i % PIE_COLORS.length]}
                              />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex-1 space-y-2.5">
                        {subPieData.map((d, i) => (
                          <div
                            key={d.name}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{
                                  backgroundColor:
                                    PIE_COLORS[i % PIE_COLORS.length],
                                }}
                              />
                              <span className="text-xs text-content-2">
                                {d.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-content">
                                {d.value}
                              </span>
                              <span className="text-[10px] text-content-4">
                                {Math.round((d.value / totalSubs) * 100)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Daily Transactions Bar Chart */}
                <div className="rounded-2xl border border-edge bg-card p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-content-3" />
                    <h3 className="text-sm font-semibold text-content">
                      Daily Transactions
                    </h3>
                  </div>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart
                      data={health.revenueTimeline}
                      margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="opacity-10"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 9, fill: "var(--t-content-4)" }}
                        tickFormatter={(v: string) => {
                          const d = new Date(v);
                          return `${d.getDate()}`;
                        }}
                        interval={3}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 9, fill: "var(--t-content-4)" }}
                        width={25}
                        allowDecimals={false}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar
                        dataKey="count"
                        name="Transactions"
                        fill="#8b5cf6"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={16}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Webhook Events (Collapsible) */}
              <div className="rounded-2xl border border-edge bg-card">
                <button
                  onClick={() => setShowEvents(!showEvents)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left"
                >
                  <div className="flex items-center gap-2">
                    <Webhook className="h-4 w-4 text-content-3" />
                    <h3 className="text-sm font-semibold text-content">
                      Recent Webhook Events
                    </h3>
                    <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-400 ring-1 ring-violet-500/20">
                      {health.webhookEvents.totalRecent}
                    </span>
                  </div>
                  {showEvents ? (
                    <ChevronUp className="h-4 w-4 text-content-3" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-content-3" />
                  )}
                </button>
                {showEvents && (
                  <div className="border-t border-edge">
                    {health.webhookEvents.recentEvents.length === 0 ? (
                      <div className="px-6 py-8 text-center text-xs text-content-4">
                        No recent webhook events
                      </div>
                    ) : (
                      <div className="divide-y divide-edge">
                        {health.webhookEvents.recentEvents.map((evt) => (
                          <div
                            key={evt.id}
                            className="flex items-center justify-between px-6 py-3 transition hover:bg-card-hover"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                                  evt.type.includes("succeeded") ||
                                  evt.type.includes("completed")
                                    ? "bg-emerald-500/10"
                                    : evt.type.includes("failed") ||
                                        evt.type.includes("deleted")
                                      ? "bg-red-500/10"
                                      : "bg-blue-500/10"
                                }`}
                              >
                                {evt.type.includes("succeeded") ||
                                evt.type.includes("completed") ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                ) : evt.type.includes("failed") ||
                                  evt.type.includes("deleted") ? (
                                  <XCircle className="h-3.5 w-3.5 text-red-400" />
                                ) : (
                                  <Activity className="h-3.5 w-3.5 text-blue-400" />
                                )}
                              </div>
                              <div>
                                <p className="text-xs font-medium text-content">
                                  {evt.type}
                                </p>
                                <p className="text-[10px] font-mono text-content-4">
                                  {evt.id}
                                </p>
                              </div>
                            </div>
                            <span className="whitespace-nowrap text-[11px] text-content-3">
                              {new Date(
                                evt.created * 1000
                              ).toLocaleDateString()}{" "}
                              {new Date(
                                evt.created * 1000
                              ).toLocaleTimeString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* CONFIGURATION TAB */}
      {tab === "configuration" && (
        <div className="space-y-6">
          {/* Save bar */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:shadow-orange-500/30 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Configuration
            </button>
          </div>

          {/* API Keys */}
          <div className="rounded-2xl border border-edge bg-card overflow-hidden">
            <div className="flex items-center gap-3 border-b border-edge bg-gradient-to-r from-violet-500/5 to-transparent px-6 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20">
                <Key className="h-4 w-4 text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-content">API Keys</p>
                <p className="text-[11px] text-content-3">
                  Your Stripe secret key and webhook signing secret
                </p>
              </div>
            </div>
            <div className="space-y-5 p-6">
              {/* Secret Key */}
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-content-3">
                  <Shield className="h-3 w-3" />
                  Secret Key
                  {config?.hasSecretKey && !secretKey && (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-emerald-400 ring-1 ring-emerald-500/20">
                      Configured
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type={showSecretKey ? "text" : "password"}
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    placeholder={
                      config?.hasSecretKey
                        ? "leave blank to keep current"
                        : "sk_live_... or sk_test_..."
                    }
                    className="w-full rounded-xl border border-edge bg-surface px-4 py-3 pr-24 font-mono text-sm text-content placeholder:font-sans placeholder:text-content-4 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowSecretKey(!showSecretKey)}
                      className="rounded-lg p-1.5 text-content-3 transition hover:bg-surface hover:text-content-2"
                    >
                      {showSecretKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={testing || !secretKey}
                      className="flex items-center gap-1 rounded-lg bg-violet-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-violet-400 ring-1 ring-violet-500/20 transition hover:bg-violet-500/20 disabled:opacity-40"
                    >
                      {testing ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <Zap className="h-3 w-3" />
                          Test
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Webhook Secret */}
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-content-3">
                  <Webhook className="h-3 w-3" />
                  Webhook Signing Secret
                  {config?.hasWebhookSecret && !webhookSecret && (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-emerald-400 ring-1 ring-emerald-500/20">
                      Configured
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type={showWebhookSecret ? "text" : "password"}
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                    placeholder={
                      config?.hasWebhookSecret
                        ? "leave blank to keep current"
                        : "whsec_..."
                    }
                    className="w-full rounded-xl border border-edge bg-surface px-4 py-3 pr-12 font-mono text-sm text-content placeholder:font-sans placeholder:text-content-4 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-content-3 transition hover:bg-surface hover:text-content-2"
                  >
                    {showWebhookSecret ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Price IDs */}
          <div className="rounded-2xl border border-edge bg-card overflow-hidden">
            <div className="flex items-center gap-3 border-b border-edge bg-gradient-to-r from-cyan-500/5 to-transparent px-6 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 ring-1 ring-cyan-500/20">
                <Tag className="h-4 w-4 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-content">
                  Subscription Price IDs
                </p>
                <p className="text-[11px] text-content-3">
                  Map each Stripe Price to a subscription tier
                </p>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {[
                  {
                    label: "Premium - Monthly",
                    value: premiumMonthly,
                    set: setPremiumMonthly,
                    tier: "premium",
                  },
                  {
                    label: "Premium - Yearly",
                    value: premiumYearly,
                    set: setPremiumYearly,
                    tier: "premium",
                  },
                  {
                    label: "Enterprise - Monthly",
                    value: enterpriseMonthly,
                    set: setEnterpriseMonthly,
                    tier: "enterprise",
                  },
                  {
                    label: "Enterprise - Yearly",
                    value: enterpriseYearly,
                    set: setEnterpriseYearly,
                    tier: "enterprise",
                  },
                ].map((field) => (
                  <div key={field.label}>
                    <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-content-3">
                      <span
                        className={`h-2 w-2 rounded-full ${field.tier === "premium" ? "bg-amber-400" : "bg-violet-400"}`}
                      />
                      {field.label}
                      {field.value && (
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      )}
                    </label>
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) => field.set(e.target.value)}
                      placeholder="price_..."
                      className="w-full rounded-xl border border-edge bg-surface px-4 py-3 font-mono text-sm text-content placeholder:font-sans placeholder:text-content-4 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Setup Guide */}
          <div className="rounded-2xl border border-edge bg-card overflow-hidden">
            <div className="flex items-center gap-3 border-b border-edge bg-gradient-to-r from-orange-500/5 to-transparent px-6 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 ring-1 ring-orange-500/20">
                <Globe className="h-4 w-4 text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-content">
                  Setup Guide
                </p>
                <p className="text-[11px] text-content-3">
                  Step-by-step instructions to configure Stripe
                </p>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {[
                  {
                    step: 1,
                    title: "Get your API Secret Key",
                    desc: (
                      <>
                        Go to{" "}
                        <a
                          href="https://dashboard.stripe.com/apikeys"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-orange-400 underline decoration-orange-400/30"
                        >
                          Stripe Dashboard - API Keys
                        </a>{" "}
                        and copy your Secret key{" "}
                        <span className="text-content-4">
                          (sk_live_... or sk_test_...)
                        </span>
                      </>
                    ),
                  },
                  {
                    step: 2,
                    title: "Configure Webhook Endpoint",
                    desc: (
                      <>
                        Go to{" "}
                        <a
                          href="https://dashboard.stripe.com/webhooks"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-orange-400 underline decoration-orange-400/30"
                        >
                          Stripe Dashboard - Webhooks
                        </a>{" "}
                        and create an endpoint pointing to{" "}
                        <code className="rounded-md bg-surface px-2 py-0.5 text-[11px] text-content-2 ring-1 ring-edge">
                          https://api.yourdomain.com/api/stripe/webhook
                        </code>
                      </>
                    ),
                  },
                  {
                    step: 3,
                    title: "Copy Webhook Signing Secret",
                    desc: "Copy the signing secret (whsec_...) from the webhook endpoint you just created",
                  },
                  {
                    step: 4,
                    title: "Add Price IDs",
                    desc: (
                      <>
                        Go to{" "}
                        <a
                          href="https://dashboard.stripe.com/products"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-orange-400 underline decoration-orange-400/30"
                        >
                          Stripe Dashboard - Products
                        </a>{" "}
                        and copy each Price ID (price_...) for your subscription
                        tiers
                      </>
                    ),
                  },
                  {
                    step: 5,
                    title: "Enable & Save",
                    desc: "Paste all values above, enable the toggle in the header, and hit Save Configuration",
                  },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-xs font-bold text-orange-400 ring-1 ring-orange-500/20">
                      {item.step}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-content">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-xs text-content-3 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
