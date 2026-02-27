"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { projectsApi } from "@/lib/api";
import { Project } from "@/types";
import { ArrowLeft, Save, Upload, X, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function EditProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [techInput, setTechInput] = useState("");

  useEffect(() => {
    loadProject();
  }, [id]);

  const loadProject = async () => {
    try {
      const res = await projectsApi.getById(id);
      setProject(res.data);
    } catch {
      toast.error("Failed to load project");
      router.push("/dashboard/projects");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!project) return;
    setSaving(true);
    try {
      const res = await projectsApi.update(project._id, {
        title: project.title,
        description: project.description,
        longDescription: project.longDescription,
        technologies: project.technologies,
        liveUrl: project.liveUrl,
        sourceUrl: project.sourceUrl,
        startDate: project.startDate,
        endDate: project.endDate,
        isFeatured: project.isFeatured,
        isVisible: project.isVisible,
      });
      setProject(res.data);
      toast.success("Project saved!");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleAddImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!project || !e.target.files) return;
    const formData = new FormData();
    Array.from(e.target.files).forEach((f) => formData.append("files", f));
    try {
      const res = await projectsApi.addImages(project._id, formData);
      setProject(res.data);
      toast.success("Images added!");
    } catch {
      toast.error("Failed to upload images");
    }
  };

  const handleRemoveImage = async (idx: number) => {
    if (!project) return;
    try {
      const res = await projectsApi.removeImage(project._id, idx);
      setProject(res.data);
      toast.success("Image removed");
    } catch {
      toast.error("Failed to remove image");
    }
  };

  const addTech = () => {
    if (!project || !techInput.trim()) return;
    if (!project.technologies.includes(techInput.trim())) {
      setProject({
        ...project,
        technologies: [...project.technologies, techInput.trim()],
      });
    }
    setTechInput("");
  };

  if (loading || !project) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/projects")}
            className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/[0.04]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-white">Edit Project</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-400">
                Title
              </label>
              <input
                value={project.title}
                onChange={(e) =>
                  setProject({ ...project, title: e.target.value })
                }
                className="w-full rounded-lg border border-white/10 bg-white/5 text-white px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-400">
                Description
              </label>
              <textarea
                value={project.description || ""}
                onChange={(e) =>
                  setProject({ ...project, description: e.target.value })
                }
                rows={3}
                className="w-full rounded-lg border border-white/10 bg-white/5 text-white px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-400">
                Full Description
              </label>
              <textarea
                value={project.longDescription || ""}
                onChange={(e) =>
                  setProject({ ...project, longDescription: e.target.value })
                }
                rows={6}
                className="w-full rounded-lg border border-white/10 bg-white/5 text-white px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-400">
                  Live URL
                </label>
                <input
                  value={project.liveUrl || ""}
                  onChange={(e) =>
                    setProject({ ...project, liveUrl: e.target.value })
                  }
                  className="w-full rounded-lg border border-white/10 bg-white/5 text-white px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-400">
                  Source URL
                </label>
                <input
                  value={project.sourceUrl || ""}
                  onChange={(e) =>
                    setProject({ ...project, sourceUrl: e.target.value })
                  }
                  className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Technologies */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <h3 className="mb-4 font-semibold text-white">Technologies</h3>
          <div className="mb-3 flex gap-2">
            <input
              value={techInput}
              onChange={(e) => setTechInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && (e.preventDefault(), addTech())
              }
              placeholder="Add technology..."
              className="flex-1 rounded-lg border border-white/10 bg-white/5 text-white px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={addTech}
              className="rounded-lg bg-white/5 text-zinc-300 ring-1 ring-white/10 hover:bg-white/10 px-4 py-2 text-sm font-medium"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {project.technologies.map((tech) => (
              <span
                key={tech}
                className="flex items-center gap-1 rounded-full bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20 px-3 py-1 text-sm"
              >
                {tech}
                <button
                  onClick={() =>
                    setProject({
                      ...project,
                      technologies: project.technologies.filter(
                        (t) => t !== tech,
                      ),
                    })
                  }
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Images */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <h3 className="mb-4 font-semibold text-white">Images</h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {project.images.map((img, idx) => (
              <div key={idx} className="group relative">
                <img
                  src={img.url}
                  alt=""
                  className="h-32 w-full rounded-lg object-cover"
                />
                <button
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute right-1 top-1 rounded-full bg-red-600 p-1 text-white opacity-0 transition group-hover:opacity-100"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-white/10 text-zinc-600 transition hover:border-indigo-500/50 hover:text-indigo-400"
            >
              <Upload className="h-8 w-8" />
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleAddImages}
            className="hidden"
          />
        </div>

        {/* Settings */}
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={project.isFeatured}
              onChange={(e) =>
                setProject({ ...project, isFeatured: e.target.checked })
              }
              className="rounded"
            />
            Featured
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={project.isVisible}
              onChange={(e) =>
                setProject({ ...project, isVisible: e.target.checked })
              }
              className="rounded"
            />
            Visible
          </label>
        </div>
      </div>
    </div>
  );
}
