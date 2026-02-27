"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cvApi, aiApi } from "@/lib/api";
import { Cv, AiEnhanceResult } from "@/types";
import toast from "react-hot-toast";
import {
  Wand2,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileText,
  TrendingUp,
} from "lucide-react";

export default function EnhancePage() {
  const router = useRouter();
  const [cvs, setCvs] = useState<Cv[]>([]);
  const [selectedCv, setSelectedCv] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiEnhanceResult | null>(null);

  useEffect(() => {
    cvApi
      .getAll()
      .then((r) => setCvs(r.data))
      .catch(() => {});
  }, []);

  const handleEnhance = async () => {
    if (!selectedCv) return toast.error("Please select a CV");
    setLoading(true);
    setResult(null);
    try {
      const cv = cvs.find((c) => c._id === selectedCv);
      const res = await aiApi.enhance({
        sections: cv?.sections,
        personalInfo: cv?.personalInfo,
        summary: cv?.summary,
      });
      setResult(res.data);
      toast.success("CV enhanced successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Enhancement failed");
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
            <span className="text-gradient">CV Enhancer</span>
          </h1>
          <p className="text-sm text-content-2">
            AI-powered CV improvement suggestions
          </p>
        </div>
      </div>

      {/* CV Selector */}
      <div className="rounded-2xl border border-edge bg-card p-6">
        <label className="mb-2 block text-sm font-medium text-content-2">
          Select a CV to enhance
        </label>
        <select
          value={selectedCv}
          onChange={(e) => setSelectedCv(e.target.value)}
          className="w-full rounded-xl border border-edge bg-card px-4 py-3 text-sm text-content outline-none focus:border-indigo-500/50"
        >
          <option value="">Choose a CV...</option>
          {cvs.map((cv) => (
            <option key={cv._id} value={cv._id} className="bg-elevated">
              {cv.title}
            </option>
          ))}
        </select>

        <button
          onClick={handleEnhance}
          disabled={loading || !selectedCv}
          className="mt-4 flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:shadow-indigo-500/40 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="h-4 w-4" />
          )}
          {loading ? "Enhancing..." : "Enhance CV"}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            <div>
              <p className="text-sm font-semibold text-emerald-300">
                Overall Score: {result.overallScore}/100
              </p>
              <p className="text-xs text-emerald-400/70">
                {result.improvements?.length || 0} improvements found
              </p>
            </div>
          </div>

          {result.improvements?.map((imp, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-xl border border-edge bg-card p-4"
            >
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
              <p className="text-sm text-content-2">{imp}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
