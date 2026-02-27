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
    return key ? actionColors[key] : "text-content-2 bg-zinc-400/10";
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
        <h1 className="text-2xl font-bold text-content">Audit Logs</h1>
        <p className="text-sm text-content-3">Track all system activity</p>
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
          className="rounded-xl border border-edge bg-card px-4 py-2 text-sm text-content placeholder-content-3 outline-none focus:border-indigo-500/50"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-edge">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-edge bg-card">
              <th className="px-4 py-3 text-left text-xs font-medium text-content-3">
                Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-content-3">
                Action
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-content-3">
                Resource
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-content-3">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-content-3">
                IP
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-edge">
            {logs.map((log: any, i: number) => (
              <tr key={log._id || i} className="hover:bg-card-hover">
                <td className="whitespace-nowrap px-4 py-3 text-xs text-content-3">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${getColor(log.action)}`}
                  >
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-content-2">
                  {log.resource || "—"}
                </td>
                <td className="px-4 py-3 text-xs text-content-2">
                  {log.userId || "System"}
                </td>
                <td className="px-4 py-3 text-xs text-content-4">
                  {log.ip || "—"}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-sm text-content-4"
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
          <p className="text-xs text-content-4">{total} total entries</p>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="rounded-lg border border-edge p-1.5 text-content-3 hover:text-content disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs text-content-3">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="rounded-lg border border-edge p-1.5 text-content-3 hover:text-content disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
