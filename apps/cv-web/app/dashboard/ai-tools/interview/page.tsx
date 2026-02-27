"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cvApi, aiApi } from "@/lib/api";
import { Cv, AiInterviewResult } from "@/types";
import toast from "react-hot-toast";
import {
  MessageSquare,
  ArrowLeft,
  Loader2,
  Lightbulb,
  Target,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Select from "@/components/ui/select";

export default function InterviewPage() {
  const router = useRouter();
  const [cvs, setCvs] = useState<Cv[]>([]);
  const [selectedCv, setSelectedCv] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiInterviewResult | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    cvApi
      .getAll()
      .then((r) => setCvs(r.data))
      .catch(() => {});
  }, []);

  const handlePrep = async () => {
    if (!selectedCv || !jobDescription.trim())
      return toast.error("Fill all fields");
    setLoading(true);
    setResult(null);
    try {
      const cv = cvs.find((c) => c._id === selectedCv);
      const res = await aiApi.interviewPrep(
        {
          sections: cv?.sections,
          personalInfo: cv?.personalInfo,
          summary: cv?.summary,
        },
        jobDescription,
      );
      setResult(res.data);
      toast.success("Interview prep ready!");
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
            <span className="text-gradient">Interview Prep</span>
          </h1>
          <p className="text-sm text-content-2">
            AI-generated interview questions & preparation tips
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
            Job Description
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={4}
            placeholder="Paste the job description..."
            className="w-full rounded-xl border border-edge bg-card px-4 py-3 text-sm text-content placeholder-content-3 outline-none focus:border-indigo-500/50"
          />
        </div>
      </div>

      <button
        onClick={handlePrep}
        disabled={loading || !selectedCv || !jobDescription.trim()}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MessageSquare className="h-4 w-4" />
        )}
        {loading ? "Preparing..." : "Generate Prep"}
      </button>

      {result && (
        <div className="space-y-6">
          {/* Focus Areas */}
          {result.focusAreas && result.focusAreas.length > 0 && (
            <div className="rounded-xl border border-edge bg-card p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-content">
                <Target className="h-4 w-4 text-cyan-400" /> Focus Areas
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.focusAreas.map((area) => (
                  <span
                    key={area}
                    className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-400 ring-1 ring-cyan-500/20"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Questions */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-content">
              Practice Questions
            </h3>
            {result.questions?.map((q, i) => (
              <div
                key={i}
                className="rounded-xl border border-edge bg-card overflow-hidden"
              >
                <button
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  className="flex w-full items-center justify-between p-4 text-left"
                >
                  <span className="text-sm font-medium text-content">
                    {i + 1}. {q.question}
                  </span>
                  {expanded === i ? (
                    <ChevronUp className="h-4 w-4 text-content-3" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-content-3" />
                  )}
                </button>
                {expanded === i && (
                  <div className="border-t border-edge px-4 py-3 space-y-3">
                    <div>
                      <p className="text-xs font-medium text-amber-400">
                        💡 Tip
                      </p>
                      <p className="mt-1 text-sm text-content-2">{q.tip}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-emerald-400">
                        Sample Answer
                      </p>
                      <p className="mt-1 text-sm text-content-2">
                        {q.sampleAnswer}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Tips */}
          {result.preparationTips && result.preparationTips.length > 0 && (
            <div className="rounded-xl border border-edge bg-card p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-content">
                <Lightbulb className="h-4 w-4 text-amber-400" /> Preparation
                Tips
              </h3>
              {result.preparationTips.map((tip, i) => (
                <p key={i} className="mt-2 text-sm text-content-2">
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
