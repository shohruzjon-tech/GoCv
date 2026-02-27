"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cvApi, aiApi } from "@/lib/api";
import { Cv, AiSkillGapResult } from "@/types";
import toast from "react-hot-toast";
import {
  Search,
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  BookOpen,
} from "lucide-react";
import Select from "@/components/ui/select";

export default function SkillGapPage() {
  const router = useRouter();
  const [cvs, setCvs] = useState<Cv[]>([]);
  const [selectedCv, setSelectedCv] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiSkillGapResult | null>(null);

  useEffect(() => {
    cvApi
      .getAll()
      .then((r) => setCvs(r.data))
      .catch(() => {});
  }, []);

  const handleAnalyze = async () => {
    if (!selectedCv || !targetRole.trim())
      return toast.error("Fill all fields");
    setLoading(true);
    setResult(null);
    try {
      const cv = cvs.find((c) => c._id === selectedCv);
      const res = await aiApi.skillGap(
        {
          sections: cv?.sections,
          personalInfo: cv?.personalInfo,
          summary: cv?.summary,
        },
        targetRole,
      );
      setResult(res.data);
      toast.success("Analysis complete!");
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
          className="rounded-xl p-2 text-content-3 hover:bg-card-hover hover:text-content"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-content">
            <span className="text-gradient">Skill Gap Analysis</span>
          </h1>
          <p className="text-sm text-content-2">
            Identify missing skills for your target role
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-edge bg-card p-6">
          <label className="mb-2 block text-sm font-medium text-content-2">
            Select a CV
          </label>
          <Select
            value={selectedCv}
            onChange={setSelectedCv}
            placeholder="Choose..."
            options={[
              { value: "", label: "Choose..." },
              ...cvs.map((cv) => ({ value: cv._id, label: cv.title })),
            ]}
            searchable={cvs.length > 5}
          />
        </div>
        <div className="rounded-2xl border border-edge bg-card p-6">
          <label className="mb-2 block text-sm font-medium text-content-2">
            Target Role
          </label>
          <input
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g. Senior Product Manager"
            className="w-full rounded-xl border border-edge bg-card px-4 py-3 text-sm text-content placeholder-content-3 outline-none focus:border-indigo-500/50"
          />
        </div>
      </div>

      <button
        onClick={handleAnalyze}
        disabled={loading || !selectedCv || !targetRole.trim()}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Search className="h-4 w-4" />
        )}
        {loading ? "Analyzing..." : "Analyze Skills"}
      </button>

      {result && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 rounded-2xl border border-pink-500/20 bg-pink-500/5 p-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-pink-500/20">
              <span className="text-xl font-bold text-pink-300">
                {result.matchPercentage}%
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-pink-300">
                Skill Match Score
              </p>
              <p className="text-xs text-pink-400/70">
                {result.missingSkills?.length || 0} skills to develop
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-edge bg-card p-4">
              <h3 className="mb-3 text-sm font-semibold text-emerald-400">
                ✓ Current Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.currentSkills?.map((s) => (
                  <span
                    key={s}
                    className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400 ring-1 ring-emerald-500/20"
                  >
                    <CheckCircle className="h-3 w-3" /> {s}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-edge bg-card p-4">
              <h3 className="mb-3 text-sm font-semibold text-red-400">
                ✗ Missing Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.missingSkills?.map((s) => (
                  <span
                    key={s}
                    className="flex items-center gap-1 rounded-full bg-red-500/10 px-3 py-1 text-xs text-red-400 ring-1 ring-red-500/20"
                  >
                    <XCircle className="h-3 w-3" /> {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {result.recommendations && result.recommendations.length > 0 && (
            <div className="rounded-xl border border-edge bg-card p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-content">
                <BookOpen className="h-4 w-4 text-indigo-400" /> Recommendations
              </h3>
              {result.recommendations.map((rec, i) => (
                <p key={i} className="mt-2 text-sm text-content-2">
                  • {rec}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
