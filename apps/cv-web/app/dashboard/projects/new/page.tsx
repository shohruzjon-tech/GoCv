"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { projectsApi, aiApi } from "@/lib/api";
import {
  ArrowLeft,
  Upload,
  X,
  Plus,
  Sparkles,
  Wand2,
  Briefcase,
  Code2,
  Minimize2,
  Check,
  RotateCcw,
  Loader2,
  ChevronDown,
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

export default function NewProjectPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    longDescription: "",
    technologies: [] as string[],
    liveUrl: "",
    sourceUrl: "",
    startDate: "",
    endDate: "",
    isFeatured: false,
    isVisible: true,
  });
  const [techInput, setTechInput] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // AI state
  const [aiLoadingField, setAiLoadingField] = useState<"short" | "long" | null>(
    null,
  );
  const [aiSuggestion, setAiSuggestion] = useState<{
    field: "short" | "long";
    text: string;
  } | null>(null);
  const [showAiMenu, setShowAiMenu] = useState<"short" | "long" | null>(null);

  const addTech = () => {
    if (techInput.trim() && !form.technologies.includes(techInput.trim())) {
      setForm({
        ...form,
        technologies: [...form.technologies, techInput.trim()],
      });
      setTechInput("");
    }
  };

  const removeTech = (tech: string) => {
    setForm({
      ...form,
      technologies: form.technologies.filter((t) => t !== tech),
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPreviews((prev) => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (idx: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAiImprove = async (field: "short" | "long", action: AiAction) => {
    const currentText =
      field === "short" ? form.description : form.longDescription;
    if (!form.title.trim() && !currentText.trim()) {
      toast.error("Add a project title or some text first");
      return;
    }
    setAiLoadingField(field);
    setShowAiMenu(null);
    try {
      const res = await aiApi.improveProjectDescription(
        form.title,
        currentText,
        field,
        form.technologies,
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
    if (!aiSuggestion) return;
    if (aiSuggestion.field === "short") {
      setForm({ ...form, description: aiSuggestion.text });
    } else {
      setForm({ ...form, longDescription: aiSuggestion.text });
    }
    setAiSuggestion(null);
    toast.success("AI suggestion applied!");
  };

  const rejectAiSuggestion = () => {
    setAiSuggestion(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }

    setLoading(true);
    try {
      const res = await projectsApi.create(form);
      const projectId = res.data._id;

      if (selectedFiles.length > 0) {
        const formData = new FormData();
        selectedFiles.forEach((f) => formData.append("files", f));
        await projectsApi.addImages(projectId, formData);
      }

      toast.success("Project created!");
      router.push("/dashboard/projects");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create project");
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="rounded-lg p-2 text-content-3 transition hover:bg-card-hover"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-content">New Project</h1>
          <p className="text-sm text-content-3">
            Add a project to your portfolio
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-edge bg-card p-6">
          <h3 className="mb-4 font-semibold text-content">Project Details</h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-content-2">
                Title *
              </label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-lg border border-edge bg-card px-4 py-2 text-sm text-content focus:border-indigo-500 focus:outline-none"
                required
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
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={2}
                placeholder="Brief overview of your project..."
                className="w-full rounded-lg border border-edge bg-card px-4 py-2 text-sm text-content focus:border-indigo-500 focus:outline-none"
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
                value={form.longDescription}
                onChange={(e) =>
                  setForm({ ...form, longDescription: e.target.value })
                }
                rows={5}
                placeholder="Detailed description of the project, your role, challenges, and outcomes..."
                className="w-full rounded-lg border border-edge bg-card px-4 py-2 text-sm text-content focus:border-indigo-500 focus:outline-none"
              />
              {renderAiSuggestionPreview("long")}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-content-2">
                  Live URL
                </label>
                <input
                  value={form.liveUrl}
                  onChange={(e) =>
                    setForm({ ...form, liveUrl: e.target.value })
                  }
                  className="w-full rounded-lg border border-edge bg-card px-4 py-2 text-sm text-content focus:border-indigo-500 focus:outline-none"
                  placeholder="https://"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-content-2">
                  Source Code URL
                </label>
                <input
                  value={form.sourceUrl}
                  onChange={(e) =>
                    setForm({ ...form, sourceUrl: e.target.value })
                  }
                  className="w-full rounded-lg border border-edge bg-card px-4 py-2 text-sm text-content focus:border-indigo-500 focus:outline-none"
                  placeholder="https://github.com/..."
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-content-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                  className="w-full rounded-lg border border-edge bg-card px-4 py-2 text-sm text-content focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-content-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm({ ...form, endDate: e.target.value })
                  }
                  className="w-full rounded-lg border border-edge bg-card px-4 py-2 text-sm text-content focus:border-indigo-500 focus:outline-none"
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
              className="flex-1 rounded-lg border border-edge bg-card px-4 py-2 text-sm text-content focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={addTech}
              className="rounded-lg bg-card px-4 py-2 text-sm font-medium text-content-2 ring-1 ring-edge transition hover:bg-card-hover"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.technologies.map((tech) => (
              <span
                key={tech}
                className="flex items-center gap-1 rounded-full bg-indigo-500/10 px-3 py-1 text-sm text-indigo-400 ring-1 ring-indigo-500/20"
              >
                {tech}
                <button type="button" onClick={() => removeTech(tech)}>
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
            {previews.map((preview, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={preview}
                  alt=""
                  className="h-32 w-full rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="absolute top-1 right-1 rounded-full bg-red-600 p-1 text-white opacity-0 transition group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <button
              type="button"
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
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <label className="flex items-center gap-2 text-sm text-content-2">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) =>
                  setForm({ ...form, isFeatured: e.target.checked })
                }
                className="rounded border-white/20"
              />
              Featured project
            </label>
            <label className="flex items-center gap-2 text-sm text-content-2">
              <input
                type="checkbox"
                checked={form.isVisible}
                onChange={(e) =>
                  setForm({ ...form, isVisible: e.target.checked })
                }
                className="rounded border-white/20"
              />
              Show on live CV
            </label>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-8 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Project"}
          </button>
        </div>
      </form>
    </div>
  );
}
