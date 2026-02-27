"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cvApi, aiApi } from "@/lib/api";
import { Cv, AiTailorResult } from "@/types";
import toast from "react-hot-toast";
import {
  Target,
  ArrowLeft,
  Loader2,
  CheckCircle,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import Select from "@/components/ui/select";

export default function TailorPage() {
  const router = useRouter();
  const [cvs, setCvs] = useState<Cv[]>([]);
  const [selectedCv, setSelectedCv] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiTailorResult | null>(null);

  useEffect(() => {
    cvApi
      .getAll()
      .then((r) => setCvs(r.data))
      .catch(() => {});
  }, []);

  const handleTailor = async () => {
    if (!selectedCv) return toast.error("Please select a CV");
    if (!jobDescription.trim())
      return toast.error("Please enter a job description");
    setLoading(true);
    setResult(null);
    try {
      const cv = cvs.find((c) => c._id === selectedCv);
      const res = await aiApi.tailor(
        {
          sections: cv?.sections,
          personalInfo: cv?.personalInfo,
          summary: cv?.summary,
        },
        jobDescription,
      );
      setResult(res.data);
      toast.success("CV tailored successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Tailoring failed");
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
            <span className="text-gradient">Job Tailor</span>
          </h1>
          <p className="text-sm text-content-2">
            Tailor your CV for a specific job posting
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
            placeholder="Choose a CV..."
            options={[
              { value: "", label: "Choose a CV..." },
              ...cvs.map((cv) => ({ value: cv._id, label: cv.title })),
            ]}
            searchable={cvs.length > 5}
          />
        </div>

        <div className="rounded-2xl border border-edge bg-card p-6">
          <label className="mb-2 block text-sm font-medium text-content-2">
            Job Description
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={6}
            placeholder="Paste the job description here..."
            className="w-full rounded-xl border border-edge bg-card px-4 py-3 text-sm text-content placeholder-content-3 outline-none focus:border-indigo-500/50"
          />
        </div>
      </div>

      <button
        onClick={handleTailor}
        disabled={loading || !selectedCv || !jobDescription.trim()}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Target className="h-4 w-4" />
        )}
        {loading ? "Tailoring..." : "Tailor CV"}
      </button>

      {result && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
            <TrendingUp className="h-5 w-5 text-blue-400" />
            <div>
              <p className="text-sm font-semibold text-blue-300">
                Match Score: {result.matchScore}%
              </p>
              <p className="text-xs text-blue-400/70">
                {result.keywordsAdded?.length || 0} keywords added
              </p>
            </div>
          </div>
          {result.suggestions?.map((sug, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-xl border border-edge bg-card p-4"
            >
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
              <p className="text-sm text-content-2">{sug}</p>
            </div>
          ))}
          {result.keywordsAdded && result.keywordsAdded.length > 0 && (
            <div className="rounded-xl border border-edge bg-card p-4">
              <p className="mb-2 text-sm font-medium text-content">
                Keywords Added
              </p>
              <div className="flex flex-wrap gap-2">
                {result.keywordsAdded.map((kw) => (
                  <span
                    key={kw}
                    className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400 ring-1 ring-blue-500/20"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
