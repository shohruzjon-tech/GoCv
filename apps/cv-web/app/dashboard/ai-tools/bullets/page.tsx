"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { aiApi } from "@/lib/api";
import { AiBulletResult } from "@/types";
import toast from "react-hot-toast";
import {
  ListChecks,
  ArrowLeft,
  Loader2,
  Plus,
  X,
  ArrowRight,
} from "lucide-react";

export default function BulletsPage() {
  const router = useRouter();
  const [bullets, setBullets] = useState<string[]>([""]);
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiBulletResult | null>(null);

  const addBullet = () => setBullets([...bullets, ""]);
  const removeBullet = (i: number) =>
    setBullets(bullets.filter((_, idx) => idx !== i));
  const updateBullet = (i: number, v: string) => {
    const updated = [...bullets];
    updated[i] = v;
    setBullets(updated);
  };

  const handleImprove = async () => {
    const filtered = bullets.filter((b) => b.trim());
    if (filtered.length === 0)
      return toast.error("Add at least one bullet point");
    setLoading(true);
    setResult(null);
    try {
      const res = await aiApi.improveBullets(filtered, context);
      setResult(res.data);
      toast.success("Bullets improved!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="rounded-xl p-2 text-zinc-500 hover:bg-white/[0.04] hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">
            <span className="text-gradient">Bullet Improver</span>
          </h1>
          <p className="text-sm text-zinc-400">
            Transform weak bullets into powerful achievement statements
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-4">
        <label className="block text-sm font-medium text-zinc-300">
          Your bullet points
        </label>
        {bullets.map((b, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={b}
              onChange={(e) => updateBullet(i, e.target.value)}
              placeholder={`Bullet point ${i + 1}...`}
              className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-indigo-500/50"
            />
            {bullets.length > 1 && (
              <button
                onClick={() => removeBullet(i)}
                className="rounded-xl p-2 text-zinc-600 hover:text-red-400"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={addBullet}
          className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300"
        >
          <Plus className="h-4 w-4" /> Add bullet
        </button>

        <label className="block text-sm font-medium text-zinc-300">
          Context (optional)
        </label>
        <input
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="e.g. Software Engineer at Google"
          className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-indigo-500/50"
        />

        <button
          onClick={handleImprove}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ListChecks className="h-4 w-4" />
          )}
          {loading ? "Improving..." : "Improve Bullets"}
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Improved Bullets</h3>
          {result.improved?.map((imp, i) => (
            <div
              key={i}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
            >
              <p className="text-xs text-zinc-600 line-through">
                {result.original?.[i]}
              </p>
              <div className="mt-2 flex items-start gap-2">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <p className="text-sm text-emerald-300">{imp}</p>
              </div>
            </div>
          ))}
          {result.tips && result.tips.length > 0 && (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="mb-2 text-sm font-medium text-white">Tips</p>
              {result.tips.map((tip, i) => (
                <p key={i} className="text-xs text-zinc-400">
                  • {tip}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
