"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { Session } from "@/types";
import { Trash2, XCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, [page]);

  const loadSessions = async () => {
    try {
      const res = await adminApi.getSessions(page, 20);
      setSessions(res.data.sessions);
      setTotal(res.data.total);
    } catch {
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const terminateSession = async (id: string) => {
    try {
      await adminApi.terminateSession(id);
      setSessions((prev) =>
        prev.map((s) => (s._id === id ? { ...s, isActive: false } : s)),
      );
      toast.success("Session terminated");
    } catch {
      toast.error("Failed to terminate session");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Sessions ({total})
        </h1>
        <p className="text-sm text-zinc-500">
          Monitor and manage user sessions
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                User Agent
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                IP Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                Last Activity
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase text-zinc-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {sessions.map((session) => (
              <tr
                key={session._id}
                className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
              >
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">
                    {typeof session.userId === "object"
                      ? session.userId.name
                      : session.userId}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {typeof session.userId === "object"
                      ? session.userId.email
                      : ""}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <p className="max-w-[200px] truncate text-xs text-zinc-500">
                    {session.userAgent || "N/A"}
                  </p>
                </td>
                <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                  {session.ipAddress || "N/A"}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      session.isActive
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500"
                    }`}
                  >
                    {session.isActive ? "Active" : "Expired"}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-zinc-500">
                  {session.lastActivityAt
                    ? new Date(session.lastActivityAt).toLocaleString()
                    : "N/A"}
                </td>
                <td className="px-6 py-4 text-right">
                  {session.isActive && (
                    <button
                      onClick={() => terminateSession(session._id)}
                      className="rounded-lg p-2 text-zinc-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                      title="Terminate session"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > 20 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm disabled:opacity-50 dark:border-zinc-700"
          >
            Previous
          </button>
          <span className="text-sm text-zinc-500">
            Page {page} of {Math.ceil(total / 20)}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page * 20 >= total}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm disabled:opacity-50 dark:border-zinc-700"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
