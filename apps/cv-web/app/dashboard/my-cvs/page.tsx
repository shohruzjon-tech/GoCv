"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuthStore, useSubscriptionStore } from "@/lib/store";
import { cvApi, pdfApi } from "@/lib/api";
import { Cv } from "@/types";
import {
  FileText,
  Globe,
  Edit,
  Trash2,
  Download,
  ExternalLink,
  Clock,
  Sparkles,
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  Eye,
  MoreVertical,
  Copy,
  Archive,
  Star,
  TrendingUp,
  Calendar,
  Tag,
  ChevronDown,
  Loader2,
  AlertCircle,
  CheckCircle2,
  PenLine,
} from "lucide-react";
import toast from "react-hot-toast";

type ViewMode = "grid" | "list";
type SortOption = "newest" | "oldest" | "name" | "status";
type FilterStatus = "all" | "draft" | "published" | "archived";

export default function MyCvsPage() {
  const { user } = useAuthStore();
  const { subscription } = useSubscriptionStore();
  const [cvs, setCvs] = useState<Cv[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    loadCvs();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClick = () => setOpenMenuId(null);
    if (openMenuId) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [openMenuId]);

  const loadCvs = async () => {
    try {
      const res = await cvApi.getAll();
      setCvs(res.data);
    } catch {
      toast.error("Failed to load CVs");
    } finally {
      setLoading(false);
    }
  };

  const deleteCv = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this CV? This action cannot be undone.",
      )
    )
      return;
    setDeletingId(id);
    try {
      await cvApi.delete(id);
      setCvs((prev) => prev.filter((cv) => cv._id !== id));
      toast.success("CV deleted successfully");
    } catch {
      toast.error("Failed to delete CV");
    } finally {
      setDeletingId(null);
    }
  };

  const downloadPdf = async (cv: Cv) => {
    setDownloadingId(cv._id);
    try {
      const res = await pdfApi.download(cv._id);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${cv.title || "cv"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded!");
    } catch {
      toast.error("Failed to download PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  const duplicateCv = async (cv: Cv) => {
    try {
      const {
        _id,
        userId,
        createdAt,
        updatedAt,
        slug,
        isPublic,
        publicUrl,
        status,
        ...data
      } = cv;
      await cvApi.create({
        ...data,
        title: `${cv.title} (Copy)`,
        status: "draft",
      });
      await loadCvs();
      toast.success("CV duplicated!");
    } catch {
      toast.error("Failed to duplicate CV");
    }
  };

  // Filtering, searching, sorting
  const filteredCvs = useMemo(() => {
    let result = [...cvs];

    // Filter by status
    if (filterStatus !== "all") {
      result = result.filter((cv) => cv.status === filterStatus);
    }

    // Search by title or summary
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (cv) =>
          cv.title.toLowerCase().includes(q) ||
          cv.summary?.toLowerCase().includes(q) ||
          cv.targetRole?.toLowerCase().includes(q),
      );
    }

    // Sort
    switch (sortBy) {
      case "newest":
        result.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );
        break;
      case "oldest":
        result.sort(
          (a, b) =>
            new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
        );
        break;
      case "name":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "status":
        const statusOrder = { published: 0, draft: 1, archived: 2 };
        result.sort(
          (a, b) => (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3),
        );
        break;
    }

    return result;
  }, [cvs, filterStatus, searchQuery, sortBy]);

  const stats = useMemo(
    () => ({
      total: cvs.length,
      published: cvs.filter((c) => c.status === "published").length,
      draft: cvs.filter((c) => c.status === "draft").length,
      archived: cvs.filter((c) => c.status === "archived").length,
    }),
    [cvs],
  );

  const maxCvs = subscription?.limits?.maxCvs ?? 3;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-content sm:text-2xl">My CVs</h1>
          <p className="mt-1 text-sm text-content-3">
            Manage, edit, and share your professional CVs
          </p>
        </div>
        <Link
          href="/dashboard/cv/generate"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-500 hover:shadow-xl hover:shadow-indigo-600/30 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Create New CV
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          onClick={() => setFilterStatus("all")}
          className={`group rounded-2xl border p-4 text-left transition-all ${
            filterStatus === "all"
              ? "border-indigo-500/30 bg-indigo-500/5 shadow-lg shadow-indigo-500/5"
              : "border-edge bg-card hover:border-indigo-500/20 hover:bg-card-hover"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                filterStatus === "all"
                  ? "bg-indigo-500/15 text-indigo-400"
                  : "bg-indigo-500/10 text-indigo-400/70"
              }`}
            >
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-content">{stats.total}</p>
              <p className="text-[11px] font-medium text-content-3">All CVs</p>
            </div>
          </div>
          {maxCvs !== Infinity && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-[10px] text-content-4">
                <span>
                  {stats.total} / {maxCvs}
                </span>
                <span>{Math.round((stats.total / maxCvs) * 100)}%</span>
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-edge">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all"
                  style={{
                    width: `${Math.min(100, (stats.total / maxCvs) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </button>

        <button
          onClick={() => setFilterStatus("published")}
          className={`group rounded-2xl border p-4 text-left transition-all ${
            filterStatus === "published"
              ? "border-emerald-500/30 bg-emerald-500/5 shadow-lg shadow-emerald-500/5"
              : "border-edge bg-card hover:border-emerald-500/20 hover:bg-card-hover"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                filterStatus === "published"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-emerald-500/10 text-emerald-400/70"
              }`}
            >
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-content">
                {stats.published}
              </p>
              <p className="text-[11px] font-medium text-content-3">
                Published
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setFilterStatus("draft")}
          className={`group rounded-2xl border p-4 text-left transition-all ${
            filterStatus === "draft"
              ? "border-amber-500/30 bg-amber-500/5 shadow-lg shadow-amber-500/5"
              : "border-edge bg-card hover:border-amber-500/20 hover:bg-card-hover"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                filterStatus === "draft"
                  ? "bg-amber-500/15 text-amber-400"
                  : "bg-amber-500/10 text-amber-400/70"
              }`}
            >
              <PenLine className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-content">{stats.draft}</p>
              <p className="text-[11px] font-medium text-content-3">Drafts</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setFilterStatus("archived")}
          className={`group rounded-2xl border p-4 text-left transition-all ${
            filterStatus === "archived"
              ? "border-slate-500/30 bg-slate-500/5 shadow-lg shadow-slate-500/5"
              : "border-edge bg-card hover:border-edge hover:bg-card-hover"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                filterStatus === "archived"
                  ? "bg-slate-500/15 text-slate-400"
                  : "bg-slate-500/10 text-slate-400/70"
              }`}
            >
              <Archive className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-content">
                {stats.archived}
              </p>
              <p className="text-[11px] font-medium text-content-3">Archived</p>
            </div>
          </div>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-4" />
          <input
            type="text"
            placeholder="Search CVs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-edge bg-field py-2.5 pl-10 pr-4 text-sm text-content placeholder:text-content-4 focus:border-indigo-500/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="appearance-none rounded-xl border border-edge bg-card py-2 pl-3 pr-8 text-xs font-medium text-content-2 transition hover:bg-card-hover focus:border-indigo-500/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name A–Z</option>
              <option value="status">By Status</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-content-4" />
          </div>

          {/* View toggle */}
          <div className="flex items-center overflow-hidden rounded-xl border border-edge">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 transition ${
                viewMode === "grid"
                  ? "bg-indigo-500/10 text-indigo-400"
                  : "text-content-4 hover:bg-card-hover hover:text-content-2"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 transition ${
                viewMode === "list"
                  ? "bg-indigo-500/10 text-indigo-400"
                  : "text-content-4 hover:bg-card-hover hover:text-content-2"
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {filteredCvs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-edge p-12 text-center sm:p-16">
          {cvs.length === 0 ? (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10">
                <FileText className="h-8 w-8 text-indigo-400" />
              </div>
              <h3 className="mb-2 text-base font-semibold text-content">
                Create your first CV
              </h3>
              <p className="mx-auto mb-6 max-w-sm text-sm text-content-3">
                Use our AI-powered builder to create a professional CV in
                minutes. Stand out from the crowd.
              </p>
              <Link
                href="/dashboard/cv/generate"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-500 hover:shadow-xl"
              >
                <Sparkles className="h-4 w-4" /> Generate with AI
              </Link>
            </>
          ) : (
            <>
              <Search className="mx-auto mb-3 h-8 w-8 text-content-4" />
              <p className="text-sm font-medium text-content-2">
                No CVs match your filters
              </p>
              <p className="mt-1 text-xs text-content-3">
                Try adjusting your search or filter criteria
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilterStatus("all");
                }}
                className="mt-4 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition"
              >
                Clear all filters
              </button>
            </>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredCvs.map((cv) => (
            <CvCard
              key={cv._id}
              cv={cv}
              onDelete={deleteCv}
              onDownload={downloadPdf}
              onDuplicate={duplicateCv}
              downloadingId={downloadingId}
              deletingId={deletingId}
              openMenuId={openMenuId}
              setOpenMenuId={setOpenMenuId}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredCvs.map((cv) => (
            <CvListItem
              key={cv._id}
              cv={cv}
              onDelete={deleteCv}
              onDownload={downloadPdf}
              onDuplicate={duplicateCv}
              downloadingId={downloadingId}
              deletingId={deletingId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────
   Premium CV Card (Grid View)
   ──────────────────────────────────────────── */

function CvCard({
  cv,
  onDelete,
  onDownload,
  onDuplicate,
  downloadingId,
  deletingId,
  openMenuId,
  setOpenMenuId,
}: {
  cv: Cv;
  onDelete: (id: string) => void;
  onDownload: (cv: Cv) => void;
  onDuplicate: (cv: Cv) => void;
  downloadingId: string | null;
  deletingId: string | null;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
}) {
  const isDownloading = downloadingId === cv._id;
  const isDeleting = deletingId === cv._id;
  const sections = cv.sections?.length ?? 0;
  const completionScore = getCompletionScore(cv);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-edge bg-card transition-all duration-300 hover:border-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/5">
      {/* Gradient accent top bar */}
      <div
        className={`h-1 w-full ${
          cv.status === "published"
            ? "bg-gradient-to-r from-emerald-500 to-teal-400"
            : cv.status === "draft"
              ? "bg-gradient-to-r from-amber-500 to-orange-400"
              : "bg-gradient-to-r from-slate-500 to-slate-400"
        }`}
      />

      {/* Card Body */}
      <div className="p-5">
        {/* Header Row */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[15px] font-bold text-content group-hover:text-indigo-400 transition-colors">
              {cv.title}
            </h3>
            <div className="mt-1.5 flex items-center gap-3 text-xs text-content-3">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(cv.updatedAt || cv.createdAt).toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  },
                )}
              </span>
              {cv.metadata?.viewCount !== undefined &&
                cv.metadata.viewCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {cv.metadata.viewCount}
                  </span>
                )}
            </div>
          </div>

          {/* Status Badge */}
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              cv.status === "published"
                ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/25"
                : cv.status === "draft"
                  ? "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/25"
                  : "bg-slate-500/10 text-slate-400 ring-1 ring-slate-500/25"
            }`}
          >
            {cv.status === "published" && (
              <CheckCircle2 className="mr-1 inline h-3 w-3" />
            )}
            {cv.status === "draft" && (
              <PenLine className="mr-1 inline h-3 w-3" />
            )}
            {cv.status === "archived" && (
              <Archive className="mr-1 inline h-3 w-3" />
            )}
            {cv.status.charAt(0).toUpperCase() + cv.status.slice(1)}
          </span>
        </div>

        {/* Summary */}
        <p className="mb-4 text-xs leading-relaxed text-content-3 line-clamp-2">
          {cv.summary || cv.targetRole || "No summary added yet"}
        </p>

        {/* Tags / Meta */}
        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          {cv.targetRole && (
            <span className="flex items-center gap-1 rounded-lg bg-indigo-500/8 px-2 py-0.5 text-[10px] font-medium text-indigo-400 ring-1 ring-indigo-500/15">
              <TrendingUp className="h-2.5 w-2.5" />
              {cv.targetRole}
            </span>
          )}
          {cv.tags?.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-lg bg-card-hover px-2 py-0.5 text-[10px] font-medium text-content-3 ring-1 ring-edge"
            >
              {tag}
            </span>
          ))}
          {(cv.tags?.length ?? 0) > 2 && (
            <span className="text-[10px] text-content-4">
              +{(cv.tags?.length ?? 0) - 2}
            </span>
          )}
        </div>

        {/* Completion Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-medium text-content-3">Completion</span>
            <span
              className={`font-bold ${
                completionScore >= 80
                  ? "text-emerald-400"
                  : completionScore >= 50
                    ? "text-amber-400"
                    : "text-red-400"
              }`}
            >
              {completionScore}%
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-edge">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                completionScore >= 80
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                  : completionScore >= 50
                    ? "bg-gradient-to-r from-amber-500 to-orange-400"
                    : "bg-gradient-to-r from-red-500 to-pink-400"
              }`}
              style={{ width: `${completionScore}%` }}
            />
          </div>
        </div>

        {/* Sections count */}
        <div className="mb-4 flex items-center gap-2 text-[11px] text-content-4">
          <FileText className="h-3 w-3" />
          {sections} section{sections !== 1 ? "s" : ""}
          {cv.metadata?.totalAiEdits ? (
            <>
              <span className="text-content-4">·</span>
              <Sparkles className="h-3 w-3 text-indigo-400" />
              <span className="text-indigo-400">
                {cv.metadata.totalAiEdits} AI edits
              </span>
            </>
          ) : null}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/cv/${cv._id}/edit`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600/10 py-2.5 text-xs font-semibold text-indigo-400 ring-1 ring-indigo-500/20 transition-all hover:bg-indigo-600/20 hover:ring-indigo-500/30"
          >
            <Edit className="h-3.5 w-3.5" /> Edit
          </Link>

          {cv.isPublic && cv.slug ? (
            <Link
              href={`/cv/${cv.slug}`}
              target="_blank"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600/10 py-2.5 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/20 transition-all hover:bg-emerald-600/20 hover:ring-emerald-500/30"
            >
              <ExternalLink className="h-3.5 w-3.5" /> View Live
            </Link>
          ) : (
            <button
              onClick={() => onDownload(cv)}
              disabled={isDownloading}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-purple-600/10 py-2.5 text-xs font-semibold text-purple-400 ring-1 ring-purple-500/20 transition-all hover:bg-purple-600/20 hover:ring-purple-500/30 disabled:opacity-50"
            >
              {isDownloading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              PDF
            </button>
          )}

          {/* More menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenuId(openMenuId === cv._id ? null : cv._id);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-content-4 transition hover:bg-card-hover hover:text-content-2"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {openMenuId === cv._id && (
              <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-xl border border-edge bg-popover shadow-xl shadow-black/20 animate-fade-in">
                {cv.isPublic && cv.slug && (
                  <button
                    onClick={() => onDownload(cv)}
                    disabled={isDownloading}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium text-content-2 transition hover:bg-card-hover hover:text-content"
                  >
                    <Download className="h-3.5 w-3.5" /> Download PDF
                  </button>
                )}
                <button
                  onClick={() => {
                    onDuplicate(cv);
                    setOpenMenuId(null);
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium text-content-2 transition hover:bg-card-hover hover:text-content"
                >
                  <Copy className="h-3.5 w-3.5" /> Duplicate
                </button>
                <Link
                  href={`/dashboard/cv/${cv._id}/versions`}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium text-content-2 transition hover:bg-card-hover hover:text-content"
                >
                  <Clock className="h-3.5 w-3.5" /> Version History
                </Link>
                <div className="my-1 h-px bg-edge" />
                <button
                  onClick={() => {
                    onDelete(cv._id);
                    setOpenMenuId(null);
                  }}
                  disabled={isDeleting}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/10"
                >
                  {isDeleting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   CV List Item (List View)
   ──────────────────────────────────────────── */

function CvListItem({
  cv,
  onDelete,
  onDownload,
  onDuplicate,
  downloadingId,
  deletingId,
}: {
  cv: Cv;
  onDelete: (id: string) => void;
  onDownload: (cv: Cv) => void;
  onDuplicate: (cv: Cv) => void;
  downloadingId: string | null;
  deletingId: string | null;
}) {
  const isDownloading = downloadingId === cv._id;
  const isDeleting = deletingId === cv._id;

  return (
    <div className="group flex items-center gap-4 rounded-2xl border border-edge bg-card px-5 py-4 transition-all hover:border-indigo-500/15 hover:bg-card-hover hover:shadow-md">
      {/* Icon */}
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
          cv.status === "published"
            ? "bg-emerald-500/10 text-emerald-400"
            : cv.status === "draft"
              ? "bg-amber-500/10 text-amber-400"
              : "bg-slate-500/10 text-slate-400"
        }`}
      >
        <FileText className="h-5 w-5" />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-content">
            {cv.title}
          </h3>
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
        </div>
        <p className="mt-0.5 truncate text-xs text-content-3">
          Updated{" "}
          {new Date(cv.updatedAt || cv.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
          {cv.targetRole && ` · ${cv.targetRole}`}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        <Link
          href={`/dashboard/cv/${cv._id}/edit`}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-content-2 transition hover:bg-indigo-500/10 hover:text-indigo-400"
        >
          <Edit className="h-3.5 w-3.5" /> Edit
        </Link>

        {cv.isPublic && cv.slug && (
          <Link
            href={`/cv/${cv.slug}`}
            target="_blank"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/10"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Live
          </Link>
        )}

        <button
          onClick={() => onDownload(cv)}
          disabled={isDownloading}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-purple-400 transition hover:bg-purple-500/10 disabled:opacity-50"
        >
          {isDownloading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          PDF
        </button>

        <button
          onClick={() => onDuplicate(cv)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-content-3 transition hover:bg-card-hover hover:text-content-2 opacity-0 group-hover:opacity-100"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>

        <button
          onClick={() => onDelete(cv._id)}
          disabled={isDeleting}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-red-400/60 transition hover:bg-red-500/10 hover:text-red-400 opacity-0 group-hover:opacity-100"
        >
          {isDeleting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   Completion Score Calculator
   ──────────────────────────────────────────── */

function getCompletionScore(cv: Cv): number {
  let score = 0;
  const weights = {
    title: 10,
    summary: 15,
    personalInfo: 20,
    sections: 40,
    theme: 5,
    targetRole: 5,
    tags: 5,
  };

  if (cv.title) score += weights.title;
  if (cv.summary && cv.summary.length > 10) score += weights.summary;
  if (cv.personalInfo) {
    const info = cv.personalInfo;
    const filled = [
      info.fullName,
      info.email,
      info.phone,
      info.location,
    ].filter(Boolean).length;
    score += Math.round((filled / 4) * weights.personalInfo);
  }
  if (cv.sections && cv.sections.length > 0) {
    const sectionScore = Math.min(cv.sections.length / 4, 1);
    score += Math.round(sectionScore * weights.sections);
  }
  if (cv.theme?.primaryColor || cv.theme?.fontFamily) score += weights.theme;
  if (cv.targetRole) score += weights.targetRole;
  if (cv.tags && cv.tags.length > 0) score += weights.tags;

  return Math.min(100, score);
}
