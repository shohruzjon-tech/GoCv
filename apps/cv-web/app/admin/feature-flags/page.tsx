"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import toast from "react-hot-toast";
import {
  Flag,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Plus,
} from "lucide-react";

export default function AdminFeatureFlagsPage() {
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getFeatureFlags();
      setFlags(res.data);
    } catch {
      toast.error("Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await adminApi.toggleFeatureFlag(id);
      toast.success("Toggled");
      load();
    } catch {
      toast.error("Failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this flag?")) return;
    try {
      await adminApi.deleteFeatureFlag(id);
      toast.success("Deleted");
      load();
    } catch {
      toast.error("Failed");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content">Feature Flags</h1>
          <p className="text-sm text-content-3">Control feature availability</p>
        </div>
      </div>

      <div className="space-y-3">
        {flags.map((flag: any) => (
          <div
            key={flag._id}
            className="flex items-center justify-between rounded-2xl border border-edge bg-card p-5"
          >
            <div className="flex items-start gap-4">
              <button onClick={() => handleToggle(flag._id)} className="mt-0.5">
                {flag.enabled ? (
                  <ToggleRight className="h-6 w-6 text-emerald-400" />
                ) : (
                  <ToggleLeft className="h-6 w-6 text-content-4" />
                )}
              </button>
              <div>
                <p className="text-sm font-semibold text-content">
                  {flag.name}
                </p>
                <p className="mt-0.5 text-xs text-content-3">
                  {flag.description || flag.key}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-[10px] text-content-4">
                    Key: {flag.key}
                  </span>
                  <span className="text-[10px] text-content-4">
                    Rollout: {flag.rolloutPercentage}%
                  </span>
                  {flag.allowedPlans?.length > 0 && (
                    <span className="text-[10px] text-content-4">
                      Plans: {flag.allowedPlans.join(", ")}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => handleDelete(flag._id)}
              className="rounded-lg p-2 text-content-4 hover:bg-red-500/10 hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
