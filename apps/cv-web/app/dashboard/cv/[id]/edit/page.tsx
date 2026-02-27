"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { cvApi, pdfApi } from "@/lib/api";
import { Cv } from "@/types";
import {
  Save,
  Download,
  Globe,
  ArrowLeft,
  Sparkles,
  Eye,
  EyeOff,
  History,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Loader2,
  Share2,
  Palette,
  User,
  FileText,
  Monitor,
  Smartphone,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

type EditorTab = "content" | "preview";

export default function EditCvPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [cv, setCv] = useState<Cv | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [activeTab, setActiveTab] = useState<EditorTab>("content");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">(
    "desktop",
  );
  const [expandedSections, setExpandedSections] = useState<
    Record<number, boolean>
  >({});
  const [slugCopied, setSlugCopied] = useState(false);
  const [showPublishSuccess, setShowPublishSuccess] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    loadCv();
  }, [id]);

  const loadCv = async () => {
    try {
      const res = await cvApi.getById(id);
      setCv(res.data);
      const expanded: Record<number, boolean> = {};
      res.data.sections?.forEach((_: any, i: number) => {
        expanded[i] = true;
      });
      setExpandedSections(expanded);
    } catch (err: any) {
      if (err.response?.status === 403) {
        toast.error("You don\u2019t have permission to edit this CV");
      } else {
        toast.error("Failed to load CV");
      }
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
      toast.success("All changes saved!");
    } catch (err: any) {
      if (err.response?.status === 403) {
        toast.error("Permission denied. Please re-login and try again.");
      } else {
        toast.error("Failed to save changes");
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!cv) return;
    setPublishing(true);
    try {
      const res = await cvApi.publish(cv._id);
      setCv(res.data);
      setShowPublishSuccess(true);
      toast.success("CV published! It\u2019s now live.");
      setTimeout(() => setShowPublishSuccess(false), 5000);
    } catch (err: any) {
      if (err.response?.status === 403) {
        toast.error("Permission denied. Please re-login and try again.");
      } else {
        toast.error("Failed to publish CV");
      }
    } finally {
      setPublishing(false);
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
      toast.success("PDF downloaded!");
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
      `How would you like to edit the "${sectionType}" section?`,
    );
    if (!prompt) return;
    setLoading(true);
    try {
      const res = await cvApi.aiEditSection(cv._id, { prompt, sectionType });
      setCv(res.data);
      toast.success("Section updated with AI!");
    } catch (err: any) {
      if (err.response?.status === 403) {
        toast.error("Permission denied. Please re-login and try again.");
      } else {
        toast.error("Failed to update section");
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (index: number) => {
    setExpandedSections((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const copySlugUrl = () => {
    if (!cv?.slug) return;
    navigator.clipboard.writeText(`${window.location.origin}/cv/${cv.slug}`);
    setSlugCopied(true);
    setTimeout(() => setSlugCopied(false), 2000);
  };

  // ── Loading ──

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 ring-1 ring-indigo-500/20">
            <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
          </div>
          <p className="text-sm font-medium text-content-2">
            Loading your CV...
          </p>
        </div>
      </div>
    );
  }

  if (!cv) return null;

  const personalFields = [
    { key: "fullName", label: "Full Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "location", label: "Location" },
    { key: "website", label: "Website" },
    { key: "linkedin", label: "LinkedIn" },
    { key: "github", label: "GitHub" },
  ];

  return (
    <div className="pb-20 sm:pb-8">
      {/* ── Top Bar ── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex-shrink-0 rounded-xl p-2.5 text-content-3 transition hover:bg-card-hover hover:text-content"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <input
              value={cv.title}
              onChange={(e) => setCv({ ...cv, title: e.target.value })}
              className="w-full bg-transparent text-xl font-bold text-content focus:outline-none sm:text-2xl"
              placeholder="Untitled CV"
            />
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${
                  cv.status === "published"
                    ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                    : cv.status === "archived"
                      ? "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20"
                      : "bg-content-4/10 text-content-3 ring-1 ring-edge"
                }`}
              >
                {cv.status === "published" && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                )}
                {cv.status.charAt(0).toUpperCase() + cv.status.slice(1)}
              </span>
              {cv.slug && cv.isPublic && (
                <button
                  onClick={copySlugUrl}
                  className="inline-flex items-center gap-1 text-xs text-indigo-400 transition hover:text-indigo-300"
                >
                  {slugCopied ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  {slugCopied ? "Copied!" : "Copy link"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl border border-edge bg-card px-3 py-2.5 text-sm font-medium text-content-2 transition hover:bg-card-hover disabled:opacity-50 sm:px-4"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {saving ? "Saving..." : "Save"}
            </span>
          </button>
          <button
            onClick={() => router.push(`/dashboard/cv/${id}/versions`)}
            className="inline-flex items-center gap-2 rounded-xl border border-edge bg-card px-3 py-2.5 text-sm font-medium text-content-2 transition hover:bg-card-hover sm:px-4"
          >
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">History</span>
          </button>
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:shadow-emerald-500/30 disabled:opacity-50 sm:px-4"
          >
            {publishing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Globe className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {publishing ? "Publishing..." : "Publish"}
            </span>
          </button>
          <button
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-600/20 transition hover:shadow-purple-500/30 sm:px-4"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">PDF</span>
          </button>
        </div>
      </div>

      {/* ── Publish Success Banner ── */}
      {showPublishSuccess && cv.slug && (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 sm:flex-row sm:items-center sm:justify-between animate-fade-up">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
              <Globe className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-content">
                CV Published Successfully!
              </p>
              <p className="text-xs text-content-3">
                Your CV is now live and accessible to anyone with the link
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/cv/${cv.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-500"
            >
              <ExternalLink className="h-3 w-3" />
              View Live
            </a>
            <button
              onClick={copySlugUrl}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 px-3 py-1.5 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/10"
            >
              {slugCopied ? (
                <Check className="h-3 w-3" />
              ) : (
                <Share2 className="h-3 w-3" />
              )}
              {slugCopied ? "Copied!" : "Copy Link"}
            </button>
            <button
              onClick={() => setShowPublishSuccess(false)}
              className="rounded-lg p-1.5 text-content-4 transition hover:text-content-2"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── Mobile Tab Switcher ── */}
      <div className="mb-6 flex gap-1 rounded-2xl border border-edge bg-card p-1 lg:hidden">
        <button
          onClick={() => setActiveTab("content")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
            activeTab === "content"
              ? "bg-indigo-600/10 text-indigo-400 ring-1 ring-indigo-500/20"
              : "text-content-3 hover:text-content"
          }`}
        >
          <FileText className="h-4 w-4" />
          Editor
        </button>
        <button
          onClick={() => setActiveTab("preview")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
            activeTab === "preview"
              ? "bg-indigo-600/10 text-indigo-400 ring-1 ring-indigo-500/20"
              : "text-content-3 hover:text-content"
          }`}
        >
          <Eye className="h-4 w-4" />
          Preview
        </button>
      </div>

      {/* ── Two-Column Layout ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Editor Panel ── */}
        <div
          className={`space-y-5 ${activeTab === "preview" ? "hidden lg:block" : ""}`}
        >
          {/* Personal Information */}
          <div className="rounded-2xl border border-edge bg-card overflow-hidden">
            <div className="flex items-center gap-3 border-b border-edge bg-card/50 px-5 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20">
                <User className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-content">
                  Personal Information
                </h3>
                <p className="text-xs text-content-4">
                  Contact details &amp; social links
                </p>
              </div>
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              {personalFields.map(({ key, label }) => (
                <div key={key}>
                  <label className="mb-1 block text-xs font-medium text-content-3">
                    {label}
                  </label>
                  <input
                    value={(cv.personalInfo as any)?.[key] || ""}
                    onChange={(e) => updatePersonalInfo(key, e.target.value)}
                    placeholder={label}
                    className="w-full rounded-xl border border-edge bg-field px-3 py-2.5 text-sm text-content placeholder:text-content-4 focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-2xl border border-edge bg-card overflow-hidden">
            <div className="flex items-center gap-3 border-b border-edge bg-card/50 px-5 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20">
                <FileText className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-content">
                Professional Summary
              </h3>
            </div>
            <div className="p-5">
              <textarea
                value={cv.summary || ""}
                onChange={(e) => setCv({ ...cv, summary: e.target.value })}
                rows={4}
                placeholder="Write a compelling professional summary..."
                className="w-full resize-none rounded-xl border border-edge bg-field px-4 py-3 text-sm text-content placeholder:text-content-4 focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
              />
            </div>
          </div>

          {/* Theme Settings */}
          <div className="rounded-2xl border border-edge bg-card overflow-hidden">
            <div className="flex items-center gap-3 border-b border-edge bg-card/50 px-5 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20">
                <Palette className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-content">
                Theme &amp; Style
              </h3>
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-content-3">
                  Primary Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={cv.theme?.primaryColor || "#4f46e5"}
                    onChange={(e) =>
                      setCv({
                        ...cv,
                        theme: { ...cv.theme, primaryColor: e.target.value },
                      })
                    }
                    className="h-10 w-10 cursor-pointer rounded-lg border border-edge bg-transparent"
                  />
                  <input
                    value={cv.theme?.primaryColor || "#4f46e5"}
                    onChange={(e) =>
                      setCv({
                        ...cv,
                        theme: { ...cv.theme, primaryColor: e.target.value },
                      })
                    }
                    className="flex-1 rounded-xl border border-edge bg-field px-3 py-2.5 text-sm text-content focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-content-3">
                  Font Family
                </label>
                <select
                  value={cv.theme?.fontFamily || "Inter"}
                  onChange={(e) =>
                    setCv({
                      ...cv,
                      theme: { ...cv.theme, fontFamily: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-edge bg-field px-3 py-2.5 text-sm text-content focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                >
                  {[
                    "Inter",
                    "Roboto",
                    "Open Sans",
                    "Lato",
                    "Merriweather",
                    "Georgia",
                    "Playfair Display",
                  ].map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-content-3">
                  Layout
                </label>
                <select
                  value={cv.theme?.layout || "modern"}
                  onChange={(e) =>
                    setCv({
                      ...cv,
                      theme: { ...cv.theme, layout: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-edge bg-field px-3 py-2.5 text-sm text-content focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                >
                  {["modern", "classic", "minimal", "creative"].map((l) => (
                    <option key={l} value={l}>
                      {l.charAt(0).toUpperCase() + l.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Sections */}
          {cv.sections?.map((section, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-edge bg-card overflow-hidden"
            >
              <button
                onClick={() => toggleSection(idx)}
                className="flex w-full items-center justify-between border-b border-edge bg-card/50 px-5 py-4 transition hover:bg-card-hover"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/20">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-semibold text-content">
                      {section.title}
                    </h3>
                    <span className="text-xs text-content-4">
                      {section.type}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                      section.visible
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-content-4/10 text-content-4"
                    }`}
                  >
                    {section.visible ? "Visible" : "Hidden"}
                  </span>
                  {expandedSections[idx] ? (
                    <ChevronUp className="h-4 w-4 text-content-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-content-4" />
                  )}
                </div>
              </button>

              {expandedSections[idx] && (
                <div className="p-5">
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() =>
                        updateSection(idx, { visible: !section.visible })
                      }
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        section.visible
                          ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                          : "bg-content-4/10 text-content-4 hover:bg-content-4/20"
                      }`}
                    >
                      {section.visible ? (
                        <Eye className="h-3 w-3" />
                      ) : (
                        <EyeOff className="h-3 w-3" />
                      )}
                      {section.visible ? "Visible" : "Hidden"}
                    </button>
                    <button
                      onClick={() => handleAiEditSection(section.type)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600/10 to-purple-600/10 px-3 py-1.5 text-xs font-medium text-indigo-400 ring-1 ring-indigo-500/20 transition hover:from-indigo-600/20 hover:to-purple-600/20"
                    >
                      <Sparkles className="h-3 w-3" />
                      AI Edit
                    </button>
                  </div>
                  <div className="max-h-60 overflow-auto rounded-xl bg-field p-4 ring-1 ring-edge">
                    <pre className="whitespace-pre-wrap text-xs leading-relaxed text-content-2">
                      {JSON.stringify(section.content, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Preview Panel ── */}
        <div className={`${activeTab === "content" ? "hidden lg:block" : ""}`}>
          <div className="sticky top-24">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-content">
                Live Preview
              </h3>
              <div className="flex items-center gap-1 rounded-lg border border-edge bg-card p-0.5">
                <button
                  onClick={() => setPreviewDevice("desktop")}
                  className={`rounded-md p-1.5 transition ${
                    previewDevice === "desktop"
                      ? "bg-indigo-600/10 text-indigo-400"
                      : "text-content-4 hover:text-content-2"
                  }`}
                  title="Desktop preview"
                >
                  <Monitor className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setPreviewDevice("mobile")}
                  className={`rounded-md p-1.5 transition ${
                    previewDevice === "mobile"
                      ? "bg-indigo-600/10 text-indigo-400"
                      : "text-content-4 hover:text-content-2"
                  }`}
                  title="Mobile preview"
                >
                  <Smartphone className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div
              className={`mx-auto overflow-hidden rounded-2xl border border-edge bg-white shadow-xl shadow-black/5 transition-all duration-300 ${
                previewDevice === "mobile" ? "max-w-[375px]" : "w-full"
              }`}
            >
              {cv.aiGeneratedHtml ? (
                <iframe
                  ref={iframeRef}
                  srcDoc={cv.aiGeneratedHtml}
                  className={`w-full transition-all duration-300 ${
                    previewDevice === "mobile" ? "h-[667px]" : "h-[800px]"
                  }`}
                  title="CV Preview"
                />
              ) : (
                <div className="flex h-80 flex-col items-center justify-center text-center p-8">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-content-4/10 ring-1 ring-edge">
                    <FileText className="h-6 w-6 text-content-4" />
                  </div>
                  <p className="mb-1 text-sm font-medium text-content-2">
                    No preview available
                  </p>
                  <p className="text-xs text-content-4">
                    Use AI Edit on a section to regenerate the HTML preview
                  </p>
                </div>
              )}
            </div>

            {cv.slug && cv.isPublic && (
              <div className="mt-4 flex items-center gap-2">
                <a
                  href={`/cv/${cv.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-edge bg-card px-4 py-2.5 text-xs font-medium text-content-2 transition hover:bg-card-hover"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View Public Page
                </a>
                <button
                  onClick={copySlugUrl}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-edge bg-card px-4 py-2.5 text-xs font-medium text-content-2 transition hover:bg-card-hover"
                >
                  {slugCopied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {slugCopied ? "Copied!" : "Copy Share Link"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Floating Save (mobile) ── */}
      <div className="fixed bottom-6 left-4 right-4 z-40 sm:hidden">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3.5 text-sm font-semibold text-white shadow-xl shadow-indigo-600/30 transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
