"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore, useSubscriptionStore } from "@/lib/store";
import { cvApi, projectsApi } from "@/lib/api";
import { Cv, Project } from "@/types";
import {
  Plus,
  FileText,
  FolderOpen,
  Sparkles,
  ExternalLink,
  Edit,
  Trash2,
  Globe,
  Wand2,
  ArrowUpRight,
  Clock,
  TrendingUp,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";

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
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const deleteCv = async (id: string) => {
    if (!confirm("Are you sure you want to delete this CV?")) return;
    try {
      await cvApi.delete(id);
      setCvs((prev) => prev.filter((cv) => cv._id !== id));
      toast.success("CV deleted");
    } catch {
      toast.error("Failed to delete CV");
    }
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const publishedCvs = cvs.filter((cv) => cv.status === "published").length;
  const aiCreditsUsed = subscription?.currentUsage?.aiCreditsUsed ?? 0;
  const aiCreditsLimit = subscription?.limits?.maxAiCreditsPerMonth ?? 10;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 sm:space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-semibold text-content sm:text-2xl">
          {greeting()}, {user?.name?.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-content-3">
          Here&apos;s what&apos;s happening with your portfolio
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-2xl border border-edge bg-card p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-content">{cvs.length}</p>
              <p className="text-xs text-content-3">Total CVs</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-edge bg-card p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-content">{publishedCvs}</p>
              <p className="text-xs text-content-3">Published</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-edge bg-card p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-content">
                {projects.length}
              </p>
              <p className="text-xs text-content-3">Projects</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-edge bg-card p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-content">
                {aiCreditsLimit - aiCreditsUsed}
              </p>
              <p className="text-xs text-content-3">AI Credits</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <Link
          href="/dashboard/cv/builder"
          className="group flex items-center gap-4 rounded-2xl border border-edge bg-card p-4 transition-all hover:border-indigo-500/20 hover:bg-card-hover hover:shadow-lg hover:shadow-indigo-500/5 sm:p-5"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600/15 text-indigo-400 ring-1 ring-indigo-500/20 transition group-hover:bg-indigo-600/25">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-content">
              AI CV Builder
            </h3>
            <p className="text-xs text-content-3">Generate with AI</p>
          </div>
          <ArrowUpRight className="ml-auto h-4 w-4 text-content-4 transition group-hover:text-indigo-400" />
        </Link>

        <Link
          href="/dashboard/projects/new"
          className="group flex items-center gap-4 rounded-2xl border border-edge bg-card p-4 transition-all hover:border-emerald-500/20 hover:bg-card-hover hover:shadow-lg hover:shadow-emerald-500/5 sm:p-5"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600/15 text-emerald-400 ring-1 ring-emerald-500/20 transition group-hover:bg-emerald-600/25">
            <Plus className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-content">Add Project</h3>
            <p className="text-xs text-content-3">Showcase your work</p>
          </div>
          <ArrowUpRight className="ml-auto h-4 w-4 text-content-4 transition group-hover:text-emerald-400" />
        </Link>

        <Link
          href="/dashboard/ai-tools"
          className="group flex items-center gap-4 rounded-2xl border border-edge bg-card p-4 transition-all hover:border-purple-500/20 hover:bg-card-hover hover:shadow-lg hover:shadow-purple-500/5 sm:p-5"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-600/15 text-purple-400 ring-1 ring-purple-500/20 transition group-hover:bg-purple-600/25">
            <Wand2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-content">AI Tools</h3>
            <p className="text-xs text-content-3">Enhance & optimize</p>
          </div>
          <ArrowUpRight className="ml-auto h-4 w-4 text-content-4 transition group-hover:text-purple-400" />
        </Link>
      </div>

      {/* My CVs */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-content">My CVs</h2>
          <Link
            href="/dashboard/cv/builder"
            className="flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300"
          >
            <Plus className="h-3.5 w-3.5" /> New CV
          </Link>
        </div>

        {cvs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-edge p-8 text-center sm:p-12">
            <FileText className="mx-auto mb-3 h-8 w-8 text-content-4" />
            <p className="mb-1 text-sm font-medium text-content-2">
              No CVs yet
            </p>
            <p className="mb-4 text-xs text-content-3">
              Create your first CV with our AI builder
            </p>
            <Link
              href="/dashboard/cv/builder"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 transition"
            >
              <Sparkles className="h-4 w-4" /> Generate with AI
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 sm:gap-4">
            {cvs.map((cv) => (
              <div
                key={cv._id}
                className="group rounded-2xl border border-edge bg-card p-4 transition-all hover:border-edge hover:bg-card-hover hover:shadow-md sm:p-5"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-content">
                      {cv.title}
                    </h3>
                    <div className="mt-1 flex items-center gap-2 text-xs text-content-3">
                      <Clock className="h-3 w-3" />
                      {new Date(
                        cv.updatedAt || cv.createdAt || "",
                      ).toLocaleDateString()}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      cv.status === "published"
                        ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                        : cv.status === "draft"
                          ? "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20"
                          : "bg-card-hover text-content-3 ring-1 ring-edge"
                    }`}
                  >
                    {cv.status}
                  </span>
                </div>
                <p className="mb-4 text-xs text-content-3 line-clamp-2 leading-relaxed">
                  {cv.summary || "No summary added"}
                </p>
                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/dashboard/cv/${cv._id}/edit`}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-content-2 transition hover:bg-card-hover hover:text-content"
                  >
                    <Edit className="h-3 w-3" /> Edit
                  </Link>
                  {cv.isPublic && cv.slug && (
                    <Link
                      href={`/cv/${cv.slug}`}
                      target="_blank"
                      className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-indigo-400 transition hover:bg-indigo-500/10"
                    >
                      <Globe className="h-3 w-3" /> View
                    </Link>
                  )}
                  <button
                    onClick={() => deleteCv(cv._id)}
                    className="ml-auto flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-400/70 opacity-0 transition hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* My Projects */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-content">My Projects</h2>
          <Link
            href="/dashboard/projects/new"
            className="flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300"
          >
            <Plus className="h-3.5 w-3.5" /> Add Project
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-edge p-8 text-center sm:p-12">
            <FolderOpen className="mx-auto mb-3 h-8 w-8 text-content-4" />
            <p className="mb-1 text-sm font-medium text-content-2">
              No projects yet
            </p>
            <p className="mb-4 text-xs text-content-3">
              Showcase your portfolio projects
            </p>
            <Link
              href="/dashboard/projects/new"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 transition"
            >
              <Plus className="h-4 w-4" /> Add Project
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 sm:gap-4">
            {projects.map((project) => (
              <div
                key={project._id}
                className="group overflow-hidden rounded-2xl border border-edge bg-card transition-all hover:border-edge hover:bg-card-hover hover:shadow-md"
              >
                {project.images?.[0] ? (
                  <img
                    src={project.images[0].url}
                    alt={project.title}
                    className="h-36 w-full object-cover sm:h-40"
                  />
                ) : (
                  <div className="flex h-28 items-center justify-center bg-gradient-to-br from-indigo-600/10 to-purple-600/10 sm:h-32">
                    <FolderOpen className="h-8 w-8 text-content-4" />
                  </div>
                )}
                <div className="p-4 sm:p-5">
                  <h3 className="mb-1 truncate text-sm font-semibold text-content">
                    {project.title}
                  </h3>
                  <p className="mb-3 text-xs text-content-3 line-clamp-2 leading-relaxed">
                    {project.description || "No description"}
                  </p>
                  {project.technologies.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1">
                      {project.technologies.slice(0, 3).map((tech) => (
                        <span
                          key={tech}
                          className="rounded-md bg-card-hover px-1.5 py-0.5 text-[10px] text-content-2 ring-1 ring-edge"
                        >
                          {tech}
                        </span>
                      ))}
                      {project.technologies.length > 3 && (
                        <span className="rounded-md px-1.5 py-0.5 text-[10px] text-content-3">
                          +{project.technologies.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/dashboard/projects/${project._id}/edit`}
                      className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-content-2 transition hover:bg-card-hover hover:text-content"
                    >
                      <Edit className="h-3 w-3" /> Edit
                    </Link>
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-indigo-400 transition hover:bg-indigo-500/10"
                      >
                        <ExternalLink className="h-3 w-3" /> Live
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
