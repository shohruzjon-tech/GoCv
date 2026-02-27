"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cvApi, aiApi } from "@/lib/api";
import { Cv, AiSummaryResult } from "@/types";
import toast from "react-hot-toast";
import { FileText, ArrowLeft, Loader2, Copy, Check } from "lucide-react";
import Select from "@/components/ui/select";

const tones = [
  {
    value: "professional",
    label: "Professional",
    desc: "Formal, polished tone",
  },
  { value: "creative", label: "Creative", desc: "Unique, personality-driven" },
  { value: "technical", label: "Technical", desc: "Skills & tech focused" },
  { value: "executive", label: "Executive", desc: "Leadership & strategy" },
];

export default function SummaryPage() {
  const router = useRouter();
  const [cvs, setCvs] = useState<Cv[]>([]);
  const [selectedCv, setSelectedCv] = useState("");
  const [tone, setTone] = useState("professional");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiSummaryResult | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

  useEffect(() => {
    cvApi
      .getAll()
      .then((r) => setCvs(r.data))
      .catch(() => {});
  }, []);

  const handleGenerate = async () => {
    if (!selectedCv) return toast.error("Select a CV");
    setLoading(true);
    setResult(null);
    try {
      const cv = cvs.find((c) => c._id === selectedCv);
      const res = await aiApi.generateSummary(
        { sections: cv?.sections, personalInfo: cv?.personalInfo },
        tone,
      );
      setResult(res.data);
      toast.success("Summary generated!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
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
            <span className="text-gradient">Summary Generator</span>
          </h1>
          <p className="text-sm text-content-2">
            Generate compelling professional summaries
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-edge bg-card p-6 space-y-6">
        <div>
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

        <div>
          <label className="mb-2 block text-sm font-medium text-content-2">
            Tone
          </label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {tones.map((t) => (
              <button
                key={t.value}
                onClick={() => setTone(t.value)}
                className={`rounded-xl border p-3 text-left transition ${
                  tone === t.value
                    ? "border-amber-500/30 bg-amber-500/5"
                    : "border-edge bg-card hover:bg-card-hover"
                }`}
              >
                <p
                  className={`text-sm font-medium ${tone === t.value ? "text-amber-300" : "text-content"}`}
                >
                  {t.label}
                </p>
                <p className="text-xs text-content-3">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !selectedCv}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          {loading ? "Generating..." : "Generate Summary"}
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-amber-300">
                  Primary Summary
                </p>
                <p className="text-xs text-amber-400/60">
                  {result.wordCount} words
                </p>
              </div>
              <button
                onClick={() => copyText(result.summary, -1)}
                className="rounded-lg p-1.5 text-amber-400 hover:bg-amber-500/10"
              >
                {copied === -1 ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-content">
              {result.summary}
            </p>
          </div>
          {result.alternatives?.map((alt, i) => (
            <div key={i} className="rounded-xl border border-edge bg-card p-5">
              <div className="flex items-start justify-between">
                <p className="text-xs font-medium text-content-2">
                  Alternative {i + 1}
                </p>
                <button
                  onClick={() => copyText(alt, i)}
                  className="rounded-lg p-1.5 text-content-3 hover:bg-card-hover hover:text-content"
                >
                  {copied === i ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-content-2">
                {alt}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
