"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuthStore, useSubscriptionStore } from "@/lib/store";
import { cvApi, projectsApi, aiApi } from "@/lib/api";
import { Cv, Project } from "@/types";
import {
  FileText,
  FolderOpen,
  Sparkles,
  ExternalLink,
  Globe,
  Wand2,
  ArrowUpRight,
  Zap,
  TrendingUp,
  Crown,
  Eye,
  Download,
  Brain,
  Lightbulb,
  ChevronRight,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  ArrowUp,
  Plus,
  Rocket,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { subscription } = useSubscriptionStore();
  const [cvs, setCvs] = useState<Cv[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [cvRes, projRes] = await Promise.all([
        cvApi.getAll(),
        projectsApi.getAll(),
      ]);
      setCvs(cvRes.data);
      setProjects(projRes.data);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // ── Computed stats ──
  const publishedCvs = cvs.filter((cv) => cv.status === "published").length;
  const draftCvs = cvs.filter((cv) => cv.status === "draft").length;
  const aiCreditsUsed = subscription?.currentUsage?.aiCreditsUsed ?? 0;
  const aiCreditsLimit = subscription?.limits?.maxAiCreditsPerMonth ?? 10;
  const aiCreditsRemaining = Math.max(0, aiCreditsLimit - aiCreditsUsed);
  const pdfExportsUsed = subscription?.currentUsage?.pdfExportsUsed ?? 0;
  const pdfExportsLimit = subscription?.limits?.maxPdfExportsPerMonth ?? 5;
  const totalViews = cvs.reduce(
    (acc, cv) => acc + (cv.metadata?.viewCount ?? 0),
    0,
  );
  const maxCvs = subscription?.limits?.maxCvs ?? 3;

  // AI suggestions
  const suggestions = useMemo(
    () => generateSuggestions(cvs, projects, subscription),
    [cvs, projects, subscription],
  );

  // Chart data
  const cvStatusData = useMemo(
    () =>
      [
        { name: "Published", value: publishedCvs, color: "#10b981" },
        { name: "Drafts", value: draftCvs, color: "#f59e0b" },
        {
          name: "Archived",
          value: cvs.filter((c) => c.status === "archived").length,
          color: "#6b7280",
        },
      ].filter((d) => d.value > 0),
    [cvs, publishedCvs, draftCvs],
  );

  const aiUsageChartData = useMemo(
    () => generateAiUsageChart(aiCreditsUsed, aiCreditsLimit),
    [aiCreditsUsed, aiCreditsLimit],
  );

  const activityData = useMemo(() => generateActivityData(cvs), [cvs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
      {/* ─── Greeting & Summary Banner ─── */}
      <div className="relative overflow-hidden rounded-2xl border border-edge bg-gradient-to-br from-indigo-600/5 via-purple-600/5 to-pink-600/5 p-6 sm:p-8">
        <div className="relative z-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-content sm:text-2xl">
                {greeting()},{" "}
                <span className="text-gradient">
                  {user?.name?.split(" ")[0]}
                </span>
              </h1>
              <p className="mt-1 text-sm text-content-3">
                Here&apos;s your portfolio overview and insights
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/cv/generate"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-500 hover:shadow-xl active:scale-[0.98]"
              >
                <Sparkles className="h-4 w-4" /> New CV
              </Link>
            </div>
          </div>

          {/* Quick summary pills */}
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs font-medium text-content-2 ring-1 ring-edge">
              <FileText className="h-3 w-3 text-indigo-400" /> {cvs.length} CVs
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs font-medium text-content-2 ring-1 ring-edge">
              <Globe className="h-3 w-3 text-emerald-400" /> {publishedCvs}{" "}
              Published
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs font-medium text-content-2 ring-1 ring-edge">
              <FolderOpen className="h-3 w-3 text-purple-400" />{" "}
              {projects.length} Projects
            </span>
            {totalViews > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs font-medium text-content-2 ring-1 ring-edge">
                <Eye className="h-3 w-3 text-cyan-400" /> {totalViews} Views
              </span>
            )}
          </div>
        </div>

        {/* Decorative gradient orbs */}
        <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      {/* ─── Stats Grid ─── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
        <StatCard
          icon={FileText}
          iconColor="indigo"
          label="Total CVs"
          value={cvs.length}
          maxValue={maxCvs}
          showProgress
          trend={cvs.length > 0 ? `${draftCvs} drafts` : undefined}
        />
        <StatCard
          icon={Globe}
          iconColor="emerald"
          label="Published"
          value={publishedCvs}
          trend={publishedCvs > 0 ? "Live" : undefined}
          trendPositive
        />
        <StatCard
          icon={Eye}
          iconColor="cyan"
          label="Total Views"
          value={totalViews}
          trend={totalViews > 0 ? "All time" : undefined}
        />
        <StatCard
          icon={Zap}
          iconColor="amber"
          label="AI Credits"
          value={aiCreditsRemaining}
          maxValue={aiCreditsLimit}
          showProgress
          trend={`${aiCreditsUsed} used this month`}
        />
      </div>

      {/* ─── Main Grid: Charts + Suggestions ─── */}
      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        {/* Left column: Charts */}
        <div className="space-y-4 lg:col-span-2 lg:space-y-6">
          {/* Activity Chart */}
          <div className="rounded-2xl border border-edge bg-card p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-content">
                  Activity Overview
                </h3>
                <p className="mt-0.5 text-xs text-content-3">
                  CV creation activity over time
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-content-3">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-indigo-500" /> CVs
                  Created
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-purple-500" /> AI
                  Edits
                </span>
              </div>
            </div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={activityData}
                  margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorCvs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorEdits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--t-edge)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "var(--t-content-4)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--t-content-4)" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--t-popover)",
                      border: "1px solid var(--t-edge)",
                      borderRadius: "12px",
                      fontSize: "12px",
                      boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
                    }}
                    itemStyle={{ color: "var(--t-content-2)" }}
                    labelStyle={{
                      color: "var(--t-content)",
                      fontWeight: 600,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cvs"
                    name="CVs Created"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCvs)"
                  />
                  <Area
                    type="monotone"
                    dataKey="edits"
                    name="AI Edits"
                    stroke="#a855f7"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorEdits)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Two col: CV Status + AI Usage */}
          <div className="grid gap-4 sm:grid-cols-2 lg:gap-6">
            {/* CV Status Distribution */}
            <div className="rounded-2xl border border-edge bg-card p-5 sm:p-6">
              <h3 className="mb-4 text-sm font-semibold text-content">
                CV Status
              </h3>
              {cvs.length === 0 ? (
                <div className="flex h-[160px] items-center justify-center text-xs text-content-4">
                  No CVs yet
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="h-[140px] w-[140px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={cvStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={65}
                          paddingAngle={3}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {cvStatusData.map((entry, idx) => (
                            <Cell key={idx} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2.5">
                    {cvStatusData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: item.color }}
                        />
                        <span className="text-xs text-content-2">
                          {item.name}
                        </span>
                        <span className="ml-auto text-xs font-bold text-content">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* AI Credits Usage */}
            <div className="rounded-2xl border border-edge bg-card p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-content">
                  AI Credits
                </h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    aiCreditsRemaining > aiCreditsLimit * 0.3
                      ? "bg-emerald-500/10 text-emerald-400"
                      : aiCreditsRemaining > 0
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {aiCreditsRemaining} left
                </span>
              </div>
              <div className="h-[130px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={aiUsageChartData}
                    margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--t-edge)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: "var(--t-content-4)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "var(--t-content-4)" }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--t-popover)",
                        border: "1px solid var(--t-edge)",
                        borderRadius: "12px",
                        fontSize: "12px",
                        boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
                      }}
                    />
                    <Bar
                      dataKey="used"
                      name="Used"
                      fill="#6366f1"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="remaining"
                      name="Remaining"
                      fill="var(--t-edge)"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px]">
                <span className="text-content-3">
                  {aiCreditsUsed} of {aiCreditsLimit} used
                </span>
                {subscription?.plan === "free" && (
                  <Link
                    href="/dashboard/settings/billing"
                    className="font-medium text-indigo-400 transition hover:text-indigo-300"
                  >
                    Upgrade →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Suggestions + Widgets */}
        <div className="space-y-4 lg:space-y-6">
          {/* AI-Powered Suggestions */}
          <div className="rounded-2xl border border-edge bg-card p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10">
                <Brain className="h-4 w-4 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-content">
                  AI Insights
                </h3>
                <p className="text-[10px] text-content-4">
                  Personalized suggestions
                </p>
              </div>
            </div>

            {suggestions.length === 0 ? (
              <div className="rounded-xl bg-emerald-500/5 p-4 text-center ring-1 ring-emerald-500/15">
                <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-emerald-400" />
                <p className="text-xs font-medium text-emerald-400">
                  All looking great!
                </p>
                <p className="mt-0.5 text-[10px] text-content-3">
                  No urgent suggestions
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {suggestions.map((s, i) => (
                  <SuggestionItem key={i} suggestion={s} />
                ))}
              </div>
            )}
          </div>

          {/* Usage Meters */}
          <div className="rounded-2xl border border-edge bg-card p-5 sm:p-6">
            <h3 className="mb-4 text-sm font-semibold text-content">
              Usage Overview
            </h3>
            <div className="space-y-4">
              <UsageMeter
                label="CVs Created"
                used={cvs.length}
                limit={maxCvs}
                icon={FileText}
                color="indigo"
              />
              <UsageMeter
                label="AI Credits"
                used={aiCreditsUsed}
                limit={aiCreditsLimit}
                icon={Sparkles}
                color="purple"
              />
              <UsageMeter
                label="PDF Exports"
                used={pdfExportsUsed}
                limit={pdfExportsLimit}
                icon={Download}
                color="cyan"
              />
            </div>
            {subscription?.plan === "free" && (
              <Link
                href="/dashboard/settings/billing"
                className="mt-4 flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600/10 to-purple-600/10 px-4 py-2.5 text-xs font-semibold text-indigo-400 ring-1 ring-indigo-500/20 transition hover:from-indigo-600/15 hover:to-purple-600/15"
              >
                <Crown className="h-3.5 w-3.5" />
                Upgrade for unlimited access
                <ArrowUpRight className="ml-auto h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          {/* Portfolio Score */}
          <PortfolioScore
            cvs={cvs}
            projects={projects}
            subscription={subscription}
          />
        </div>
      </div>

      {/* ─── Quick Actions ─── */}
      <div className="grid gap-3 sm:grid-cols-4 sm:gap-4">
        <QuickAction
          href="/dashboard/cv/generate"
          icon={Sparkles}
          color="indigo"
          title="AI CV Builder"
          desc="Generate with AI"
        />
        <QuickAction
          href="/dashboard/my-cvs"
          icon={FileText}
          color="emerald"
          title="My CVs"
          desc="View & manage all"
        />
        <QuickAction
          href="/dashboard/projects/new"
          icon={Plus}
          color="purple"
          title="Add Project"
          desc="Showcase work"
        />
        <QuickAction
          href="/dashboard/ai-tools"
          icon={Wand2}
          color="amber"
          title="AI Tools"
          desc="Enhance & optimize"
        />
      </div>

      {/* ─── Recent CVs + Recent Projects ─── */}
      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        {/* Recent CVs */}
        <div className="rounded-2xl border border-edge bg-card p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-content">Recent CVs</h3>
            <Link
              href="/dashboard/my-cvs"
              className="flex items-center gap-1 text-xs font-medium text-indigo-400 transition hover:text-indigo-300"
            >
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {cvs.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No CVs yet"
              desc="Create your first CV with AI"
              actionHref="/dashboard/cv/generate"
              actionLabel="Generate CV"
              color="indigo"
            />
          ) : (
            <div className="space-y-2">
              {cvs.slice(0, 4).map((cv) => (
                <Link
                  key={cv._id}
                  href={`/dashboard/cv/${cv._id}/edit`}
                  className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all hover:bg-card-hover"
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      cv.status === "published"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-content transition-colors group-hover:text-indigo-400">
                      {cv.title}
                    </p>
                    <p className="text-[11px] text-content-4">
                      {new Date(
                        cv.updatedAt || cv.createdAt,
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      cv.status === "published"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : cv.status === "draft"
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-slate-500/10 text-slate-400"
                    }`}
                  >
                    {cv.status}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-content-4 opacity-0 transition group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Projects */}
        <div className="rounded-2xl border border-edge bg-card p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-content">
              Recent Projects
            </h3>
            <Link
              href="/dashboard/projects"
              className="flex items-center gap-1 text-xs font-medium text-indigo-400 transition hover:text-indigo-300"
            >
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {projects.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="No projects yet"
              desc="Showcase your portfolio"
              actionHref="/dashboard/projects/new"
              actionLabel="Add Project"
              color="emerald"
            />
          ) : (
            <div className="space-y-2">
              {projects.slice(0, 4).map((project) => (
                <Link
                  key={project._id}
                  href={`/dashboard/projects/${project._id}/edit`}
                  className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all hover:bg-card-hover"
                >
                  {project.images?.[0] ? (
                    <img
                      src={project.images[0].url}
                      alt=""
                      className="h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-edge"
                    />
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                      <FolderOpen className="h-4 w-4" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-content transition-colors group-hover:text-indigo-400">
                      {project.title}
                    </p>
                    <div className="flex items-center gap-1.5">
                      {project.technologies.slice(0, 2).map((t) => (
                        <span key={t} className="text-[10px] text-content-4">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  {project.liveUrl && (
                    <ExternalLink className="h-3.5 w-3.5 text-content-4" />
                  )}
                  <ChevronRight className="h-3.5 w-3.5 text-content-4 opacity-0 transition group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Getting Started ─── */}
      {cvs.length < 3 && (
        <div className="rounded-2xl border border-edge bg-card p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Rocket className="h-4 w-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-content">
              Getting Started
            </h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <GettingStartedStep
              step={1}
              title="Create your CV"
              desc="Use AI to generate a professional CV in minutes"
              done={cvs.length > 0}
              href="/dashboard/cv/generate"
            />
            <GettingStartedStep
              step={2}
              title="Add projects"
              desc="Showcase your best work with images and details"
              done={projects.length > 0}
              href="/dashboard/projects/new"
            />
            <GettingStartedStep
              step={3}
              title="Publish & share"
              desc="Make your CV live and share it with employers"
              done={publishedCvs > 0}
              href="/dashboard/my-cvs"
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ═════════════════════════════════════════════
   Sub-components
   ═════════════════════════════════════════════ */

function StatCard({
  icon: Icon,
  iconColor,
  label,
  value,
  maxValue,
  showProgress,
  trend,
  trendPositive,
}: {
  icon: any;
  iconColor: string;
  label: string;
  value: number;
  maxValue?: number;
  showProgress?: boolean;
  trend?: string;
  trendPositive?: boolean;
}) {
  const colorMap: Record<string, string> = {
    indigo: "bg-indigo-500/10 text-indigo-400",
    emerald: "bg-emerald-500/10 text-emerald-400",
    cyan: "bg-cyan-500/10 text-cyan-400",
    amber: "bg-amber-500/10 text-amber-400",
    purple: "bg-purple-500/10 text-purple-400",
  };

  return (
    <div className="rounded-2xl border border-edge bg-card p-4 transition-all hover:shadow-md sm:p-5">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorMap[iconColor] || colorMap.indigo}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold text-content">{value}</p>
          <p className="text-[11px] font-medium text-content-3">{label}</p>
        </div>
      </div>
      {showProgress && maxValue && maxValue !== Infinity && (
        <div className="mt-3">
          <div className="h-1 overflow-hidden rounded-full bg-edge">
            <div
              className={`h-full rounded-full transition-all ${
                value / maxValue > 0.9
                  ? "bg-red-500"
                  : value / maxValue > 0.7
                    ? "bg-amber-500"
                    : "bg-indigo-500"
              }`}
              style={{
                width: `${Math.min(100, (value / maxValue) * 100)}%`,
              }}
            />
          </div>
          <p className="mt-1 text-[10px] text-content-4">
            {value} / {maxValue}
          </p>
        </div>
      )}
      {trend && !showProgress && (
        <p
          className={`mt-2 text-[10px] font-medium ${trendPositive ? "text-emerald-400" : "text-content-4"}`}
        >
          {trendPositive && <ArrowUp className="mr-0.5 inline h-2.5 w-2.5" />}
          {trend}
        </p>
      )}
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  color,
  title,
  desc,
}: {
  href: string;
  icon: any;
  color: string;
  title: string;
  desc: string;
}) {
  const colorMap: Record<string, { bg: string; hover: string; arrow: string }> =
    {
      indigo: {
        bg: "bg-indigo-600/15 text-indigo-400 ring-1 ring-indigo-500/20",
        hover:
          "hover:border-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/5",
        arrow: "group-hover:text-indigo-400",
      },
      emerald: {
        bg: "bg-emerald-600/15 text-emerald-400 ring-1 ring-emerald-500/20",
        hover:
          "hover:border-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/5",
        arrow: "group-hover:text-emerald-400",
      },
      purple: {
        bg: "bg-purple-600/15 text-purple-400 ring-1 ring-purple-500/20",
        hover:
          "hover:border-purple-500/20 hover:shadow-lg hover:shadow-purple-500/5",
        arrow: "group-hover:text-purple-400",
      },
      amber: {
        bg: "bg-amber-600/15 text-amber-400 ring-1 ring-amber-500/20",
        hover:
          "hover:border-amber-500/20 hover:shadow-lg hover:shadow-amber-500/5",
        arrow: "group-hover:text-amber-400",
      },
    };
  const c = colorMap[color] || colorMap.indigo;

  return (
    <Link
      href={href}
      className={`group flex items-center gap-4 rounded-2xl border border-edge bg-card p-4 transition-all hover:bg-card-hover ${c.hover} sm:p-5`}
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${c.bg} transition group-hover:scale-105`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-content">{title}</h3>
        <p className="text-xs text-content-3">{desc}</p>
      </div>
      <ArrowUpRight
        className={`ml-auto h-4 w-4 text-content-4 transition ${c.arrow}`}
      />
    </Link>
  );
}

function UsageMeter({
  label,
  used,
  limit,
  icon: Icon,
  color,
}: {
  label: string;
  used: number;
  limit: number;
  icon: any;
  color: string;
}) {
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const colorMap: Record<string, { bar: string; icon: string }> = {
    indigo: { bar: "bg-indigo-500", icon: "text-indigo-400" },
    purple: { bar: "bg-purple-500", icon: "text-purple-400" },
    cyan: { bar: "bg-cyan-500", icon: "text-cyan-400" },
  };
  const c = colorMap[color] || colorMap.indigo;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs text-content-2">
          <Icon className={`h-3 w-3 ${c.icon}`} />
          {label}
        </span>
        <span className="text-xs font-bold text-content">
          {used}
          <span className="font-normal text-content-4"> / {limit}</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-edge">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            pct > 90 ? "bg-red-500" : pct > 70 ? "bg-amber-500" : c.bar
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function PortfolioScore({
  cvs,
  projects,
  subscription,
}: {
  cvs: Cv[];
  projects: Project[];
  subscription: any;
}) {
  const score = useMemo(() => {
    let s = 0;
    if (cvs.length > 0) s += 15;
    if (cvs.length >= 3) s += 10;
    if (cvs.some((c) => c.status === "published")) s += 20;
    if (projects.length > 0) s += 15;
    if (projects.length >= 3) s += 10;
    const avgCompletion =
      cvs.length > 0
        ? cvs.reduce((acc, cv) => {
            let comp = 0;
            if (cv.title) comp += 20;
            if (cv.summary) comp += 20;
            if (cv.personalInfo?.fullName) comp += 20;
            if (cv.sections?.length >= 3) comp += 20;
            if (cv.theme?.primaryColor) comp += 10;
            if (cv.targetRole) comp += 10;
            return acc + comp;
          }, 0) / cvs.length
        : 0;
    s += Math.round(avgCompletion * 0.2);
    if (subscription?.plan !== "free") s += 10;
    return Math.min(100, s);
  }, [cvs, projects, subscription]);

  const getScoreColor = () => {
    if (score >= 80)
      return {
        text: "text-emerald-400",
        ring: "ring-emerald-500/30",
        bg: "bg-emerald-500",
      };
    if (score >= 50)
      return {
        text: "text-amber-400",
        ring: "ring-amber-500/30",
        bg: "bg-amber-500",
      };
    return {
      text: "text-red-400",
      ring: "ring-red-500/30",
      bg: "bg-red-500",
    };
  };

  const c = getScoreColor();

  return (
    <div className="rounded-2xl border border-edge bg-card p-5 sm:p-6">
      <h3 className="mb-4 text-sm font-semibold text-content">
        Portfolio Score
      </h3>
      <div className="flex items-center gap-4">
        <div
          className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full ring-4 ${c.ring} bg-card`}
        >
          <span className={`text-2xl font-black ${c.text}`}>{score}</span>
        </div>
        <div>
          <p className={`text-sm font-bold ${c.text}`}>
            {score >= 80
              ? "Excellent"
              : score >= 50
                ? "Good Progress"
                : "Getting Started"}
          </p>
          <p className="mt-0.5 text-[11px] text-content-3">
            {score >= 80
              ? "Your portfolio is well-optimized!"
              : score >= 50
                ? "Keep adding content to improve"
                : "Start building your portfolio"}
          </p>
        </div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-edge">
        <div
          className={`h-full rounded-full transition-all duration-700 ${c.bg}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

interface Suggestion {
  type: "warning" | "info" | "success" | "tip";
  icon: any;
  title: string;
  desc: string;
  actionHref?: string;
  actionLabel?: string;
}

function SuggestionItem({ suggestion: s }: { suggestion: Suggestion }) {
  const colorMap = {
    warning: {
      bg: "bg-amber-500/5",
      ring: "ring-amber-500/15",
      icon: "text-amber-400",
    },
    info: {
      bg: "bg-indigo-500/5",
      ring: "ring-indigo-500/15",
      icon: "text-indigo-400",
    },
    success: {
      bg: "bg-emerald-500/5",
      ring: "ring-emerald-500/15",
      icon: "text-emerald-400",
    },
    tip: {
      bg: "bg-purple-500/5",
      ring: "ring-purple-500/15",
      icon: "text-purple-400",
    },
  };
  const c = colorMap[s.type];

  return (
    <div className={`rounded-xl ${c.bg} p-3 ring-1 ${c.ring}`}>
      <div className="flex items-start gap-2.5">
        <s.icon className={`mt-0.5 h-4 w-4 shrink-0 ${c.icon}`} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-content">{s.title}</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-content-3">
            {s.desc}
          </p>
          {s.actionHref && (
            <Link
              href={s.actionHref}
              className={`mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium ${c.icon} hover:underline`}
            >
              {s.actionLabel} <ChevronRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  desc,
  actionHref,
  actionLabel,
  color,
}: {
  icon: any;
  title: string;
  desc: string;
  actionHref: string;
  actionLabel: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-edge p-6 text-center">
      <Icon className="mx-auto mb-2 h-6 w-6 text-content-4" />
      <p className="mb-0.5 text-xs font-medium text-content-2">{title}</p>
      <p className="mb-3 text-[11px] text-content-3">{desc}</p>
      <Link
        href={actionHref}
        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${
          color === "indigo"
            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
            : "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25"
        } transition hover:opacity-90`}
      >
        <Sparkles className="h-3 w-3" /> {actionLabel}
      </Link>
    </div>
  );
}

function GettingStartedStep({
  step,
  title,
  desc,
  done,
  href,
}: {
  step: number;
  title: string;
  desc: string;
  done: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-start gap-3 rounded-xl p-4 transition-all ${
        done
          ? "bg-emerald-500/5 ring-1 ring-emerald-500/15"
          : "bg-card ring-1 ring-edge hover:bg-card-hover hover:ring-indigo-500/20"
      }`}
    >
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          done
            ? "bg-emerald-500/20 text-emerald-400"
            : "bg-indigo-500/10 text-indigo-400"
        }`}
      >
        {done ? <CheckCircle2 className="h-4 w-4" /> : step}
      </div>
      <div>
        <p
          className={`text-xs font-semibold ${done ? "text-emerald-400 line-through" : "text-content"}`}
        >
          {title}
        </p>
        <p className="mt-0.5 text-[10px] leading-relaxed text-content-3">
          {desc}
        </p>
      </div>
    </Link>
  );
}

/* ═════════════════════════════════════════════
   Data helpers
   ═════════════════════════════════════════════ */

function generateSuggestions(
  cvs: Cv[],
  projects: Project[],
  subscription: any,
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  if (cvs.length === 0) {
    suggestions.push({
      type: "info",
      icon: Sparkles,
      title: "Create your first CV",
      desc: "Use our AI-powered builder to create a professional CV in minutes.",
      actionHref: "/dashboard/cv/generate",
      actionLabel: "Get Started",
    });
    return suggestions;
  }

  const unpublished = cvs.filter((c) => c.status === "draft");
  if (unpublished.length > 0) {
    suggestions.push({
      type: "warning",
      icon: AlertTriangle,
      title: `${unpublished.length} CV${unpublished.length > 1 ? "s" : ""} still in draft`,
      desc: "Publish your CVs to make them visible to employers and share with a direct link.",
      actionHref: `/dashboard/cv/${unpublished[0]._id}/edit`,
      actionLabel: "Review & Publish",
    });
  }

  const noSummary = cvs.filter((c) => !c.summary || c.summary.length < 20);
  if (noSummary.length > 0) {
    suggestions.push({
      type: "tip",
      icon: Lightbulb,
      title: "Add a professional summary",
      desc: `${noSummary.length} CV${noSummary.length > 1 ? "s" : ""} missing a summary. A good summary increases recruiter engagement by 40%.`,
      actionHref: `/dashboard/cv/${noSummary[0]._id}/edit`,
      actionLabel: "Add Summary",
    });
  }

  if (projects.length === 0) {
    suggestions.push({
      type: "info",
      icon: FolderOpen,
      title: "Showcase your work",
      desc: "Add portfolio projects to strengthen your profile and demonstrate real skills.",
      actionHref: "/dashboard/projects/new",
      actionLabel: "Add Project",
    });
  }

  if (subscription?.plan === "free" && cvs.length >= 2) {
    suggestions.push({
      type: "tip",
      icon: Crown,
      title: "Unlock premium features",
      desc: "Upgrade to access unlimited CVs, premium templates, and advanced AI tools.",
      actionHref: "/dashboard/settings/billing",
      actionLabel: "View Plans",
    });
  }

  if (cvs.length > 0 && !cvs.some((c) => (c.metadata?.totalAiEdits ?? 0) > 0)) {
    suggestions.push({
      type: "tip",
      icon: Wand2,
      title: "Try AI enhancement",
      desc: "Use AI tools to optimize your CV content, improve bullet points, and boost ATS scores.",
      actionHref: "/dashboard/ai-tools",
      actionLabel: "Explore AI Tools",
    });
  }

  return suggestions.slice(0, 4);
}

function generateAiUsageChart(used: number, limit: number) {
  return [{ label: "This Month", used, remaining: Math.max(0, limit - used) }];
}

function generateActivityData(cvs: Cv[]) {
  const now = new Date();
  const months: { label: string; cvs: number; edits: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = d.toLocaleDateString("en-US", { month: "short" });
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);

    const cvsInMonth = cvs.filter((cv) => {
      const created = new Date(cv.createdAt);
      return created >= monthStart && created <= monthEnd;
    }).length;

    const editsInMonth = cvs.reduce((acc, cv) => {
      const updated = new Date(cv.updatedAt || cv.createdAt);
      if (updated >= monthStart && updated <= monthEnd) {
        return acc + (cv.metadata?.totalAiEdits ?? 0);
      }
      return acc;
    }, 0);

    months.push({ label: monthStr, cvs: cvsInMonth, edits: editsInMonth });
  }

  return months;
}
