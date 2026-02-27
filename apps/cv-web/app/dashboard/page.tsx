"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/store";
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
} from "lucide-react";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const { user } = useAuthStore();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          Welcome back, {user?.name?.split(" ")[0]}!
        </h1>
        <p className="mt-1 text-zinc-400">Manage your CVs and projects</p>
      </div>

      {/* Quick Actions */}
      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/dashboard/cv/builder"
          className="group flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition hover:border-indigo-500/30 hover:bg-white/[0.04]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 ring-1 ring-indigo-500/20 group-hover:bg-indigo-600/30 transition">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold text-white">AI CV Builder</h3>
            <p className="text-sm text-zinc-500">Generate a new CV with AI</p>
          </div>
        </Link>

        <Link
          href="/dashboard/projects/new"
          className="group flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition hover:border-emerald-500/30 hover:bg-white/[0.04]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600/20 text-emerald-400 ring-1 ring-emerald-500/20 group-hover:bg-emerald-600/30 transition">
            <Plus className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Add Project</h3>
            <p className="text-sm text-zinc-500">Showcase your work</p>
          </div>
        </Link>

        <Link
          href="/dashboard/cv/builder"
          className="group flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition hover:border-purple-500/30 hover:bg-white/[0.04]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600/20 text-purple-400 ring-1 ring-purple-500/20 group-hover:bg-purple-600/30 transition">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Create Manually</h3>
            <p className="text-sm text-zinc-500">Build step by step</p>
          </div>
        </Link>
      </div>

      {/* CVs */}
      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">My CVs</h2>
          <Link
            href="/dashboard/cv/builder"
            className="flex items-center gap-1 text-sm font-medium text-indigo-400 hover:text-indigo-300"
          >
            <Plus className="h-4 w-4" /> New CV
          </Link>
        </div>

        {cvs.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-white/10 p-12 text-center">
            <FileText className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
            <p className="mb-4 text-zinc-500">
              No CVs yet. Create your first one!
            </p>
            <Link
              href="/dashboard/cv/builder"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500"
            >
              <Sparkles className="h-4 w-4" /> Generate with AI
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cvs.map((cv) => (
              <div
                key={cv._id}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6"
              >
                <div className="mb-3 flex items-start justify-between">
                  <h3 className="font-semibold text-white">{cv.title}</h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      cv.status === "published"
                        ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                        : cv.status === "draft"
                          ? "bg-yellow-500/10 text-yellow-400 ring-1 ring-yellow-500/20"
                          : "bg-white/5 text-zinc-400 ring-1 ring-white/10"
                    }`}
                  >
                    {cv.status}
                  </span>
                </div>
                <p className="mb-4 text-sm text-zinc-500 line-clamp-2">
                  {cv.summary || "No summary"}
                </p>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/cv/${cv._id}/edit`}
                    className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:bg-white/[0.04] hover:text-white"
                  >
                    <Edit className="h-3.5 w-3.5" /> Edit
                  </Link>
                  {cv.isPublic && cv.slug && (
                    <Link
                      href={`/cv/${cv.slug}`}
                      target="_blank"
                      className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-indigo-400 transition hover:bg-indigo-500/10"
                    >
                      <Globe className="h-3.5 w-3.5" /> View
                    </Link>
                  )}
                  <button
                    onClick={() => deleteCv(cv._id)}
                    className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Projects */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">My Projects</h2>
          <Link
            href="/dashboard/projects/new"
            className="flex items-center gap-1 text-sm font-medium text-indigo-400 hover:text-indigo-300"
          >
            <Plus className="h-4 w-4" /> New Project
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-white/10 p-12 text-center">
            <FolderOpen className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
            <p className="mb-4 text-zinc-500">No projects yet.</p>
            <Link
              href="/dashboard/projects/new"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500"
            >
              <Plus className="h-4 w-4" /> Add Project
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <div
                key={project._id}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6"
              >
                {project.images?.[0] && (
                  <img
                    src={project.images[0].url}
                    alt={project.title}
                    className="mb-4 h-40 w-full rounded-xl object-cover"
                  />
                )}
                <h3 className="mb-1 font-semibold text-white">
                  {project.title}
                </h3>
                <p className="mb-3 text-sm text-zinc-500 line-clamp-2">
                  {project.description || "No description"}
                </p>
                {project.technologies.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1">
                    {project.technologies.slice(0, 4).map((tech) => (
                      <span
                        key={tech}
                        className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-zinc-400 ring-1 ring-white/10"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/projects/${project._id}/edit`}
                    className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:bg-white/[0.04] hover:text-white"
                  >
                    <Edit className="h-3.5 w-3.5" /> Edit
                  </Link>
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-indigo-400 transition hover:bg-indigo-500/10"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Live
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
