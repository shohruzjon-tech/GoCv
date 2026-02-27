"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { cvApi, pdfApi } from "@/lib/api";
import { Cv } from "@/types";
import {
  Save,
  Download,
  Globe,
  ArrowLeft,
  Sparkles,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  History,
} from "lucide-react";
import toast from "react-hot-toast";

export default function EditCvPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [cv, setCv] = useState<Cv | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCv();
  }, [id]);

  const loadCv = async () => {
    try {
      const res = await cvApi.getById(id);
      setCv(res.data);
    } catch {
      toast.error("Failed to load CV");
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!cv) return;
    setSaving(true);
    try {
      const res = await cvApi.update(cv._id, {
        title: cv.title,
        summary: cv.summary,
        sections: cv.sections,
        personalInfo: cv.personalInfo,
        theme: cv.theme,
        isPublic: cv.isPublic,
      });
      setCv(res.data);
      toast.success("CV saved!");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!cv) return;
    try {
      const res = await cvApi.publish(cv._id);
      setCv(res.data);
      toast.success("CV published!");
    } catch {
      toast.error("Failed to publish");
    }
  };

  const handleDownloadPdf = async () => {
    if (!cv) return;
    try {
      const res = await pdfApi.download(cv._id);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${cv.title || "cv"}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download PDF");
    }
  };

  const updatePersonalInfo = (field: string, value: string) => {
    if (!cv) return;
    setCv({
      ...cv,
      personalInfo: { ...cv.personalInfo, [field]: value },
    });
  };

  const updateSection = (index: number, updates: any) => {
    if (!cv) return;
    const sections = [...cv.sections];
    sections[index] = { ...sections[index], ...updates };
    setCv({ ...cv, sections });
  };

  const handleAiEditSection = async (sectionType: string) => {
    if (!cv) return;
    const prompt = window.prompt(
      `How would you like to edit the ${sectionType} section?`,
    );
    if (!prompt) return;
    setLoading(true);
    try {
      const res = await cvApi.aiEditSection(cv._id, { prompt, sectionType });
      setCv(res.data);
      toast.success("Section updated!");
    } catch {
      toast.error("Failed to update section");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!cv) return null;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-lg p-2 text-content-3 transition hover:bg-card-hover"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <input
              value={cv.title}
              onChange={(e) => setCv({ ...cv, title: e.target.value })}
              className="bg-transparent text-2xl font-bold text-content focus:outline-none"
            />
            <p className="text-sm text-content-3">Edit your CV details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg border border-edge px-4 py-2 text-sm font-medium text-content-2 transition hover:bg-card-hover disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={() => router.push(`/dashboard/cv/${id}/versions`)}
            className="flex items-center gap-2 rounded-lg border border-edge px-4 py-2 text-sm font-medium text-content-2 transition hover:bg-card-hover"
          >
            <History className="h-4 w-4" />
            History
          </button>
          <button
            onClick={handlePublish}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 shadow-lg shadow-emerald-600/25"
          >
            <Globe className="h-4 w-4" />
            Publish
          </button>
          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-500 shadow-lg shadow-purple-600/25"
          >
            <Download className="h-4 w-4" />
            PDF
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Editor Panel */}
        <div className="space-y-6">
          {/* Personal Info */}
          <div className="rounded-2xl border border-edge bg-card p-6">
            <h3 className="mb-4 text-lg font-semibold text-content">
              Personal Information
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                "fullName",
                "email",
                "phone",
                "location",
                "website",
                "linkedin",
                "github",
              ].map((field) => (
                <div key={field}>
                  <label className="mb-1 block text-xs font-medium uppercase text-content-3">
                    {field.replace(/([A-Z])/g, " $1").trim()}
                  </label>
                  <input
                    value={(cv.personalInfo as any)?.[field] || ""}
                    onChange={(e) => updatePersonalInfo(field, e.target.value)}
                    className="w-full rounded-lg border border-edge bg-card px-3 py-2 text-sm text-content focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-2xl border border-edge bg-card p-6">
            <h3 className="mb-4 text-lg font-semibold text-content">Summary</h3>
            <textarea
              value={cv.summary || ""}
              onChange={(e) => setCv({ ...cv, summary: e.target.value })}
              rows={4}
              className="w-full rounded-lg border border-edge bg-card px-3 py-2 text-sm text-content focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Sections */}
          {cv.sections?.map((section, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-edge bg-card p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-content">
                  {section.title}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      updateSection(idx, { visible: !section.visible })
                    }
                    className="rounded-lg p-1.5 text-content-3 hover:text-content-2"
                    title={section.visible ? "Hide" : "Show"}
                  >
                    {section.visible ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleAiEditSection(section.type)}
                    className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-indigo-400 transition hover:bg-indigo-500/10"
                  >
                    <Sparkles className="h-3 w-3" /> AI Edit
                  </button>
                </div>
              </div>
              <pre className="max-h-40 overflow-auto rounded-lg bg-card p-3 text-xs text-content-2 ring-1 ring-edge">
                {JSON.stringify(section.content, null, 2)}
              </pre>
            </div>
          ))}
        </div>

        {/* Preview Panel */}
        <div className="sticky top-24">
          <h3 className="mb-3 text-lg font-semibold text-content">Preview</h3>
          <div className="overflow-hidden rounded-2xl border border-edge bg-white">
            {cv.aiGeneratedHtml ? (
              <iframe
                srcDoc={cv.aiGeneratedHtml}
                className="h-[800px] w-full"
                title="CV Preview"
              />
            ) : (
              <div className="flex h-96 items-center justify-center text-content-4">
                No HTML preview available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
