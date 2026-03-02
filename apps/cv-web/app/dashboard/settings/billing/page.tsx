"use client";

import { useState, useEffect, Fragment } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSubscriptionStore } from "@/lib/store";
import { subscriptionsApi } from "@/lib/api";
import { PlanInfo, Invoice } from "@/types";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Settings,
  Crown,
  Check,
  Loader2,
  Sparkles,
  Zap,
  Shield,
  ArrowRight,
  ExternalLink,
  FileText,
  Download,
  Receipt,
  Key,
  X,
  TrendingUp,
  Clock,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Eye,
  BarChart3,
  Wallet,
  Activity,
} from "lucide-react";

/* ─── Animated Modal ─── */
function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <Fragment>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={`fixed inset-x-4 top-[8%] z-50 mx-auto overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#141428]/95 to-[#0c0c20]/95 shadow-2xl shadow-indigo-500/10 backdrop-blur-xl sm:inset-x-auto ${wide ? "max-w-2xl" : "max-w-lg"}`}
          >
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
              <h2 className="text-lg font-semibold text-content">{title}</h2>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-content-3 transition hover:bg-white/5 hover:text-content"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-y-auto px-6 py-5">
              {children}
            </div>
          </motion.div>
        </Fragment>
      )}
    </AnimatePresence>
  );
}

/* ─── Glassmorphism Card ─── */
function GlassCard({
  children,
  className = "",
  glow,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay }}
      className={`relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-6 backdrop-blur-md ${className}`}
    >
      {glow && (
        <div
          className={`pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full blur-3xl opacity-20 ${glow}`}
        />
      )}
      <div className="relative">{children}</div>
    </motion.div>
  );
}

export default function BillingPage() {
  const { subscription, setSubscription } = useSubscriptionStore();
  const [plans, setPlans] = useState<PlanInfo[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [transactionsExpanded, setTransactionsExpanded] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const isSuccess = searchParams.get("success") === "true";

    if (isSuccess) {
      toast.success(
        `Successfully upgraded to ${searchParams.get("plan") || "new plan"}!`,
      );
    }
    if (searchParams.get("cancelled") === "true") {
      toast("Checkout was cancelled", { icon: "ℹ️" });
    }

    const loadData = () =>
      Promise.all([
        subscriptionsApi
          .getPlans()
          .then((r) =>
            setPlans(Array.isArray(r.data) ? r.data : r.data?.plans || []),
          ),
        subscriptionsApi.getMy().then((r) => setSubscription(r.data)),
        subscriptionsApi
          .getInvoices()
          .then((r) => setInvoices(r.data))
          .catch(() => {}),
        subscriptionsApi
          .getTransactions()
          .then((r) => setTransactions(Array.isArray(r.data) ? r.data : []))
          .catch(() => {}),
      ]);

    loadData()
      .catch(() => {})
      .finally(() => setLoading(false));

    if (isSuccess) {
      const expectedPlan = searchParams.get("plan");
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        try {
          const res = await subscriptionsApi.getMy();
          setSubscription(res.data);
          if (res.data.plan === expectedPlan || attempts >= 10) {
            clearInterval(poll);
          }
        } catch {
          clearInterval(poll);
        }
      }, 2000);
      return () => clearInterval(poll);
    }
  }, []);

  const handleUpgrade = async (plan: string) => {
    setUpgrading(plan);
    try {
      const res = await subscriptionsApi.upgrade(plan, billingCycle);
      if (res.data.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
        return;
      }
      setSubscription(res.data);
      toast.success(`Plan changed to ${plan}!`);
      setPlanModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Upgrade failed");
    } finally {
      setUpgrading(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel your subscription?")) return;
    try {
      const res = await subscriptionsApi.cancel();
      setSubscription(res.data);
      toast.success(
        res.data.cancelAtPeriodEnd
          ? "Subscription will cancel at end of billing period"
          : "Subscription cancelled",
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const handleManageBilling = async () => {
    try {
      const res = await subscriptionsApi.getBillingPortal();
      if (res.data.url) {
        window.location.href = res.data.url;
      } else {
        toast("No billing information available yet", { icon: "ℹ️" });
      }
    } catch {
      toast.error("Could not open billing portal");
    }
  };

  const planIcons: Record<string, any> = {
    free: Zap,
    premium: Crown,
    enterprise: Shield,
  };

  const planGradients: Record<string, string> = {
    free: "from-zinc-500/20 to-zinc-600/5",
    premium: "from-indigo-500/20 to-purple-500/5",
    enterprise: "from-purple-500/20 to-pink-500/5",
  };

  const planGlows: Record<string, string> = {
    free: "bg-zinc-400",
    premium: "bg-indigo-500",
    enterprise: "bg-purple-500",
  };

  const txTypeIcons: Record<string, any> = {
    payment: DollarSign,
    subscription_created: Sparkles,
    plan_change: TrendingUp,
    cancellation: X,
  };

  const txTypeColors: Record<string, string> = {
    payment: "text-emerald-400 bg-emerald-500/10",
    subscription_created: "text-indigo-400 bg-indigo-500/10",
    plan_change: "text-purple-400 bg-purple-500/10",
    cancellation: "text-red-400 bg-red-500/10",
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-sm text-content-3">Loading billing data...</p>
        </div>
      </div>
    );
  }

  const currentPlan = plans.find((p) => p.plan === subscription?.plan);
  const currentPrice =
    billingCycle === "monthly"
      ? currentPlan?.monthlyPrice || 0
      : (currentPlan?.yearlyPrice || 0) / 12;
  const daysRemaining = subscription?.currentPeriodEnd
    ? Math.max(
        0,
        Math.ceil(
          (new Date(subscription.currentPeriodEnd).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : 0;

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl font-bold tracking-tight text-content">
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Billing
          </span>{" "}
          & Subscription
        </h1>
        <p className="mt-1 text-sm text-content-3">
          Manage your plan, payments, and transaction history
        </p>
      </motion.div>

      {/* Nav Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex gap-1 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-1.5 backdrop-blur-sm"
      >
        {[
          {
            href: "/dashboard/settings",
            label: "General",
            icon: Settings,
            active: false,
          },
          {
            href: "/dashboard/settings/billing",
            label: "Billing",
            icon: CreditCard,
            active: true,
          },
          {
            href: "/dashboard/settings/api-keys",
            label: "API Keys",
            icon: Key,
            active: false,
          },
        ].map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
              tab.active
                ? "bg-white/[0.08] text-content shadow-sm shadow-indigo-500/10"
                : "text-content-3 hover:bg-white/[0.04] hover:text-content"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Link>
        ))}
      </motion.div>

      {/* ─── Current Plan Overview ─── */}
      {subscription && (
        <GlassCard glow={planGlows[subscription.plan] || "bg-indigo-500"}>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${planGradients[subscription.plan] || planGradients.free}`}
              >
                {(() => {
                  const Icon = planIcons[subscription.plan] || Zap;
                  return <Icon className="h-7 w-7 text-content" />;
                })()}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold capitalize text-content">
                    {currentPlan?.name || subscription.plan} Plan
                  </h2>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      subscription.status === "active"
                        ? "bg-emerald-400/10 text-emerald-400"
                        : subscription.status === "cancelled"
                          ? "bg-red-400/10 text-red-400"
                          : "bg-amber-400/10 text-amber-400"
                    }`}
                  >
                    {subscription.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-content-3">
                  {currentPlan?.description || "Your current subscription plan"}
                </p>
                {subscription.cancelAtPeriodEnd && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-amber-400">
                    <Clock className="h-3 w-3" />
                    Cancels at end of billing period
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {subscription.stripeCustomerId && (
                <button
                  onClick={handleManageBilling}
                  className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-xs font-medium text-content-2 transition hover:bg-white/[0.08]"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Stripe Portal
                </button>
              )}
              <button
                onClick={() => setPlanModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:shadow-indigo-500/40"
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                Change Plan
              </button>
            </div>
          </div>

          {/* Billing Quick Stats */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                label: "Monthly Cost",
                value: `$${currentPrice.toFixed(0)}`,
                icon: DollarSign,
                color: "text-emerald-400",
              },
              {
                label: "Billing Cycle",
                value: subscription.currentPeriodEnd ? "Monthly" : "—",
                icon: RefreshCw,
                color: "text-indigo-400",
              },
              {
                label: "Days Remaining",
                value: daysRemaining > 0 ? `${daysRemaining} days` : "—",
                icon: Calendar,
                color: "text-purple-400",
              },
              {
                label: "Next Payment",
                value: subscription.currentPeriodEnd
                  ? new Date(subscription.currentPeriodEnd).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                      },
                    )
                  : "—",
                icon: Clock,
                color: "text-sky-400",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-white/[0.04] bg-white/[0.02] px-3.5 py-3"
              >
                <div className="flex items-center gap-2">
                  <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
                  <p className="text-[11px] font-medium uppercase tracking-wider text-content-4">
                    {stat.label}
                  </p>
                </div>
                <p className="mt-1 text-sm font-bold text-content">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Cancel */}
          {subscription.plan !== "free" && !subscription.cancelAtPeriodEnd && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleCancel}
                className="text-xs text-content-4 transition hover:text-red-400"
              >
                Cancel subscription
              </button>
            </div>
          )}
        </GlassCard>
      )}

      {/* ─── Usage Section ─── */}
      {subscription && (
        <GlassCard glow="bg-sky-500" delay={0.05}>
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-content">
                Usage This Period
              </h3>
              <p className="text-xs text-content-3">
                Track your resource consumption
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "AI Credits",
                used: subscription.currentUsage?.aiCreditsUsed || 0,
                max: subscription.limits?.maxAiCreditsPerMonth || 0,
                color: "from-indigo-500 to-purple-500",
                icon: Sparkles,
              },
              {
                label: "PDF Exports",
                used: subscription.currentUsage?.pdfExportsUsed || 0,
                max: subscription.limits?.maxPdfExportsPerMonth || 0,
                color: "from-emerald-500 to-teal-500",
                icon: FileText,
              },
              {
                label: "CVs Created",
                used: subscription.currentUsage?.cvsCreated || 0,
                max: subscription.limits?.maxCvs || 0,
                color: "from-sky-500 to-blue-500",
                icon: FileText,
              },
              {
                label: "Projects",
                used: subscription.currentUsage?.projectsCreated || 0,
                max: subscription.limits?.maxProjects || 0,
                color: "from-orange-500 to-red-500",
                icon: Activity,
              },
            ].map((item) => {
              const pct =
                item.max === -1
                  ? 0
                  : item.max === 0
                    ? 0
                    : Math.min(100, (item.used / item.max) * 100);
              const isWarning = pct >= 80 && pct < 100;
              const isCritical = pct >= 100;

              return (
                <motion.div
                  key={item.label}
                  whileHover={{ y: -2 }}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-content-3">
                      {item.label}
                    </p>
                    <item.icon className="h-3.5 w-3.5 text-content-4" />
                  </div>
                  <p className="mt-2 text-lg font-bold text-content">
                    {item.used}
                    <span className="text-sm font-normal text-content-3">
                      {" "}
                      / {item.max === -1 ? "∞" : item.max}
                    </span>
                  </p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={`h-full rounded-full bg-gradient-to-r ${
                        isCritical
                          ? "from-red-500 to-red-400"
                          : isWarning
                            ? "from-amber-500 to-amber-400"
                            : item.color
                      }`}
                    />
                  </div>
                  {isWarning && (
                    <p className="mt-1.5 text-[10px] text-amber-400">
                      ⚠ {100 - Math.round(pct)}% remaining
                    </p>
                  )}
                  {isCritical && (
                    <p className="mt-1.5 text-[10px] text-red-400">
                      Limit reached
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* ─── Transactions Section ─── */}
      <GlassCard glow="bg-emerald-500" delay={0.1}>
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-content">
                Transaction History
              </h3>
              <p className="text-xs text-content-3">
                {transactions.length} total transaction
                {transactions.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          {transactions.length > 5 && (
            <button
              onClick={() => setTransactionsExpanded(!transactionsExpanded)}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-indigo-400 transition hover:bg-indigo-500/10"
            >
              {transactionsExpanded ? "Show Less" : "View All"}
              {transactionsExpanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>

        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04]">
              <Receipt className="h-6 w-6 text-content-4" />
            </div>
            <p className="mt-3 text-sm font-medium text-content-2">
              No transactions yet
            </p>
            <p className="mt-1 text-xs text-content-4">
              Transactions will appear here when you make payments
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {(transactionsExpanded
                ? transactions
                : transactions.slice(0, 5)
              ).map((tx, i) => {
                const Icon = txTypeIcons[tx.type] || Receipt;
                const colorClass =
                  txTypeColors[tx.type] || txTypeColors.payment;

                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 transition hover:bg-white/[0.04]"
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorClass}`}
                      >
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-content">
                          {tx.description}
                        </p>
                        <div className="mt-0.5 flex items-center gap-2">
                          <p className="text-xs text-content-4">
                            {tx.date
                              ? new Date(tx.date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "—"}
                          </p>
                          {tx.plan && (
                            <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-medium capitalize text-content-3">
                              {tx.plan}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {tx.amount > 0 ? (
                        <span className="text-sm font-bold text-content">
                          ${tx.amount.toFixed(2)}
                          <span className="ml-1 text-[10px] font-normal uppercase text-content-4">
                            {tx.currency}
                          </span>
                        </span>
                      ) : (
                        <span className="text-sm text-content-3">—</span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          tx.status === "completed"
                            ? "bg-emerald-400/10 text-emerald-400"
                            : tx.status === "pending"
                              ? "bg-amber-400/10 text-amber-400"
                              : "bg-white/5 text-content-3"
                        }`}
                      >
                        {tx.status}
                      </span>
                      {tx.pdfUrl && (
                        <a
                          href={tx.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg p-1.5 text-content-4 transition hover:bg-white/[0.06] hover:text-content"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </GlassCard>

      {/* ─── Invoice History ─── */}
      {invoices.length > 0 && (
        <GlassCard glow="bg-amber-500" delay={0.15}>
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-content">Invoices</h3>
              <p className="text-xs text-content-3">
                Download your payment receipts
              </p>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-white/[0.04]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.04] bg-white/[0.02]">
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-content-4">
                    Invoice
                  </th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-content-4">
                    Date
                  </th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-content-4">
                    Amount
                  </th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-content-4">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-content-4">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="transition hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <FileText className="h-4 w-4 text-content-4" />
                        <span className="text-sm font-medium text-content">
                          {invoice.number || invoice.id.slice(0, 16)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-content-3">
                      {invoice.date
                        ? new Date(invoice.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-content">
                        ${invoice.amount.toFixed(2)}
                      </span>
                      <span className="ml-1 text-[10px] uppercase text-content-4">
                        {invoice.currency}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          invoice.status === "paid"
                            ? "bg-emerald-400/10 text-emerald-400"
                            : invoice.status === "open"
                              ? "bg-amber-400/10 text-amber-400"
                              : "bg-white/5 text-content-2"
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {invoice.hostedUrl && (
                          <a
                            href={invoice.hostedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg p-1.5 text-content-4 transition hover:bg-white/[0.06] hover:text-content"
                            title="View invoice"
                          >
                            <Eye className="h-4 w-4" />
                          </a>
                        )}
                        {invoice.pdfUrl && (
                          <a
                            href={invoice.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg p-1.5 text-content-4 transition hover:bg-white/[0.06] hover:text-content"
                            title="Download PDF"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* ═══════════════════════════════════ */}
      {/* CHANGE PLAN MODAL                  */}
      {/* ═══════════════════════════════════ */}
      <Modal
        open={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
        title="Change Plan"
        wide
      >
        {/* Billing cycle toggle */}
        <div className="mb-6 flex items-center justify-center gap-3">
          <span
            className={`text-sm ${billingCycle === "monthly" ? "text-content" : "text-content-3"}`}
          >
            Monthly
          </span>
          <button
            onClick={() =>
              setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")
            }
            className={`relative h-6 w-11 rounded-full transition ${billingCycle === "yearly" ? "bg-indigo-600" : "bg-white/10"}`}
          >
            <div
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${billingCycle === "yearly" ? "translate-x-[22px]" : "translate-x-0.5"}`}
            />
          </button>
          <span
            className={`text-sm ${billingCycle === "yearly" ? "text-content" : "text-content-3"}`}
          >
            Yearly <span className="text-xs text-emerald-400">(Save 20%)</span>
          </span>
        </div>

        {/* Plans grid */}
        <div className="grid gap-4 sm:grid-cols-3">
          {plans.map((plan) => {
            const Icon = planIcons[plan.plan] || Zap;
            const isCurrent = subscription?.plan === plan.plan;
            const price =
              billingCycle === "monthly"
                ? plan.monthlyPrice
                : plan.yearlyPrice / 12;

            return (
              <motion.div
                key={plan.plan}
                whileHover={{ y: -3 }}
                className={`relative rounded-xl border p-5 transition ${
                  isCurrent
                    ? "border-indigo-500/30 bg-indigo-500/5 ring-1 ring-indigo-500/20"
                    : plan.popular
                      ? "border-purple-500/20 bg-purple-500/5"
                      : "border-white/[0.06] bg-white/[0.02]"
                }`}
              >
                {plan.popular && !isCurrent && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    Popular
                  </div>
                )}
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      plan.plan === "enterprise"
                        ? "bg-purple-500/20 text-purple-400"
                        : plan.plan === "premium"
                          ? "bg-indigo-500/20 text-indigo-400"
                          : "bg-white/[0.06] text-content-2"
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <h3 className="text-base font-bold capitalize text-content">
                    {plan.name}
                  </h3>
                </div>

                <div className="mt-3">
                  <span className="text-2xl font-bold text-content">
                    ${price.toFixed(0)}
                  </span>
                  <span className="text-xs text-content-3">/mo</span>
                  {billingCycle === "yearly" && plan.monthlyPrice > 0 && (
                    <p className="mt-0.5 text-[10px] text-content-4">
                      Billed ${plan.yearlyPrice}/year
                    </p>
                  )}
                </div>

                <ul className="mt-4 space-y-1.5">
                  {plan.features?.slice(0, 5).map((feat) => (
                    <li
                      key={feat}
                      className="flex items-start gap-1.5 text-xs text-content-2"
                    >
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
                      {feat}
                    </li>
                  ))}
                  {plan.features && plan.features.length > 5 && (
                    <li className="text-[10px] text-content-4">
                      +{plan.features.length - 5} more...
                    </li>
                  )}
                </ul>

                <div className="mt-4">
                  {isCurrent ? (
                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] py-2 text-center text-xs font-medium text-content-3">
                      Current Plan
                    </div>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(plan.plan)}
                      disabled={upgrading === plan.plan}
                      className={`flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition ${
                        plan.plan === "premium"
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25"
                          : plan.plan === "enterprise"
                            ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25"
                            : "border border-white/[0.08] text-content-2 hover:bg-white/[0.06]"
                      }`}
                    >
                      {upgrading === plan.plan ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          {plan.plan === "free" ? "Downgrade" : "Upgrade"}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}
