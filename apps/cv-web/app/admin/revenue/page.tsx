"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import toast from "react-hot-toast";
import {
  DollarSign,
  TrendingUp,
  Users,
  CreditCard,
  Loader2,
} from "lucide-react";

export default function AdminRevenuePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await adminApi.getRevenue();
        setData(res.data);
      } catch {
        toast.error("Failed to load revenue data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  const stats = [
    {
      label: "Monthly Recurring Revenue",
      value: `$${(data?.mrr ?? 0).toLocaleString()}`,
      icon: DollarSign,
      color: "text-emerald-400 bg-emerald-400/10",
    },
    {
      label: "Annual Run Rate",
      value: `$${((data?.mrr ?? 0) * 12).toLocaleString()}`,
      icon: TrendingUp,
      color: "text-blue-400 bg-blue-400/10",
    },
    {
      label: "Paying Customers",
      value:
        (data?.subscriptionStats?.premium ?? 0) +
        (data?.subscriptionStats?.enterprise ?? 0),
      icon: Users,
      color: "text-indigo-400 bg-indigo-400/10",
    },
    {
      label: "Est. AI Cost / Month",
      value: `$${((data?.aiCosts?.totalCost ?? 0) / 1000).toFixed(2)}`,
      icon: CreditCard,
      color: "text-amber-400 bg-amber-400/10",
    },
  ];

  const plans = [
    { name: "Free", count: data?.subscriptionStats?.free ?? 0, price: 0 },
    {
      name: "Premium",
      count: data?.subscriptionStats?.premium ?? 0,
      price: 12,
    },
    {
      name: "Enterprise",
      count: data?.subscriptionStats?.enterprise ?? 0,
      price: 49,
    },
  ];

  const totalUsers = plans.reduce((s, p) => s + p.count, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-content">Revenue</h1>
        <p className="text-sm text-content-3">
          Financial overview and subscription metrics
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-edge bg-card p-5"
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-xl p-2.5 ${s.color}`}>
                <s.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-content-3">{s.label}</p>
                <p className="text-lg font-bold text-content">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

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
                    <span className="text-content font-semibold">
                      ${(p.price * p.count).toLocaleString()}/mo
                    </span>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-card-hover">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {data?.aiCosts && (
        <div className="rounded-2xl border border-edge bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold text-content">
            AI Infrastructure Costs
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-content-3">Total Requests</p>
              <p className="text-lg font-bold text-content">
                {(data.aiCosts.totalRequests ?? 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-content-3">Total Tokens</p>
              <p className="text-lg font-bold text-content">
                {(data.aiCosts.totalTokens ?? 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-content-3">Total Cost</p>
              <p className="text-lg font-bold text-content">
                ${((data.aiCosts.totalCost ?? 0) / 1000).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-content-3">Net Margin</p>
              <p className="text-lg font-bold text-emerald-400">
                {data.mrr > 0
                  ? `${(((data.mrr - (data.aiCosts.totalCost ?? 0) / 1000) / data.mrr) * 100).toFixed(0)}%`
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
