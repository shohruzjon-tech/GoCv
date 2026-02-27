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
        <h1 className="text-2xl font-bold text-white">AI Usage Analytics</h1>
        <p className="text-sm text-zinc-500">Monitor AI tool usage and costs</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-cyan-400" />
              <p className="text-xs text-zinc-500">Total Requests</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-white">
              {stats.totalRequests?.toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              <p className="text-xs text-zinc-500">Total Tokens</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-white">
              {stats.totalTokens?.toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <p className="text-xs text-zinc-500">Total Cost</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-white">
              ${(stats.totalCostMills / 1000).toFixed(2)}
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-400" />
              <p className="text-xs text-zinc-500">Avg Cost/Request</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-white">
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
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <h2 className="mb-4 text-sm font-semibold text-white">
            Usage by Tool
          </h2>
          <div className="space-y-3">
            {Object.entries(stats.byTool || {}).map(
              ([tool, data]: [string, any]) => (
                <div
                  key={tool}
                  className="flex items-center justify-between rounded-xl bg-white/[0.02] px-4 py-3"
                >
                  <span className="text-sm font-medium capitalize text-zinc-300">
                    {tool.replace(/_/g, " ")}
                  </span>
                  <div className="flex items-center gap-6">
                    <span className="text-xs text-zinc-500">
                      {data.count} requests
                    </span>
                    <span className="text-xs text-zinc-500">
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
      <div className="overflow-hidden rounded-2xl border border-white/[0.06]">
        <div className="border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
          <h2 className="text-sm font-semibold text-white">Recent AI Calls</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500">
                Tool
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500">
                Tokens
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500">
                Cost
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500">
                Latency
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500">
                Status
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500">
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {(Array.isArray(usage) ? usage : []).slice(0, 30).map((u: any) => (
              <tr
                key={u._id}
                className="border-b border-white/[0.04] hover:bg-white/[0.02]"
              >
                <td className="px-4 py-2 text-sm capitalize text-zinc-300">
                  {u.toolType?.replace(/_/g, " ")}
                </td>
                <td className="px-4 py-2 text-sm text-zinc-400">
                  {u.totalTokens?.toLocaleString()}
                </td>
                <td className="px-4 py-2 text-sm text-zinc-400">
                  ${((u.estimatedCostMills || 0) / 1000).toFixed(4)}
                </td>
                <td className="px-4 py-2 text-sm text-zinc-400">
                  {u.latencyMs ? `${u.latencyMs}ms` : "—"}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`text-xs ${u.success ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {u.success ? "✓" : "✗"}
                  </span>
                </td>
                <td className="px-4 py-2 text-xs text-zinc-600">
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
