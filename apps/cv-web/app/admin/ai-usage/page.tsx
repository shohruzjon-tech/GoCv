"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import toast from "react-hot-toast";
import { Brain, Loader2, Zap, TrendingUp } from "lucide-react";

export default function AdminAiUsagePage() {
  const [stats, setStats] = useState<any>(null);
  const [usage, setUsage] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.getAiGlobalStats().then((r) => setStats(r.data)),
      adminApi.getAiUsage(1, 50).then((r) => setUsage(r.data.usage || r.data)),
    ])
      .catch(() => toast.error("Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-content">AI Usage Analytics</h1>
        <p className="text-sm text-content-3">
          Monitor AI tool usage and costs
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-edge bg-card p-4">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-cyan-400" />
              <p className="text-xs text-content-3">Total Requests</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-content">
              {stats.totalRequests?.toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-edge bg-card p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              <p className="text-xs text-content-3">Total Tokens</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-content">
              {stats.totalTokens?.toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-edge bg-card p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <p className="text-xs text-content-3">Total Cost</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-content">
              ${(stats.totalCostMills / 1000).toFixed(2)}
            </p>
          </div>
          <div className="rounded-xl border border-edge bg-card p-4">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-400" />
              <p className="text-xs text-content-3">Avg Cost/Request</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-content">
              $
              {stats.totalRequests
                ? (stats.totalCostMills / 1000 / stats.totalRequests).toFixed(4)
                : "0.00"}
            </p>
          </div>
        </div>
      )}

      {/* By Tool */}
      {stats?.byTool && (
        <div className="rounded-2xl border border-edge bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold text-content">
            Usage by Tool
          </h2>
          <div className="space-y-3">
            {Object.entries(stats.byTool || {}).map(
              ([tool, data]: [string, any]) => (
                <div
                  key={tool}
                  className="flex items-center justify-between rounded-xl bg-card px-4 py-3"
                >
                  <span className="text-sm font-medium capitalize text-content-2">
                    {tool.replace(/_/g, " ")}
                  </span>
                  <div className="flex items-center gap-6">
                    <span className="text-xs text-content-3">
                      {data.count} requests
                    </span>
                    <span className="text-xs text-content-3">
                      {data.tokens?.toLocaleString()} tokens
                    </span>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      )}

      {/* Recent usage table */}
      <div className="overflow-hidden rounded-2xl border border-edge">
        <div className="border-b border-edge bg-card px-4 py-3">
          <h2 className="text-sm font-semibold text-content">
            Recent AI Calls
          </h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-edge">
              <th className="px-4 py-2 text-left text-xs font-medium text-content-3">
                Tool
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-content-3">
                Tokens
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-content-3">
                Cost
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-content-3">
                Latency
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-content-3">
                Status
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-content-3">
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {(Array.isArray(usage) ? usage : []).slice(0, 30).map((u: any) => (
              <tr
                key={u._id}
                className="border-b border-edge hover:bg-card-hover"
              >
                <td className="px-4 py-2 text-sm capitalize text-content-2">
                  {u.toolType?.replace(/_/g, " ")}
                </td>
                <td className="px-4 py-2 text-sm text-content-2">
                  {u.totalTokens?.toLocaleString()}
                </td>
                <td className="px-4 py-2 text-sm text-content-2">
                  ${((u.estimatedCostMills || 0) / 1000).toFixed(4)}
                </td>
                <td className="px-4 py-2 text-sm text-content-2">
                  {u.latencyMs ? `${u.latencyMs}ms` : "—"}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`text-xs ${u.success ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {u.success ? "✓" : "✗"}
                  </span>
                </td>
                <td className="px-4 py-2 text-xs text-content-4">
                  {new Date(u.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
