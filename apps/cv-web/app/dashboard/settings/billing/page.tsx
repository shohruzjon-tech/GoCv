"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSubscriptionStore } from "@/lib/store";
import { subscriptionsApi } from "@/lib/api";
import { PlanInfo, Invoice } from "@/types";
import toast from "react-hot-toast";
import {
  CreditCard,
  User,
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
} from "lucide-react";

export default function BillingPage() {
  const { subscription, setSubscription } = useSubscriptionStore();
  const [plans, setPlans] = useState<PlanInfo[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for Stripe redirect params
    if (searchParams.get("success") === "true") {
      toast.success(
        `Successfully upgraded to ${searchParams.get("plan") || "new plan"}!`,
      );
    }
    if (searchParams.get("cancelled") === "true") {
      toast("Checkout was cancelled", { icon: "ℹ️" });
    }

    Promise.all([
      subscriptionsApi.getPlans().then((r) => setPlans(r.data)),
      subscriptionsApi.getMy().then((r) => setSubscription(r.data)),
      subscriptionsApi
        .getInvoices()
        .then((r) => setInvoices(r.data))
        .catch(() => {}),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async (plan: string) => {
    setUpgrading(plan);
    try {
      const res = await subscriptionsApi.upgrade(plan, billingCycle);

      // If we get a checkoutUrl, redirect to Stripe Checkout
      if (res.data.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
        return;
      }

      // Direct upgrade (dev mode or downgrade)
      setSubscription(res.data);
      toast.success(`Plan changed to ${plan}!`);
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

  const planColors: Record<string, string> = {
    free: "border-zinc-700 bg-zinc-800/20",
    premium: "border-indigo-500/30 bg-indigo-500/5 ring-1 ring-indigo-500/20",
    enterprise:
      "border-purple-500/30 bg-purple-500/5 ring-1 ring-purple-500/20",
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          <span className="text-gradient">Billing</span> & Plan
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Manage your subscription and billing
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/[0.06] pb-1">
        <Link
          href="/dashboard/settings"
          className="rounded-t-xl border-b-2 border-transparent px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white"
        >
          <User className="mb-0.5 mr-1.5 inline h-4 w-4" />
          Profile
        </Link>
        <Link
          href="/dashboard/settings/billing"
          className="rounded-t-xl border-b-2 border-indigo-500 px-4 py-2 text-sm font-medium text-white"
        >
          <CreditCard className="mb-0.5 mr-1.5 inline h-4 w-4" />
          Billing
        </Link>
      </div>

      {/* Current Plan */}
      {subscription && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Current Plan</h3>
              <p className="mt-1 flex items-center gap-2 text-lg font-bold capitalize text-indigo-400">
                <Sparkles className="h-5 w-5" />
                {subscription.plan}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">
                Status:{" "}
                <span className="capitalize text-emerald-400">
                  {subscription.status}
                </span>
                {subscription.cancelAtPeriodEnd && (
                  <span className="ml-2 text-amber-400">
                    • Cancels at period end
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {subscription.stripeCustomerId && (
                <button
                  onClick={handleManageBilling}
                  className="flex items-center gap-1.5 rounded-xl border border-white/[0.06] px-4 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.04]"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Manage Billing
                </button>
              )}
              {subscription.plan !== "free" &&
                !subscription.cancelAtPeriodEnd && (
                  <button
                    onClick={handleCancel}
                    className="text-xs text-red-400/60 hover:text-red-400"
                  >
                    Cancel subscription
                  </button>
                )}
            </div>
          </div>

          {/* Usage */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "AI Credits",
                used: subscription.currentUsage?.aiCreditsUsed || 0,
                max: subscription.limits?.maxAiCreditsPerMonth || 0,
              },
              {
                label: "PDF Exports",
                used: subscription.currentUsage?.pdfExportsUsed || 0,
                max: subscription.limits?.maxPdfExportsPerMonth || 0,
              },
              {
                label: "CVs Created",
                used: subscription.currentUsage?.cvsCreated || 0,
                max: subscription.limits?.maxCvs || 0,
              },
              {
                label: "Projects",
                used: subscription.currentUsage?.projectsCreated || 0,
                max: subscription.limits?.maxProjects || 0,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
              >
                <p className="text-xs text-zinc-500">{item.label}</p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {item.used} / {item.max === -1 ? "∞" : item.max}
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-indigo-500"
                    style={{
                      width: `${item.max === -1 ? 0 : Math.min(100, (item.used / item.max) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Billing Cycle Toggle */}
      <div className="flex items-center justify-center gap-3">
        <span
          className={`text-sm ${billingCycle === "monthly" ? "text-white" : "text-zinc-500"}`}
        >
          Monthly
        </span>
        <button
          onClick={() =>
            setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")
          }
          className={`relative h-6 w-11 rounded-full transition ${billingCycle === "yearly" ? "bg-indigo-600" : "bg-zinc-700"}`}
        >
          <div
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${billingCycle === "yearly" ? "translate-x-5.5" : "translate-x-0.5"}`}
          />
        </button>
        <span
          className={`text-sm ${billingCycle === "yearly" ? "text-white" : "text-zinc-500"}`}
        >
          Yearly <span className="text-xs text-emerald-400">(Save 20%)</span>
        </span>
      </div>

      {/* Plans */}
      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => {
          const Icon = planIcons[plan.plan] || Zap;
          const isCurrent = subscription?.plan === plan.plan;
          const price =
            billingCycle === "monthly"
              ? plan.monthlyPrice
              : plan.yearlyPrice / 12;

          return (
            <div
              key={plan.plan}
              className={`rounded-2xl border p-6 transition ${planColors[plan.plan] || ""}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    plan.plan === "enterprise"
                      ? "bg-purple-500/20 text-purple-400"
                      : plan.plan === "premium"
                        ? "bg-indigo-500/20 text-indigo-400"
                        : "bg-zinc-700/50 text-zinc-400"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold capitalize text-white">
                    {plan.name}
                  </h3>
                </div>
              </div>

              <div className="mt-4">
                <span className="text-3xl font-bold text-white">
                  ${price.toFixed(0)}
                </span>
                <span className="text-sm text-zinc-500">/mo</span>
                {billingCycle === "yearly" && plan.monthlyPrice > 0 && (
                  <p className="mt-1 text-xs text-zinc-500">
                    Billed ${plan.yearlyPrice}/year
                  </p>
                )}
              </div>

              <ul className="mt-6 space-y-2.5">
                {plan.features?.map((feat) => (
                  <li
                    key={feat}
                    className="flex items-start gap-2 text-sm text-zinc-300"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    {feat}
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                {isCurrent ? (
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] py-2.5 text-center text-sm font-medium text-zinc-400">
                    Current Plan
                  </div>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.plan)}
                    disabled={upgrading === plan.plan}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition ${
                      plan.plan === "premium"
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25"
                        : plan.plan === "enterprise"
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25"
                          : "border border-white/[0.06] text-zinc-300 hover:bg-white/[0.04]"
                    }`}
                  >
                    {upgrading === plan.plan ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        {plan.plan === "free" ? "Downgrade" : "Upgrade"}
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Invoice History */}
      {invoices.length > 0 && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <Receipt className="h-4 w-4 text-indigo-400" />
            Invoice History
          </h3>
          <div className="space-y-2">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.01] px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-zinc-500" />
                  <div>
                    <p className="text-sm font-medium text-white">
                      {invoice.number || invoice.id.slice(0, 16)}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {invoice.date
                        ? new Date(invoice.date).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-white">
                    ${invoice.amount.toFixed(2)}{" "}
                    <span className="text-xs uppercase text-zinc-500">
                      {invoice.currency}
                    </span>
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      invoice.status === "paid"
                        ? "bg-emerald-400/10 text-emerald-400"
                        : invoice.status === "open"
                          ? "bg-amber-400/10 text-amber-400"
                          : "bg-zinc-400/10 text-zinc-400"
                    }`}
                  >
                    {invoice.status}
                  </span>
                  {invoice.pdfUrl && (
                    <a
                      href={invoice.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-white/[0.04] hover:text-white"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
