"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { projectsApi, aiApi } from "@/lib/api";
import { Project } from "@/types";
import {
  ArrowLeft,
  Save,
  Upload,
  X,
  Trash2,
  Sparkles,
  Wand2,
  Briefcase,
  Code2,
  Minimize2,
  Check,
  RotateCcw,
  Loader2,
  ChevronDown,
  Eye,
  EyeOff,
} from "lucide-react";
import toast from "react-hot-toast";

type AiAction = "improve" | "professional" | "technical" | "concise";

const AI_ACTIONS: { key: AiAction; label: string; icon: React.ReactNode }[] = [
  { key: "improve", label: "Improve", icon: <Wand2 className="h-3.5 w-3.5" /> },
  {
    key: "professional",
    label: "Professional",
    icon: <Briefcase className="h-3.5 w-3.5" />,
  },
  {
    key: "technical",
    label: "Technical",
    icon: <Code2 className="h-3.5 w-3.5" />,
  },
  {
    key: "concise",
    label: "Concise",
    icon: <Minimize2 className="h-3.5 w-3.5" />,
  },
];

export default function EditProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [techInput, setTechInput] = useState("");

  // AI state
  const [aiLoadingField, setAiLoadingField] = useState<"short" | "long" | null>(
    null,
  );
  const [aiSuggestion, setAiSuggestion] = useState<{
    field: "short" | "long";
    text: string;
  } | null>(null);
  const [showAiMenu, setShowAiMenu] = useState<"short" | "long" | null>(null);

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

  const handleAiImprove = async (field: "short" | "long", action: AiAction) => {
    if (!project) return;
    const currentText =
      field === "short"
        ? project.description || ""
        : project.longDescription || "";
    if (!project.title.trim() && !currentText.trim()) {
      toast.error("Add a project title or some text first");
      return;
    }
    setAiLoadingField(field);
    setShowAiMenu(null);
    try {
      const res = await aiApi.improveProjectDescription(
        project.title,
        currentText,
        field,
        project.technologies,
        action,
      );
      setAiSuggestion({ field, text: res.data.improved });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "AI generation failed");
    } finally {
      setAiLoadingField(null);
    }
  };

  const acceptAiSuggestion = () => {
    if (!aiSuggestion || !project) return;
    if (aiSuggestion.field === "short") {
      setProject({ ...project, description: aiSuggestion.text });
    } else {
      setProject({ ...project, longDescription: aiSuggestion.text });
    }
    setAiSuggestion(null);
    toast.success("AI suggestion applied!");
  };

  const rejectAiSuggestion = () => {
    setAiSuggestion(null);
  };

  const renderAiButton = (field: "short" | "long") => {
    const isLoading = aiLoadingField === field;
    const isMenuOpen = showAiMenu === field;

    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowAiMenu(isMenuOpen ? null : field)}
          disabled={isLoading}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-lg shadow-purple-600/20 transition hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          AI Improve
          <ChevronDown
            className={`h-3 w-3 transition ${isMenuOpen ? "rotate-180" : ""}`}
          />
        </button>
        {isMenuOpen && (
          <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border border-edge bg-card p-1 shadow-xl">
            {AI_ACTIONS.map((action) => (
              <button
                key={action.key}
                type="button"
                onClick={() => handleAiImprove(field, action.key)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-content-2 transition hover:bg-card-hover hover:text-content"
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderAiSuggestionPreview = (field: "short" | "long") => {
    if (!aiSuggestion || aiSuggestion.field !== field) return null;
    return (
      <div className="mt-2 rounded-xl border border-purple-500/30 bg-purple-500/5 p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-purple-400">
          <Sparkles className="h-3.5 w-3.5" /> AI Suggestion
        </div>
        <p className="mb-3 whitespace-pre-wrap text-sm text-content">
          {aiSuggestion.text}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={acceptAiSuggestion}
            className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-green-500"
          >
            <Check className="h-3.5 w-3.5" /> Accept
          </button>
          <button
            type="button"
            onClick={rejectAiSuggestion}
            className="flex items-center gap-1.5 rounded-lg bg-card px-3 py-1.5 text-xs font-medium text-content-3 ring-1 ring-edge transition hover:bg-card-hover hover:text-content"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Discard
          </button>
        </div>
      </div>
    );
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
            className="rounded-lg p-2 text-content-3 transition hover:bg-card-hover"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-content">Edit Project</h1>
            <div className="flex items-center gap-2 mt-0.5">
              {project.isVisible ? (
                <span className="flex items-center gap-1 text-xs text-green-400">
                  <Eye className="h-3 w-3" /> Visible on live CV
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-content-4">
                  <EyeOff className="h-3 w-3" /> Hidden from live CV
                </span>
              )}
            </div>
          </div>
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
        <div className="rounded-2xl border border-edge bg-card p-6">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-content-2">
                Title
              </label>
              <input
                value={project.title}
                onChange={(e) =>
                  setProject({ ...project, title: e.target.value })
                }
                className="w-full rounded-lg border border-edge bg-card text-content px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-sm font-medium text-content-2">
                  Short Description
                </label>
                {renderAiButton("short")}
              </div>
              <textarea
                value={project.description || ""}
                onChange={(e) =>
                  setProject({ ...project, description: e.target.value })
                }
                rows={3}
                placeholder="Brief overview of your project..."
                className="w-full rounded-lg border border-edge bg-card text-content px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
              {renderAiSuggestionPreview("short")}
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-sm font-medium text-content-2">
                  Full Description
                </label>
                {renderAiButton("long")}
              </div>
              <textarea
                value={project.longDescription || ""}
                onChange={(e) =>
                  setProject({ ...project, longDescription: e.target.value })
                }
                rows={6}
                placeholder="Detailed description of the project, your role, challenges, and outcomes..."
                className="w-full rounded-lg border border-edge bg-card text-content px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
              {renderAiSuggestionPreview("long")}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-content-2">
                  Live URL
                </label>
                <input
                  value={project.liveUrl || ""}
                  onChange={(e) =>
                    setProject({ ...project, liveUrl: e.target.value })
                  }
                  className="w-full rounded-lg border border-edge bg-card text-content px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-content-2">
                  Source URL
                </label>
                <input
                  value={project.sourceUrl || ""}
                  onChange={(e) =>
                    setProject({ ...project, sourceUrl: e.target.value })
                  }
                  className="w-full rounded-lg border border-edge bg-card text-content px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Technologies */}
        <div className="rounded-2xl border border-edge bg-card p-6">
          <h3 className="mb-4 font-semibold text-content">Technologies</h3>
          <div className="mb-3 flex gap-2">
            <input
              value={techInput}
              onChange={(e) => setTechInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && (e.preventDefault(), addTech())
              }
              placeholder="Add technology..."
              className="flex-1 rounded-lg border border-edge bg-card text-content px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={addTech}
              className="rounded-lg bg-card text-content-2 ring-1 ring-edge hover:bg-card-hover px-4 py-2 text-sm font-medium"
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
        <div className="rounded-2xl border border-edge bg-card p-6">
          <h3 className="mb-4 font-semibold text-content">Images</h3>
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
              className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-edge text-content-4 transition hover:border-indigo-500/50 hover:text-indigo-400"
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
        <div className="rounded-2xl border border-edge bg-card p-5">
          <h3 className="mb-4 font-semibold text-content">Settings</h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer rounded-lg px-3 py-2.5 transition hover:bg-card-hover">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500/10">
                  <Sparkles className="h-4 w-4 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-content">
                    Featured Project
                  </p>
                  <p className="text-xs text-content-3">
                    Highlight this project on your portfolio
                  </p>
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={project.isFeatured}
                  onChange={(e) =>
                    setProject({ ...project, isFeatured: e.target.checked })
                  }
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-card ring-1 ring-edge transition peer-checked:bg-indigo-600 peer-checked:ring-indigo-500" />
                <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
              </div>
            </label>
            <label className="flex items-center justify-between cursor-pointer rounded-lg px-3 py-2.5 transition hover:bg-card-hover">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${project.isVisible ? "bg-green-500/10" : "bg-content-4/10"}`}
                >
                  {project.isVisible ? (
                    <Eye className="h-4 w-4 text-green-400" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-content-4" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-content">
                    Show on Live CV
                  </p>
                  <p className="text-xs text-content-3">
                    Display this project on your public CV page
                  </p>
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={project.isVisible}
                  onChange={(e) =>
                    setProject({ ...project, isVisible: e.target.checked })
                  }
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-card ring-1 ring-edge transition peer-checked:bg-green-600 peer-checked:ring-green-500" />
                <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
