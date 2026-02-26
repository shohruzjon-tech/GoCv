"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { DashboardStats } from "@/types";
import { Users, FileText, Key } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await adminApi.getDashboard();
      setStats(res.data);
    } catch {
      toast.error("Failed to load stats");
    } finally {
      setLoading(false);
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
      <h1 className="mb-8 text-3xl font-bold text-zinc-900 dark:text-white">
        Admin Dashboard
      </h1>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-zinc-500">Total Users</p>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white">
                {stats?.totalUsers || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-zinc-500">Total CVs</p>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white">
                {stats?.totalCvs || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
              <Key className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-zinc-500">Active Sessions</p>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white">
                {stats?.totalSessions || 0}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
