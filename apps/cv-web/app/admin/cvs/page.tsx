"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { Cv } from "@/types";
import { Globe, FileText } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminCvsPage() {
  const [cvs, setCvs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCvs();
  }, [page]);

  const loadCvs = async () => {
    try {
      const res = await adminApi.getAllCvs(page, 20);
      setCvs(res.data.cvs);
      setTotal(res.data.total);
    } catch {
      toast.error("Failed to load CVs");
    } finally {
      setLoading(false);
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
        <h1 className="text-2xl font-bold text-white">All CVs ({total})</h1>
        <p className="text-sm text-zinc-500">Overview of all user CVs</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06] bg-white/[0.03]">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                Owner
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                Public
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {cvs.map((cv) => (
              <tr key={cv._id} className="hover:bg-white/[0.02]">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-zinc-400" />
                    <span className="text-sm font-medium text-white">
                      {cv.title}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-zinc-400">
                  {cv.userId?.name || cv.userId?.email || "Unknown"}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      cv.status === "published"
                        ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                        : cv.status === "draft"
                          ? "bg-yellow-500/10 text-yellow-400 ring-1 ring-yellow-500/20"
                          : "bg-white/5 text-zinc-500 ring-1 ring-white/10"
                    }`}
                  >
                    {cv.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {cv.isPublic ? (
                    <Globe className="h-4 w-4 text-green-500" />
                  ) : (
                    <span className="text-xs text-zinc-400">Private</span>
                  )}
                </td>
                <td className="px-6 py-4 text-xs text-zinc-500">
                  {new Date(cv.createdAt).toLocaleDateString()}
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
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/[0.04] disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-zinc-500">
            Page {page} of {Math.ceil(total / 20)}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page * 20 >= total}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/[0.04] disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
