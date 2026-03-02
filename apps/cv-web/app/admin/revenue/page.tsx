"use client";

import { useEffect, useState, useCallback } from "react";
import { adminApi } from "@/lib/api";
import toast from "react-hot-toast";
import type {
  PlanConfig,
  DetailedRevenueStats,
  RevenueInvoicesResponse,
  RevenueInvoice,
} from "@/types";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  Loader2,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Receipt,
  Wallet,
  Activity,
  ExternalLink,
  Download,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Calendar,
  type LucideIcon,
} from "lucide-react";

type TabType = "overview" | "invoices" | "bookings" | "profit-loss";

export default function AdminRevenuePage() {
  const [data, setData] = useState<DetailedRevenueStats | null>(null);
  const [invoicesData, setInvoicesData] =
    useState<RevenueInvoicesResponse | null>(null);
  const [planConfigs, setPlanConfigs] = useState<PlanConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [days, setDays] = useState(30);
  const [invoicePage, setInvoicePage] = useState(1);
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [detailedRes, plansRes] = await Promise.all([
        adminApi.getDetailedRevenue(days),
        adminApi.getPlans(),
      ]);
      setData(detailedRes.data);
      setPlanConfigs(plansRes.data);
    } catch {
      toast.error("Failed to load revenue data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [days]);

  const loadInvoices = useCallback(async () => {
    setInvoicesLoading(true);
    try {
      const res = await adminApi.getRevenueInvoices(
        invoicePage,
        20,
        invoiceStatusFilter,
      );
      setInvoicesData(res.data);
    } catch {
      toast.error("Failed to load invoices");
    } finally {
      setInvoicesLoading(false);
    }
  }, [invoicePage, invoiceStatusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (activeTab === "invoices") {
      loadInvoices();
    }
  }, [activeTab, loadInvoices]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
    if (activeTab === "invoices") {
      loadInvoices();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <p className="text-sm text-content-3">Loading revenue analytics...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <AlertTriangle className="h-8 w-8 text-amber-500" />
        <p className="text-sm text-content-3">Failed to load revenue data</p>
        <button
          onClick={handleRefresh}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
        >
          Retry
        </button>
      </div>
    );
  }

  const tabs: { key: TabType; label: string; icon: LucideIcon }[] = [
    { key: "overview", label: "Overview", icon: BarChart3 },
    { key: "invoices", label: "Invoices", icon: Receipt },
    { key: "bookings", label: "Bookings", icon: Calendar },
    { key: "profit-loss", label: "Profit & Loss", icon: Wallet },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content">Revenue Analytics</h1>
          <p className="text-sm text-content-3">
            Comprehensive financial overview and subscription metrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={days}
            onChange={(e) => {
              setDays(Number(e.target.value));
              setLoading(true);
            }}
            className="rounded-lg border border-edge bg-card px-3 py-2 text-sm text-content focus:outline-none focus:ring-2 focus:ring-orange-500/40"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={60}>Last 60 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-lg border border-edge bg-card px-3 py-2 text-sm text-content-2 hover:bg-card-hover disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Monthly Recurring Revenue"
          value={`$${data.summary.mrr.toLocaleString()}`}
          icon={DollarSign}
          color="text-emerald-400 bg-emerald-400/10"
          subtitle={`ARR: $${data.summary.arr.toLocaleString()}`}
        />
        <KPICard
          label="Net Revenue"
          value={`$${data.summary.netRevenue.toLocaleString()}`}
          icon={data.profitLoss.isProfit ? TrendingUp : TrendingDown}
          color={
            data.profitLoss.isProfit
              ? "text-emerald-400 bg-emerald-400/10"
              : "text-red-400 bg-red-400/10"
          }
          subtitle={`Margin: ${data.summary.profitMargin}%`}
          trend={data.profitLoss.isProfit ? "up" : "down"}
        />
        <KPICard
          label="Paying Customers"
          value={data.customerMetrics.payingCustomers.toString()}
          icon={Users}
          color="text-indigo-400 bg-indigo-400/10"
          subtitle={`ARPU: $${data.customerMetrics.arpu}`}
        />
        <KPICard
          label="Stripe Balance"
          value={`$${data.summary.balance.toLocaleString()}`}
          icon={Wallet}
          color="text-blue-400 bg-blue-400/10"
          subtitle={`${data.charges.succeeded} successful charges`}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-edge bg-card p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-orange-500 text-white shadow-sm"
                : "text-content-3 hover:bg-card-hover hover:text-content"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <OverviewTab data={data} planConfigs={planConfigs} />
      )}
      {activeTab === "invoices" && (
        <InvoicesTab
          invoicesData={invoicesData}
          loading={invoicesLoading}
          page={invoicePage}
          statusFilter={invoiceStatusFilter}
          onPageChange={setInvoicePage}
          onStatusChange={(s) => {
            setInvoiceStatusFilter(s);
            setInvoicePage(1);
          }}
        />
      )}
      {activeTab === "bookings" && <BookingsTab data={data} />}
      {activeTab === "profit-loss" && <ProfitLossTab data={data} />}
    </div>
  );
}

// ─── KPI Card Component ───

function KPICard({
  label,
  value,
  icon: Icon,
  color,
  subtitle,
  trend,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  color: string;
  subtitle?: string;
  trend?: "up" | "down";
}) {
  return (
    <div className="rounded-2xl border border-edge bg-card p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`rounded-xl p-2.5 ${color}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs text-content-3">{label}</p>
            <p className="text-xl font-bold text-content">{value}</p>
          </div>
        </div>
        {trend && (
          <div
            className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${
              trend === "up"
                ? "bg-emerald-400/10 text-emerald-400"
                : "bg-red-400/10 text-red-400"
            }`}
          >
            {trend === "up" ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
          </div>
        )}
      </div>
      {subtitle && <p className="mt-2 text-xs text-content-3">{subtitle}</p>}
    </div>
  );
}

// ─── Overview Tab ───

function OverviewTab({
  data,
  planConfigs,
}: {
  data: DetailedRevenueStats;
  planConfigs: PlanConfig[];
}) {
  const totalUsers =
    data.subscriptions.free +
    data.subscriptions.premium +
    data.subscriptions.enterprise;

  const getPlanPrice = (planKey: string) => {
    const config = planConfigs.find((p) => p.plan === planKey);
    return config ? config.monthlyPrice / 100 : 0;
  };

  const plans = [
    {
      name: "Free",
      count: data.subscriptions.free,
      price: 0,
      color: "from-gray-400 to-gray-500",
    },
    {
      name: "Premium",
      count: data.subscriptions.premium,
      price: getPlanPrice("premium"),
      color: "from-indigo-500 to-purple-500",
    },
    {
      name: "Enterprise",
      count: data.subscriptions.enterprise,
      price: getPlanPrice("enterprise"),
      color: "from-amber-500 to-orange-500",
    },
  ];

  // Revenue chart - simple bar visualization
  const maxRevenue = Math.max(...data.dailyRevenue.map((d) => d.revenue), 1);

  return (
    <div className="space-y-6">
      {/* Second row KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <MiniStat
          label="Total Customers"
          value={data.customerMetrics.totalCustomers}
        />
        <MiniStat
          label="Free Users"
          value={data.customerMetrics.freeCustomers}
        />
        <MiniStat label="LTV" value={`$${data.customerMetrics.ltv}`} />
        <MiniStat
          label="Churn Rate"
          value={`${data.customerMetrics.churnRate}%`}
        />
        <MiniStat
          label="AI Requests"
          value={data.aiCosts.totalRequests.toLocaleString()}
        />
        <MiniStat label="AI Cost" value={`$${data.aiCosts.totalCostUsd}`} />
      </div>

      {/* Revenue Timeline Chart */}
      <div className="rounded-2xl border border-edge bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-content">
              Revenue Timeline
            </h2>
            <p className="text-xs text-content-3">
              Daily revenue, costs, and profit for the last {data.period.days}{" "}
              days
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Revenue
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-400" />
              Cost
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              Profit
            </span>
          </div>
        </div>
        <div className="flex items-end gap-[2px]" style={{ height: 200 }}>
          {data.dailyRevenue.map((d) => {
            const revenueHeight = (d.revenue / maxRevenue) * 180;
            const costHeight = maxRevenue > 0 ? (d.cost / maxRevenue) * 180 : 0;
            return (
              <div
                key={d.date}
                className="group relative flex flex-1 flex-col items-center justify-end"
                style={{ height: 200 }}
              >
                {/* Tooltip */}
                <div className="pointer-events-none absolute -top-2 z-10 hidden rounded-lg border border-edge bg-card px-3 py-2 text-xs shadow-lg group-hover:block">
                  <p className="font-medium text-content">{d.date}</p>
                  <p className="text-emerald-400">Revenue: ${d.revenue}</p>
                  <p className="text-red-400">Cost: ${d.cost}</p>
                  <p className="text-blue-400">Profit: ${d.profit}</p>
                </div>
                {/* Revenue bar */}
                <div
                  className="w-full rounded-t bg-emerald-400/60 transition-all group-hover:bg-emerald-400"
                  style={{ height: Math.max(revenueHeight, 1) }}
                />
                {/* Cost overlay */}
                {costHeight > 0 && (
                  <div
                    className="absolute bottom-0 w-full rounded-t bg-red-400/40"
                    style={{ height: costHeight }}
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-content-3">
          <span>{data.period.startDate}</span>
          <span>{data.period.endDate}</span>
        </div>
      </div>

      {/* Plan Distribution & Charges */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Plan Distribution */}
        <div className="rounded-2xl border border-edge bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold text-content">
            Plan Distribution
          </h2>
          <div className="space-y-4">
            {plans.map((p) => {
              const pct = totalUsers > 0 ? (p.count / totalUsers) * 100 : 0;
              return (
                <div key={p.name}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-content-2">
                      {p.name} — {p.count} users
                    </span>
                    <span className="text-content-3">
                      ${p.price}/mo × {p.count} ={" "}
                      <span className="font-semibold text-content">
                        ${(p.price * p.count).toLocaleString()}/mo
                      </span>
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-card-hover">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${p.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Subscription status breakdown */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatusBadge
              label="Active"
              value={data.subscriptions.active}
              color="emerald"
            />
            <StatusBadge
              label="Cancelled"
              value={data.subscriptions.cancelled}
              color="red"
            />
            <StatusBadge
              label="Trial"
              value={data.subscriptions.trial}
              color="blue"
            />
            <StatusBadge
              label="Past Due"
              value={data.subscriptions.pastDue}
              color="amber"
            />
          </div>
        </div>

        {/* Recent Charges */}
        <div className="rounded-2xl border border-edge bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold text-content">
            Recent Charges (30 Days)
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-edge bg-card-hover p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-xs text-content-3">Succeeded</span>
              </div>
              <p className="mt-1 text-lg font-bold text-content">
                {data.charges.succeeded}
              </p>
              <p className="text-xs text-emerald-400">
                ${data.charges.totalAmount.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-edge bg-card-hover p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-400" />
                <span className="text-xs text-content-3">Failed</span>
              </div>
              <p className="mt-1 text-lg font-bold text-content">
                {data.charges.failed}
              </p>
              <p className="text-xs text-red-400">
                ${data.charges.failedAmount.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-edge bg-card-hover p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-400" />
                <span className="text-xs text-content-3">Incomplete</span>
              </div>
              <p className="mt-1 text-lg font-bold text-content">
                {data.charges.incomplete}
              </p>
            </div>
            <div className="rounded-xl border border-edge bg-card-hover p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-400" />
                <span className="text-xs text-content-3">Total Charges</span>
              </div>
              <p className="mt-1 text-lg font-bold text-content">
                {data.charges.total}
              </p>
              <p className="text-xs text-blue-400">
                {data.charges.total > 0
                  ? `${((data.charges.succeeded / data.charges.total) * 100).toFixed(0)}% success rate`
                  : "No charges"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Costs Breakdown */}
      <div className="rounded-2xl border border-edge bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold text-content">
          AI Infrastructure Costs
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
          <div>
            <p className="text-xs text-content-3">Total Requests</p>
            <p className="text-lg font-bold text-content">
              {data.aiCosts.totalRequests.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-content-3">Total Tokens</p>
            <p className="text-lg font-bold text-content">
              {data.aiCosts.totalTokens.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-content-3">Total Cost</p>
            <p className="text-lg font-bold text-content">
              ${data.aiCosts.totalCostUsd}
            </p>
          </div>
          <div>
            <p className="text-xs text-content-3">Cost per Request</p>
            <p className="text-lg font-bold text-content">
              $
              {data.aiCosts.totalRequests > 0
                ? (
                    data.aiCosts.totalCostUsd / data.aiCosts.totalRequests
                  ).toFixed(4)
                : "0"}
            </p>
          </div>
          <div>
            <p className="text-xs text-content-3">Net Margin</p>
            <p
              className={`text-lg font-bold ${
                data.profitLoss.isProfit ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {data.summary.mrr > 0 ? `${data.summary.profitMargin}%` : "—"}
            </p>
          </div>
        </div>

        {/* AI tool breakdown */}
        {Object.keys(data.aiCosts.byTool).length > 0 && (
          <div className="mt-4 border-t border-edge pt-4">
            <p className="mb-2 text-xs font-medium text-content-3">
              Requests by AI Tool
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(data.aiCosts.byTool)
                .sort((a, b) => b[1] - a[1])
                .map(([tool, count]) => (
                  <span
                    key={tool}
                    className="rounded-full border border-edge bg-card-hover px-3 py-1 text-xs text-content-2"
                  >
                    {tool}: <span className="font-semibold">{count}</span>
                  </span>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Customer Metrics */}
      <div className="rounded-2xl border border-edge bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold text-content">
          Customer Metrics
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
          <MetricCard
            label="Total Customers"
            value={data.customerMetrics.totalCustomers}
          />
          <MetricCard
            label="Paying"
            value={data.customerMetrics.payingCustomers}
            accent="emerald"
          />
          <MetricCard
            label="Free"
            value={data.customerMetrics.freeCustomers}
            accent="gray"
          />
          <MetricCard
            label="ARPU"
            value={`$${data.customerMetrics.arpu}`}
            accent="blue"
          />
          <MetricCard
            label="LTV"
            value={`$${data.customerMetrics.ltv}`}
            accent="indigo"
          />
          <MetricCard
            label="Churn Rate"
            value={`${data.customerMetrics.churnRate}%`}
            accent={data.customerMetrics.churnRate > 10 ? "red" : "emerald"}
          />
          <MetricCard
            label="CAC"
            value={`$${data.customerMetrics.cac}`}
            accent="amber"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Invoices Tab ───

function InvoicesTab({
  invoicesData,
  loading,
  page,
  statusFilter,
  onPageChange,
  onStatusChange,
}: {
  invoicesData: RevenueInvoicesResponse | null;
  loading: boolean;
  page: number;
  statusFilter: string;
  onPageChange: (p: number) => void;
  onStatusChange: (s: string) => void;
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
      </div>
    );
  }

  const totals = invoicesData?.totals;

  return (
    <div className="space-y-6">
      {/* Invoice Summary Cards */}
      {totals && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <div className="rounded-2xl border border-edge bg-card p-4">
            <p className="text-xs text-content-3">Total Invoices</p>
            <p className="text-xl font-bold text-content">{totals.all}</p>
          </div>
          <div className="rounded-2xl border border-edge bg-card p-4">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <p className="text-xs text-content-3">Paid</p>
            </div>
            <p className="text-xl font-bold text-emerald-400">
              {totals.paidCount}
            </p>
            <p className="text-xs text-content-3">
              ${totals.paid.toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl border border-edge bg-card p-4">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              <p className="text-xs text-content-3">Open</p>
            </div>
            <p className="text-xl font-bold text-amber-400">
              {totals.openCount}
            </p>
            <p className="text-xs text-content-3">
              ${totals.open.toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl border border-edge bg-card p-4">
            <div className="flex items-center gap-1.5">
              <XCircle className="h-3.5 w-3.5 text-red-400" />
              <p className="text-xs text-content-3">Void</p>
            </div>
            <p className="text-xl font-bold text-red-400">{totals.voidCount}</p>
            <p className="text-xs text-content-3">
              ${totals.void.toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl border border-edge bg-card p-4">
            <div className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-blue-400" />
              <p className="text-xs text-content-3">Draft</p>
            </div>
            <p className="text-xl font-bold text-blue-400">
              {totals.draftCount}
            </p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3">
        <label className="text-xs text-content-3">Filter by status:</label>
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="rounded-lg border border-edge bg-card px-3 py-1.5 text-sm text-content focus:outline-none focus:ring-2 focus:ring-orange-500/40"
        >
          <option value="all">All</option>
          <option value="paid">Paid</option>
          <option value="open">Open</option>
          <option value="void">Void</option>
          <option value="draft">Draft</option>
          <option value="uncollectible">Uncollectible</option>
        </select>
        <span className="text-xs text-content-3">
          {invoicesData?.total ?? 0} results
        </span>
      </div>

      {/* Invoices Table */}
      <div className="overflow-hidden rounded-2xl border border-edge bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-edge bg-card-hover text-xs text-content-3">
                <th className="px-4 py-3 text-left font-medium">Invoice</th>
                <th className="px-4 py-3 text-left font-medium">Customer</th>
                <th className="px-4 py-3 text-left font-medium">Plan</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoicesData?.invoices.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-content-3"
                  >
                    No invoices found
                  </td>
                </tr>
              )}
              {invoicesData?.invoices.map((inv) => (
                <InvoiceRow key={inv.id} invoice={inv} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {invoicesData && invoicesData.total > 20 && (
          <div className="flex items-center justify-between border-t border-edge px-4 py-3">
            <p className="text-xs text-content-3">
              Page {page} of {Math.ceil(invoicesData.total / 20)}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
                className="rounded-lg border border-edge p-1.5 text-content-3 hover:bg-card-hover disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={page >= Math.ceil(invoicesData.total / 20)}
                onClick={() => onPageChange(page + 1)}
                className="rounded-lg border border-edge p-1.5 text-content-3 hover:bg-card-hover disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InvoiceRow({ invoice }: { invoice: RevenueInvoice }) {
  const statusColors: Record<string, string> = {
    paid: "bg-emerald-400/10 text-emerald-400",
    open: "bg-amber-400/10 text-amber-400",
    void: "bg-red-400/10 text-red-400",
    draft: "bg-blue-400/10 text-blue-400",
    uncollectible: "bg-gray-400/10 text-gray-400",
  };

  return (
    <tr className="border-b border-edge transition-colors last:border-b-0 hover:bg-card-hover">
      <td className="px-4 py-3">
        <p className="font-medium text-content">
          {invoice.number || invoice.id.slice(0, 20)}
        </p>
        <p className="max-w-[200px] truncate text-xs text-content-3">
          {invoice.description}
        </p>
      </td>
      <td className="px-4 py-3">
        <p className="text-content">{invoice.customerName}</p>
        <p className="text-xs text-content-3">{invoice.customerEmail}</p>
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center rounded-full border border-edge px-2 py-0.5 text-xs capitalize text-content-2">
          {invoice.plan}
        </span>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
            statusColors[invoice.status || ""] || "bg-gray-400/10 text-gray-400"
          }`}
        >
          {invoice.status}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="font-semibold text-content">
          ${invoice.amount.toLocaleString()}
        </span>
        <p className="text-xs uppercase text-content-3">{invoice.currency}</p>
      </td>
      <td className="px-4 py-3 text-xs text-content-2">
        {invoice.date
          ? new Date(invoice.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "—"}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-center gap-1">
          {invoice.hostedUrl && (
            <a
              href={invoice.hostedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg p-1.5 text-content-3 hover:bg-card-hover hover:text-blue-400"
              title="View invoice"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          {invoice.pdfUrl && (
            <a
              href={invoice.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg p-1.5 text-content-3 hover:bg-card-hover hover:text-emerald-400"
              title="Download PDF"
            >
              <Download className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Bookings Tab ───

function BookingsTab({ data }: { data: DetailedRevenueStats }) {
  const { bookings, subscriptions } = data;

  return (
    <div className="space-y-6">
      {/* Booking KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-edge bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-400/10 p-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-content-3">Completed Bookings</p>
              <p className="text-2xl font-bold text-content">
                {bookings.completed}
              </p>
              <p className="text-xs text-emerald-400">
                Active paid subscriptions
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-edge bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-400/10 p-2.5">
              <Clock className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-content-3">Incomplete Bookings</p>
              <p className="text-2xl font-bold text-content">
                {bookings.incomplete}
              </p>
              <p className="text-xs text-amber-400">
                Started checkout but didn&apos;t complete
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-edge bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-red-400/10 p-2.5">
              <XCircle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-content-3">Cancelled Bookings</p>
              <p className="text-2xl font-bold text-content">
                {bookings.cancelled}
              </p>
              <p className="text-xs text-red-400">
                Subscriptions cancelled or pending cancel
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-edge bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-400/10 p-2.5">
              <TrendingUp className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-content-3">Conversion Rate</p>
              <p className="text-2xl font-bold text-content">
                {bookings.conversionRate}%
              </p>
              <p className="text-xs text-blue-400">
                Completed / total attempts
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Funnel */}
      <div className="rounded-2xl border border-edge bg-card p-6">
        <h2 className="mb-6 text-sm font-semibold text-content">
          Subscription Funnel
        </h2>
        <div className="space-y-4">
          <FunnelStep
            label="Total Users"
            value={subscriptions.total}
            percentage={100}
            color="from-blue-500 to-indigo-500"
          />
          <FunnelStep
            label="Active Subscriptions"
            value={subscriptions.active}
            percentage={
              subscriptions.total > 0
                ? (subscriptions.active / subscriptions.total) * 100
                : 0
            }
            color="from-indigo-500 to-purple-500"
          />
          <FunnelStep
            label="Paid Subscribers"
            value={bookings.completed}
            percentage={
              subscriptions.total > 0
                ? (bookings.completed / subscriptions.total) * 100
                : 0
            }
            color="from-purple-500 to-pink-500"
          />
          <FunnelStep
            label="Incomplete (Abandoned)"
            value={bookings.incomplete}
            percentage={
              subscriptions.total > 0
                ? (bookings.incomplete / subscriptions.total) * 100
                : 0
            }
            color="from-amber-500 to-orange-500"
          />
          <FunnelStep
            label="Cancelled"
            value={subscriptions.cancelled}
            percentage={
              subscriptions.total > 0
                ? (subscriptions.cancelled / subscriptions.total) * 100
                : 0
            }
            color="from-red-500 to-rose-500"
          />
        </div>
      </div>

      {/* Subscription Status Grid */}
      <div className="rounded-2xl border border-edge bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold text-content">
          Subscription Status Breakdown
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatusCard
            label="Active"
            value={subscriptions.active}
            icon={CheckCircle2}
            color="emerald"
          />
          <StatusCard
            label="Trial"
            value={subscriptions.trial}
            icon={Clock}
            color="blue"
          />
          <StatusCard
            label="Cancelled"
            value={subscriptions.cancelled}
            icon={XCircle}
            color="red"
          />
          <StatusCard
            label="Expired"
            value={subscriptions.expired}
            icon={AlertTriangle}
            color="gray"
          />
          <StatusCard
            label="Past Due"
            value={subscriptions.pastDue}
            icon={AlertTriangle}
            color="amber"
          />
          <StatusCard
            label="Free"
            value={subscriptions.free}
            icon={Users}
            color="gray"
          />
          <StatusCard
            label="Premium"
            value={subscriptions.premium}
            icon={CreditCard}
            color="indigo"
          />
          <StatusCard
            label="Enterprise"
            value={subscriptions.enterprise}
            icon={DollarSign}
            color="amber"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Profit & Loss Tab ───

function ProfitLossTab({ data }: { data: DetailedRevenueStats }) {
  const { profitLoss, revenueByPlan, aiCosts } = data;

  const revenueItems = [
    {
      label: "Premium Subscriptions",
      amount: revenueByPlan.premium.monthlyRevenue,
      detail: `${revenueByPlan.premium.count} × $${revenueByPlan.premium.monthlyPrice}/mo`,
    },
    {
      label: "Enterprise Subscriptions",
      amount: revenueByPlan.enterprise.monthlyRevenue,
      detail: `${revenueByPlan.enterprise.count} × $${revenueByPlan.enterprise.monthlyPrice}/mo`,
    },
  ];

  const expenseItems = [
    {
      label: "AI Infrastructure (API Calls)",
      amount: aiCosts.totalCostUsd,
      detail: `${aiCosts.totalRequests.toLocaleString()} requests, ${aiCosts.totalTokens.toLocaleString()} tokens`,
    },
  ];

  const totalRevenueCalc = revenueItems.reduce((s, r) => s + r.amount, 0);
  const totalExpenseCalc = expenseItems.reduce((s, e) => s + e.amount, 0);
  const netCalc = totalRevenueCalc - totalExpenseCalc;

  return (
    <div className="space-y-6">
      {/* P&L Summary Header */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-edge bg-card p-6">
          <p className="text-xs text-content-3">Gross Revenue</p>
          <p className="mt-1 text-3xl font-bold text-emerald-400">
            ${profitLoss.grossRevenue.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-content-3">Monthly</p>
        </div>
        <div className="rounded-2xl border border-edge bg-card p-6">
          <p className="text-xs text-content-3">Total Expenses</p>
          <p className="mt-1 text-3xl font-bold text-red-400">
            ${profitLoss.aiInfrastructureCost.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-content-3">Monthly</p>
        </div>
        <div
          className={`rounded-2xl border p-6 ${
            profitLoss.isProfit
              ? "border-emerald-500/20 bg-emerald-500/5"
              : "border-red-500/20 bg-red-500/5"
          }`}
        >
          <p className="text-xs text-content-3">
            Net {profitLoss.isProfit ? "Profit" : "Loss"}
          </p>
          <p
            className={`mt-1 text-3xl font-bold ${
              profitLoss.isProfit ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {profitLoss.isProfit ? "+" : "-"}$
            {Math.abs(profitLoss.netProfit).toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-content-3">
            {profitLoss.margin}% margin
          </p>
        </div>
      </div>

      {/* Detailed P&L Statement */}
      <div className="rounded-2xl border border-edge bg-card">
        <div className="border-b border-edge px-6 py-4">
          <h2 className="text-sm font-semibold text-content">
            Profit & Loss Statement
          </h2>
          <p className="text-xs text-content-3">
            Period: {data.period.startDate} — {data.period.endDate}
          </p>
        </div>

        <div className="divide-y divide-edge">
          {/* Revenue Section */}
          <div className="px-6 py-4">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
              <ArrowUpRight className="h-3.5 w-3.5" />
              Revenue
            </h3>
            <div className="space-y-2">
              {revenueItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm text-content">{item.label}</p>
                    <p className="text-xs text-content-3">{item.detail}</p>
                  </div>
                  <p className="font-mono text-sm font-semibold text-emerald-400">
                    +${item.amount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-dashed border-edge pt-3">
              <p className="text-sm font-medium text-content">Total Revenue</p>
              <p className="font-mono text-sm font-bold text-emerald-400">
                ${totalRevenueCalc.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Expenses Section */}
          <div className="px-6 py-4">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-red-400">
              <ArrowDownRight className="h-3.5 w-3.5" />
              Expenses
            </h3>
            <div className="space-y-2">
              {expenseItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm text-content">{item.label}</p>
                    <p className="text-xs text-content-3">{item.detail}</p>
                  </div>
                  <p className="font-mono text-sm font-semibold text-red-400">
                    -${item.amount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-dashed border-edge pt-3">
              <p className="text-sm font-medium text-content">Total Expenses</p>
              <p className="font-mono text-sm font-bold text-red-400">
                ${totalExpenseCalc.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Net Income */}
          <div
            className={`px-6 py-4 ${
              netCalc >= 0 ? "bg-emerald-500/5" : "bg-red-500/5"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-content">
                  Net {netCalc >= 0 ? "Income" : "Loss"}
                </p>
                <p className="text-xs text-content-3">Revenue minus expenses</p>
              </div>
              <p
                className={`font-mono text-xl font-bold ${
                  netCalc >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {netCalc >= 0 ? "+" : "-"}${Math.abs(netCalc).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue vs Cost Timeline */}
      <div className="rounded-2xl border border-edge bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold text-content">
          Daily Profit / Loss Trend
        </h2>
        <div className="space-y-1">
          {data.dailyRevenue.slice(-14).map((d) => {
            const maxVal = Math.max(
              ...data.dailyRevenue
                .slice(-14)
                .map((x) => Math.max(x.revenue, Math.abs(x.profit))),
              1,
            );
            const profitWidth = (Math.abs(d.profit) / maxVal) * 100;
            return (
              <div key={d.date} className="flex items-center gap-3">
                <span className="w-20 text-right text-[10px] text-content-3">
                  {new Date(d.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <div className="flex-1">
                  <div className="h-4 overflow-hidden rounded bg-card-hover">
                    <div
                      className={`h-full rounded ${
                        d.profit >= 0 ? "bg-emerald-400/60" : "bg-red-400/60"
                      }`}
                      style={{
                        width: `${Math.max(profitWidth, 2)}%`,
                      }}
                    />
                  </div>
                </div>
                <span
                  className={`w-16 text-right text-[10px] font-medium ${
                    d.profit >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {d.profit >= 0 ? "+" : ""}${d.profit}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Helper Components ───

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-edge bg-card p-3 text-center">
      <p className="text-[10px] text-content-3">{label}</p>
      <p className="text-sm font-bold text-content">{value}</p>
    </div>
  );
}

function StatusBadge({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
    red: "bg-red-400/10 text-red-400 border-red-400/20",
    blue: "bg-blue-400/10 text-blue-400 border-blue-400/20",
    amber: "bg-amber-400/10 text-amber-400 border-amber-400/20",
    gray: "bg-gray-400/10 text-gray-400 border-gray-400/20",
    indigo: "bg-indigo-400/10 text-indigo-400 border-indigo-400/20",
  };

  return (
    <div
      className={`rounded-lg border p-2.5 text-center ${colors[color] || colors.gray}`}
    >
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[10px]">{label}</p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: string;
}) {
  const accentColors: Record<string, string> = {
    emerald: "text-emerald-400",
    red: "text-red-400",
    blue: "text-blue-400",
    amber: "text-amber-400",
    gray: "text-gray-400",
    indigo: "text-indigo-400",
  };

  return (
    <div className="rounded-xl border border-edge bg-card-hover p-3 text-center">
      <p className="text-[10px] text-content-3">{label}</p>
      <p
        className={`text-lg font-bold ${accent ? accentColors[accent] : "text-content"}`}
      >
        {value}
      </p>
    </div>
  );
}

function StatusCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
}) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    emerald: { bg: "bg-emerald-400/10", text: "text-emerald-400" },
    red: { bg: "bg-red-400/10", text: "text-red-400" },
    blue: { bg: "bg-blue-400/10", text: "text-blue-400" },
    amber: { bg: "bg-amber-400/10", text: "text-amber-400" },
    gray: { bg: "bg-gray-400/10", text: "text-gray-400" },
    indigo: { bg: "bg-indigo-400/10", text: "text-indigo-400" },
  };

  const c = colorMap[color] || colorMap.gray;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-edge bg-card-hover p-3">
      <div className={`rounded-lg p-2 ${c.bg}`}>
        <Icon className={`h-4 w-4 ${c.text}`} />
      </div>
      <div>
        <p className="text-lg font-bold text-content">{value}</p>
        <p className="text-[10px] text-content-3">{label}</p>
      </div>
    </div>
  );
}

function FunnelStep({
  label,
  value,
  percentage,
  color,
}: {
  label: string;
  value: number;
  percentage: number;
  color: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-content-2">{label}</span>
        <span className="text-content-3">
          {value}{" "}
          <span className="text-content-3">({percentage.toFixed(1)}%)</span>
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-card-hover">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color}`}
          style={{ width: `${Math.max(percentage, 0.5)}%` }}
        />
      </div>
    </div>
  );
}
