"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { projectsApi } from "@/lib/api";
import { Project } from "@/types";
import { Plus, Edit, Trash2, ExternalLink, FolderOpen } from "lucide-react";
import toast from "react-hot-toast";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const res = await projectsApi.getAll();
      setProjects(res.data);
    } catch {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (id: string) => {
    if (!confirm("Delete this project?")) return;
    try {
      await projectsApi.delete(id);
      setProjects((prev) => prev.filter((p) => p._id !== id));
      toast.success("Project deleted");
    } catch {
      toast.error("Failed to delete");
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content">My Projects</h1>
          <p className="text-sm text-content-3">Showcase your work</p>
        </div>
        <Link
          href="/dashboard/projects/new"
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 shadow-lg shadow-indigo-600/25"
        >
          <Plus className="h-4 w-4" /> Add Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-edge p-16 text-center">
          <FolderOpen className="mx-auto mb-3 h-12 w-12 text-content-2" />
          <p className="mb-4 text-lg text-content-3">No projects yet</p>
          <Link
            href="/dashboard/projects/new"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/25"
          >
            <Plus className="h-4 w-4" /> Create Your First Project
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project._id}
              className="overflow-hidden rounded-2xl border border-edge bg-card transition hover:bg-card-hover"
            >
              {project.images?.[0] ? (
                <img
                  src={project.images[0].url}
                  alt={project.title}
                  className="h-48 w-full object-cover"
                />
              ) : (
                <div className="flex h-48 items-center justify-center bg-card">
                  <FolderOpen className="h-12 w-12 text-content-4" />
                </div>
              )}
              <div className="p-5">
                <div className="mb-2 flex items-start justify-between">
                  <h3 className="font-semibold text-content">
                    {project.title}
                  </h3>
                  {project.isFeatured && (
                    <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-400 ring-1 ring-yellow-500/20">
                      Featured
                    </span>
                  )}
                </div>
                <p className="mb-3 text-sm text-content-3 line-clamp-2">
                  {project.description || "No description"}
                </p>
                {project.technologies.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-1">
                    {project.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-md bg-card px-2 py-0.5 text-xs text-content-2 ring-1 ring-edge"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 border-t border-edge pt-3">
                  <Link
                    href={`/dashboard/projects/${project._id}/edit`}
                    className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-content-2 transition hover:bg-card-hover hover:text-content"
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
                  <button
                    onClick={() => deleteProject(project._id)}
                    className="ml-auto flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
