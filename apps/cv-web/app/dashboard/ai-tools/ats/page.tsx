"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cvApi, aiApi } from "@/lib/api";
import { Cv, AiAtsResult } from "@/types";
import toast from "react-hot-toast";
import {
  BarChart3,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Select from "@/components/ui/select";

export default function AtsPage() {
  const router = useRouter();
  const [cvs, setCvs] = useState<Cv[]>([]);
  const [selectedCv, setSelectedCv] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiAtsResult | null>(null);

  useEffect(() => {
    cvApi
      .getAll()
      .then((r) => setCvs(r.data))
      .catch(() => {});
  }, []);

  const handleAnalyze = async () => {
    if (!selectedCv) return toast.error("Select a CV");
    setLoading(true);
    setResult(null);
    try {
      const cv = cvs.find((c) => c._id === selectedCv);
      const res = await aiApi.atsScore(
        {
          sections: cv?.sections,
          personalInfo: cv?.personalInfo,
          summary: cv?.summary,
        },
        jobDescription || undefined,
      );
      setResult(res.data);
      toast.success("ATS analysis complete!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (score: number) =>
    score >= 80
      ? "text-emerald-400"
      : score >= 60
        ? "text-amber-400"
        : "text-red-400";
  const scoreBg = (score: number) =>
    score >= 80
      ? "bg-emerald-500"
      : score >= 60
        ? "bg-amber-500"
        : "bg-red-500";

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
            <span className="text-gradient">ATS Score Checker</span>
          </h1>
          <p className="text-sm text-content-2">
            Check your CV&apos;s ATS compatibility
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
            Job Description (optional)
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={4}
            placeholder="Paste job description for keyword matching..."
            className="w-full rounded-xl border border-edge bg-card px-4 py-3 text-sm text-content placeholder-content-3 outline-none focus:border-indigo-500/50"
          />
        </div>
      </div>

      <button
        onClick={handleAnalyze}
        disabled={loading || !selectedCv}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <BarChart3 className="h-4 w-4" />
        )}
        {loading ? "Analyzing..." : "Check ATS Score"}
      </button>

      {result && (
        <div className="space-y-6">
          {/* Score */}
          <div className="flex items-center gap-6 rounded-2xl border border-edge bg-card p-6">
            <div className="relative flex h-24 w-24 items-center justify-center">
              <svg className="h-24 w-24 -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="6"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  className={scoreColor(result.score)}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${(result.score / 100) * 251.2} 251.2`}
                />
              </svg>
              <span
                className={`absolute text-2xl font-bold ${scoreColor(result.score)}`}
              >
                {result.score}
              </span>
            </div>
            <div>
              <p className={`text-lg font-bold ${scoreColor(result.score)}`}>
                {result.score >= 80
                  ? "Excellent"
                  : result.score >= 60
                    ? "Good"
                    : "Needs Work"}
              </p>
              <p className="mt-1 text-sm text-content-2">{result.overall}</p>
              {result.formatting && (
                <p className="mt-1 text-xs text-content-3">
                  Formatting Score: {result.formatting.score}/100
                </p>
              )}
            </div>
          </div>

          {/* Issues */}
          {result.issues && result.issues.length > 0 && (
            <div className="rounded-xl border border-edge bg-card p-4 space-y-3">
              <h3 className="text-sm font-semibold text-content">
                Issues Found
              </h3>
              {result.issues.map((issue, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg bg-card p-3"
                >
                  <AlertTriangle
                    className={`mt-0.5 h-4 w-4 shrink-0 ${
                      issue.severity === "high"
                        ? "text-red-400"
                        : issue.severity === "medium"
                          ? "text-amber-400"
                          : "text-blue-400"
                    }`}
                  />
                  <div>
                    <p className="text-sm text-content-2">{issue.message}</p>
                    <p className="mt-1 text-xs text-content-3">
                      {issue.suggestion}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Keywords */}
          {result.keywords && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-edge bg-card p-4">
                <h3 className="mb-3 text-sm font-semibold text-emerald-400">
                  Keywords Found
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.keywords.found?.map((kw) => (
                    <span
                      key={kw}
                      className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-400"
                    >
                      <CheckCircle className="h-3 w-3" /> {kw}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-edge bg-card p-4">
                <h3 className="mb-3 text-sm font-semibold text-red-400">
                  Keywords Missing
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.keywords.missing?.map((kw) => (
                    <span
                      key={kw}
                      className="flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-1 text-xs text-red-400"
                    >
                      <XCircle className="h-3 w-3" /> {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
