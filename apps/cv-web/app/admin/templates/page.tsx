"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import toast from "react-hot-toast";
import {
  Palette,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [page]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getTemplates(page, 20);
      setTemplates(res.data.templates || res.data);
      setTotal(res.data.total || 0);
    } catch {
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    try {
      await adminApi.deleteTemplate(id);
      toast.success("Template deleted");
      load();
    } catch {
      toast.error("Failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Templates</h1>
          <p className="text-sm text-zinc-500">{total} total templates</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/[0.06]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">
                  Tier
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400">
                  Uses
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t: any) => (
                <tr
                  key={t._id}
                  className="border-b border-white/[0.04] hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-3 text-sm font-medium text-white">
                    {t.name}
                  </td>
                  <td className="px-4 py-3 text-sm capitalize text-zinc-400">
                    {t.category}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        t.status === "active"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : t.status === "draft"
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-zinc-500/10 text-zinc-400"
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400">
                    {t.isEnterprise
                      ? "Enterprise"
                      : t.isPremium
                        ? "Premium"
                        : "Free"}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400">
                    {t.usageCount || 0}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(t._id)}
                      className="rounded-lg p-1.5 text-zinc-600 hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
