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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-content">Sessions ({total})</h1>
        <p className="text-sm text-content-3">
          Monitor and manage user sessions
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-edge bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-edge bg-card">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-content-3">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-content-3">
                User Agent
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-content-3">
                IP Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-content-3">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-content-3">
                Last Activity
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase text-content-3">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-edge">
            {sessions.map((session) => (
              <tr key={session._id} className="hover:bg-card-hover">
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-content">
                    {typeof session.userId === "object"
                      ? session.userId.name
                      : session.userId}
                  </p>
                  <p className="text-xs text-content-3">
                    {typeof session.userId === "object"
                      ? session.userId.email
                      : ""}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <p className="max-w-[200px] truncate text-xs text-content-3">
                    {session.userAgent || "N/A"}
                  </p>
                </td>
                <td className="px-6 py-4 text-sm text-content-2">
                  {session.ipAddress || "N/A"}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      session.isActive
                        ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                        : "bg-card text-content-3 ring-1 ring-edge"
                    }`}
                  >
                    {session.isActive ? "Active" : "Expired"}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-content-3">
                  {session.lastActivityAt
                    ? new Date(session.lastActivityAt).toLocaleString()
                    : "N/A"}
                </td>
                <td className="px-6 py-4 text-right">
                  {session.isActive && (
                    <button
                      onClick={() => terminateSession(session._id)}
                      className="rounded-lg p-2 text-content-3 transition hover:bg-red-500/10 hover:text-red-400"
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
            className="rounded-lg border border-edge px-4 py-2 text-sm text-content-2 hover:bg-card-hover disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-content-3">
            Page {page} of {Math.ceil(total / 20)}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page * 20 >= total}
            className="rounded-lg border border-edge px-4 py-2 text-sm text-content-2 hover:bg-card-hover disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
