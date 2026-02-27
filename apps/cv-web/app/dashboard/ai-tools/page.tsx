"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSubscriptionStore } from "@/lib/store";
import { aiApi } from "@/lib/api";
import { AiUsageStats } from "@/types";
import {
  Wand2,
  Target,
  ListChecks,
  FileText,
  Search,
  BarChart3,
  MessageSquare,
  Crown,
  Lock,
  Sparkles,
  Zap,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

const tools = [
  {
    id: "enhance",
    name: "CV Enhancer",
    description:
      "AI analyzes your entire CV and suggests improvements for impact, clarity, and professionalism.",
    icon: Wand2,
    color: "from-indigo-500 to-purple-600",
    href: "/dashboard/ai-tools/enhance",
    premium: true,
  },
  {
    id: "tailor",
    name: "Job Tailor",
    description:
      "Automatically tailor your CV for a specific job description to maximize your match score.",
    icon: Target,
    color: "from-blue-500 to-cyan-600",
    href: "/dashboard/ai-tools/tailor",
    premium: true,
  },
  {
    id: "bullets",
    name: "Bullet Improver",
    description:
      "Transform weak bullet points into powerful, metrics-driven achievement statements.",
    icon: ListChecks,
    color: "from-emerald-500 to-teal-600",
    href: "/dashboard/ai-tools/bullets",
    premium: false,
  },
  {
    id: "summary",
    name: "Summary Generator",
    description:
      "Generate a compelling professional summary tailored to your experience and target role.",
    icon: FileText,
    color: "from-amber-500 to-orange-600",
    href: "/dashboard/ai-tools/summary",
    premium: false,
  },
  {
    id: "skill-gap",
    name: "Skill Gap Analysis",
    description:
      "Identify missing skills for your target role and get personalized learning recommendations.",
    icon: Search,
    color: "from-pink-500 to-rose-600",
    href: "/dashboard/ai-tools/skill-gap",
    premium: true,
  },
  {
    id: "ats",
    name: "ATS Score Checker",
    description:
      "Check how well your CV will perform with Applicant Tracking Systems and get optimization tips.",
    icon: BarChart3,
    color: "from-violet-500 to-purple-600",
    href: "/dashboard/ai-tools/ats",
    premium: true,
  },
  {
    id: "interview",
    name: "Interview Prep",
    description:
      "Get AI-generated interview questions and preparation tips based on your CV and target job.",
    icon: MessageSquare,
    color: "from-cyan-500 to-blue-600",
    href: "/dashboard/ai-tools/interview",
    premium: true,
  },
];

export default function AiToolsPage() {
  const { subscription } = useSubscriptionStore();
  const [usage, setUsage] = useState<AiUsageStats | null>(null);

  useEffect(() => {
    aiApi
      .getUsage()
      .then((r) => setUsage(r.data))
      .catch(() => {});
  }, []);

  const hasAdvanced = subscription?.limits?.hasAdvancedAiTools ?? false;
  const creditsUsed = subscription?.currentUsage?.aiCreditsUsed ?? 0;
  const creditsMax = subscription?.limits?.maxAiCreditsPerMonth ?? 10;
  const creditsPercent = Math.min(100, (creditsUsed / creditsMax) * 100);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          <span className="text-gradient">AI</span> Tools
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Powerful AI-driven tools to perfect your CV and ace your job search
        </p>
      </div>

      {/* Usage Card */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              <Zap className="h-4 w-4 text-amber-400" />
              AI Credits This Month
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              {creditsUsed} / {creditsMax} credits used
            </p>
          </div>
          <div className="flex items-center gap-4">
            {usage && (
              <div className="text-right">
                <p className="text-xs text-zinc-500">Total Requests</p>
                <p className="text-lg font-bold text-white">
                  {usage.totalRequests}
                </p>
              </div>
            )}
            {subscription?.plan === "free" && (
              <Link
                href="/dashboard/settings/billing"
                className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25"
              >
                <Crown className="h-3.5 w-3.5" />
                Get More Credits
              </Link>
            )}
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              creditsPercent > 80
                ? "bg-gradient-to-r from-red-500 to-orange-500"
                : "bg-gradient-to-r from-indigo-500 to-purple-500"
            }`}
            style={{ width: `${creditsPercent}%` }}
          />
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => {
          const locked = tool.premium && !hasAdvanced;
          return (
            <div
              key={tool.id}
              className={`group relative overflow-hidden rounded-2xl border transition ${
                locked
                  ? "border-white/[0.04] bg-white/[0.01] opacity-75"
                  : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.03]"
              }`}
            >
              <div className="p-6">
                <div
                  className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${tool.color} shadow-lg`}
                >
                  <tool.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                  {tool.name}
                  {tool.premium && (
                    <span className="flex items-center gap-0.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 ring-1 ring-amber-500/20">
                      <Crown className="h-3 w-3" /> PRO
                    </span>
                  )}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {tool.description}
                </p>
                <div className="mt-6">
                  {locked ? (
                    <Link
                      href="/dashboard/settings/billing"
                      className="flex items-center gap-2 text-sm font-medium text-indigo-400 transition hover:text-indigo-300"
                    >
                      <Lock className="h-4 w-4" />
                      Upgrade to unlock
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  ) : (
                    <Link
                      href={tool.href}
                      className="flex items-center gap-2 text-sm font-medium text-indigo-400 transition hover:text-indigo-300"
                    >
                      <Sparkles className="h-4 w-4" />
                      Use Tool
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
