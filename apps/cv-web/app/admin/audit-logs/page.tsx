"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import toast from "react-hot-toast";
import { ScrollText, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState("");
  const limit = 20;

  useEffect(() => {
    load();
  }, [page, actionFilter]);

  const load = async () => {
    setLoading(true);
    try {
      const filters: Record<string, string> = {};
      if (actionFilter) filters.action = actionFilter;
      const res = await adminApi.getAuditLogs(page, limit, filters);
      setLogs(res.data.logs || res.data);
      setTotal(res.data.total || 0);
    } catch {
      toast.error("Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const actionColors: Record<string, string> = {
    CREATE: "text-emerald-400 bg-emerald-400/10",
    UPDATE: "text-blue-400 bg-blue-400/10",
    DELETE: "text-red-400 bg-red-400/10",
    LOGIN: "text-indigo-400 bg-indigo-400/10",
    EXPORT: "text-amber-400 bg-amber-400/10",
  };

  const getColor = (action: string) => {
    const key = Object.keys(actionColors).find((k) =>
      action?.toUpperCase().includes(k),
    );
    return key ? actionColors[key] : "text-zinc-400 bg-zinc-400/10";
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
        <p className="text-sm text-zinc-500">Track all system activity</p>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="text"
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          placeholder="Filter by action..."
          className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-indigo-500/50"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/[0.06]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] bg-white/[0.02]">
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">
                Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">
                Action
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">
                Resource
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">
                IP
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {logs.map((log: any, i: number) => (
              <tr key={log._id || i} className="hover:bg-white/[0.02]">
                <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-500">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${getColor(log.action)}`}
                  >
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-400">
                  {log.resource || "—"}
                </td>
                <td className="px-4 py-3 text-xs text-zinc-400">
                  {log.userId || "System"}
                </td>
                <td className="px-4 py-3 text-xs text-zinc-600">
                  {log.ip || "—"}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-sm text-zinc-600"
                >
                  No audit logs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-600">{total} total entries</p>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="rounded-lg border border-white/[0.06] p-1.5 text-zinc-500 hover:text-white disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs text-zinc-500">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="rounded-lg border border-white/[0.06] p-1.5 text-zinc-500 hover:text-white disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
