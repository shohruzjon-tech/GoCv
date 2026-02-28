"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, RefreshCw, ArrowRight, Brain, Upload } from "lucide-react";

export default function CvGenerateRouterPage() {
  const router = useRouter();

  /* If the user came from the landing page, redirect immediately */
  useEffect(() => {
    const pending = localStorage.getItem("pending_cv_wizard");
    if (pending) {
      try {
        const data = JSON.parse(pending);
        if (data.wizardMode === "polish") {
          router.replace("/dashboard/cv/generate/polish");
        } else {
          router.replace("/dashboard/cv/generate/ai");
        }
      } catch {
        /* corrupt data — stay on chooser */
      }
    }
  }, [router]);

  return (
    <div className="relative pb-8">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-content sm:text-4xl">
          CV Builder
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-base text-content-3 leading-relaxed">
          Choose how you want to create your professional, ATS-optimized CV
        </p>
      </div>

      {/* Two cards */}
      <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
        {/* AI Builder */}
        <button
          onClick={() => router.push("/dashboard/cv/generate/ai")}
          className="group relative overflow-hidden rounded-2xl border border-edge bg-card/80 p-8 text-left backdrop-blur-sm transition-all duration-300 hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/10 hover:scale-[1.02]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="relative">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-600/20">
              <Brain className="h-7 w-7 text-white" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-content">
              Build with AI
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-content-3">
              Tell us about yourself in a few sentences — AI generates a
              complete CV, then you refine each section step&nbsp;by&nbsp;step.
            </p>
            <div className="flex items-center gap-2 text-sm font-semibold text-indigo-400 transition group-hover:gap-3">
              <Sparkles className="h-4 w-4" />
              Start Building
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </button>

        {/* Polish Existing */}
        <button
          onClick={() => router.push("/dashboard/cv/generate/polish")}
          className="group relative overflow-hidden rounded-2xl border border-edge bg-card/80 p-8 text-left backdrop-blur-sm transition-all duration-300 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/10 hover:scale-[1.02]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="relative">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 shadow-lg shadow-emerald-600/20">
              <Upload className="h-7 w-7 text-white" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-content">
              Polish Existing CV
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-content-3">
              Upload your current CV — we extract every section so you can edit,
              preview, and let AI polish the language &amp;&nbsp;formatting.
            </p>
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400 transition group-hover:gap-3">
              <RefreshCw className="h-4 w-4" />
              Upload &amp; Polish
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </button>
      </div>

      {/* Resume draft hint */}
      <DraftHint />
    </div>
  );
}

/* ─── Checks localStorage for an existing draft and shows a banner ─── */
function DraftHint() {
  const router = useRouter();

  useEffect(() => {
    const draft = localStorage.getItem("cv_wizard_draft");
    if (!draft) return;
    try {
      const d = JSON.parse(draft);
      const el = document.getElementById("draft-hint");
      if (el && d.personalInfo?.fullName) {
        el.classList.remove("hidden");
        const label = el.querySelector("[data-draft-label]");
        if (label)
          label.textContent = `Continue editing ${d.personalInfo.fullName}'s CV`;
      }
    } catch {}
  }, []);

  const handleResume = () => {
    try {
      const draft = localStorage.getItem("cv_wizard_draft");
      if (draft) {
        const d = JSON.parse(draft);
        const target =
          d.wizardMode === "polish"
            ? "/dashboard/cv/generate/polish"
            : "/dashboard/cv/generate/ai";
        router.push(target);
      }
    } catch {}
  };

  return (
    <div
      id="draft-hint"
      className="mx-auto mt-8 hidden max-w-3xl overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-orange-500/5"
    >
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 ring-1 ring-amber-500/20">
            <RefreshCw className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <p
              data-draft-label
              className="text-sm font-semibold text-content"
            />
            <p className="text-xs text-content-3">You have unsaved progress</p>
          </div>
        </div>
        <button
          onClick={handleResume}
          className="rounded-xl bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-400 ring-1 ring-amber-500/20 transition hover:bg-amber-500/20"
        >
          Resume
        </button>
      </div>
    </div>
  );
}
