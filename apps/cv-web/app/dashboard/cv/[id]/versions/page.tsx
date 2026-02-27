"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cvVersionsApi, cvApi } from "@/lib/api";
import { CvVersion } from "@/types";
import toast from "react-hot-toast";
import {
  History,
  ChevronLeft,
  RotateCcw,
  GitBranch,
  GitCommit,
  Clock,
  Tag,
  Loader2,
  Diff,
  Plus,
  ArrowRight,
  Sparkles,
  Save,
  Upload,
  Bot,
} from "lucide-react";

const changeTypeConfig: Record<
  string,
  { label: string; color: string; icon: typeof Save }
> = {
  manual: {
    label: "Manual",
    color: "text-blue-400 bg-blue-500/10",
    icon: Save,
  },
  "ai-generated": {
    label: "AI Generated",
    color: "text-purple-400 bg-purple-500/10",
    icon: Bot,
  },
  "auto-save": {
    label: "Auto-save",
    color: "text-content-3 bg-card-hover",
    icon: Clock,
  },
  publish: {
    label: "Published",
    color: "text-emerald-400 bg-emerald-500/10",
    icon: Upload,
  },
  restore: {
    label: "Restored",
    color: "text-amber-400 bg-amber-500/10",
    icon: RotateCcw,
  },
  branch: {
    label: "Branch",
    color: "text-pink-400 bg-pink-500/10",
    icon: GitBranch,
  },
};

export default function CvVersionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: cvId } = use(params);
  const router = useRouter();

  const [versions, setVersions] = useState<CvVersion[]>([]);
  const [branches, setBranches] = useState<CvVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<number | null>(null);
  const [cvTitle, setCvTitle] = useState("");

  // Snapshot form
  const [showSnapshot, setShowSnapshot] = useState(false);
  const [snapshotLabel, setSnapshotLabel] = useState("");
  const [snapshotDesc, setSnapshotDesc] = useState("");
  const [creating, setCreating] = useState(false);

  // Branch form
  const [showBranch, setShowBranch] = useState(false);
  const [branchName, setBranchName] = useState("");
  const [branchFromVersion, setBranchFromVersion] = useState<
    number | undefined
  >(undefined);
  const [creatingBranch, setCreatingBranch] = useState(false);

  // Compare state
  const [compareV1, setCompareV1] = useState<number | null>(null);
  const [compareV2, setCompareV2] = useState<number | null>(null);
  const [compareResult, setCompareResult] = useState<any>(null);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    loadData();
  }, [cvId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [versionsRes, branchesRes, cvRes] = await Promise.all([
        cvVersionsApi.getVersions(cvId, 1, 50),
        cvVersionsApi.getBranches(cvId).catch(() => ({ data: [] })),
        cvApi.getById(cvId),
      ]);
      setVersions(
        Array.isArray(versionsRes.data)
          ? versionsRes.data
          : versionsRes.data?.versions || [],
      );
      setBranches(Array.isArray(branchesRes.data) ? branchesRes.data : []);
      setCvTitle(cvRes.data?.title || "Untitled CV");
    } catch {
      toast.error("Failed to load version history");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (version: number) => {
    if (
      !confirm(
        `Restore to version ${version}? A snapshot of the current state will be saved first.`,
      )
    )
      return;
    setRestoring(version);
    try {
      await cvVersionsApi.restoreVersion(cvId, version);
      toast.success(`Restored to version ${version}`);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to restore");
    } finally {
      setRestoring(null);
    }
  };

  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await cvVersionsApi.createSnapshot(cvId, {
        label: snapshotLabel || undefined,
        changeDescription: snapshotDesc || undefined,
      });
      toast.success("Snapshot created!");
      setShowSnapshot(false);
      setSnapshotLabel("");
      setSnapshotDesc("");
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create snapshot");
    } finally {
      setCreating(false);
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName.trim()) return;
    setCreatingBranch(true);
    try {
      await cvVersionsApi.createBranch(cvId, {
        branchName: branchName,
        version: branchFromVersion,
      });
      toast.success(`Branch "${branchName}" created!`);
      setShowBranch(false);
      setBranchName("");
      setBranchFromVersion(undefined);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create branch");
    } finally {
      setCreatingBranch(false);
    }
  };

  const handleCompare = async () => {
    if (compareV1 == null || compareV2 == null) {
      toast.error("Select two versions to compare");
      return;
    }
    setComparing(true);
    try {
      const res = await cvVersionsApi.compareVersions(
        cvId,
        compareV1,
        compareV2,
      );
      setCompareResult(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to compare");
    } finally {
      setComparing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href={`/dashboard/cv/${cvId}/edit`}
        className="inline-flex items-center gap-1.5 text-sm text-content-3 transition hover:text-content"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Editor
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content">
            <span className="text-gradient">Version History</span>
          </h1>
          <p className="mt-1 text-sm text-content-3">{cvTitle}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSnapshot(!showSnapshot)}
            className="inline-flex items-center gap-2 rounded-xl border border-edge px-4 py-2.5 text-sm font-medium text-content-2 transition hover:bg-card-hover"
          >
            <Plus className="h-4 w-4" />
            Snapshot
          </button>
          <button
            onClick={() => setShowBranch(!showBranch)}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            <GitBranch className="h-4 w-4" />
            Branch
          </button>
        </div>
      </div>

      {/* Snapshot Form */}
      {showSnapshot && (
        <form
          onSubmit={handleCreateSnapshot}
          className="rounded-2xl border border-edge bg-card p-6 shadow-sm space-y-4"
        >
          <h3 className="text-lg font-semibold text-content">
            Create Snapshot
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-content-2">
                Label
              </label>
              <input
                value={snapshotLabel}
                onChange={(e) => setSnapshotLabel(e.target.value)}
                placeholder="e.g. Before redesign"
                className="w-full rounded-xl border border-edge bg-surface px-4 py-2.5 text-sm text-content placeholder:text-content-4 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-content-2">
                Description
              </label>
              <input
                value={snapshotDesc}
                onChange={(e) => setSnapshotDesc(e.target.value)}
                placeholder="What changed?"
                className="w-full rounded-xl border border-edge bg-surface px-4 py-2.5 text-sm text-content placeholder:text-content-4 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Snapshot
            </button>
            <button
              type="button"
              onClick={() => setShowSnapshot(false)}
              className="rounded-xl border border-edge px-5 py-2.5 text-sm font-medium text-content-2 transition hover:bg-card-hover"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Branch Form */}
      {showBranch && (
        <form
          onSubmit={handleCreateBranch}
          className="rounded-2xl border border-edge bg-card p-6 shadow-sm space-y-4"
        >
          <h3 className="text-lg font-semibold text-content">Create Branch</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-content-2">
                Branch Name
              </label>
              <input
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                placeholder="e.g. tech-company-variant"
                className="w-full rounded-xl border border-edge bg-surface px-4 py-2.5 text-sm text-content placeholder:text-content-4 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-content-2">
                From Version (optional)
              </label>
              <select
                value={branchFromVersion ?? ""}
                onChange={(e) =>
                  setBranchFromVersion(
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
                className="w-full rounded-xl border border-edge bg-surface px-4 py-2.5 text-sm text-content focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Latest</option>
                {versions.map((v) => (
                  <option key={v.version} value={v.version}>
                    v{v.version} —{" "}
                    {v.label || v.changeDescription || v.changeType}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={creatingBranch}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {creatingBranch && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Branch
            </button>
            <button
              type="button"
              onClick={() => setShowBranch(false)}
              className="rounded-xl border border-edge px-5 py-2.5 text-sm font-medium text-content-2 transition hover:bg-card-hover"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Branches */}
      {branches.length > 0 && (
        <div className="rounded-2xl border border-edge bg-card p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-content-2 uppercase tracking-wider mb-3">
            Branches
          </h3>
          <div className="flex flex-wrap gap-2">
            {branches.map((b) => (
              <span
                key={b._id}
                className="inline-flex items-center gap-1.5 rounded-full bg-pink-500/10 px-3 py-1 text-xs font-medium text-pink-400 ring-1 ring-pink-500/20"
              >
                <GitBranch className="h-3 w-3" />
                {b.branchName}
                <span className="text-pink-400/60">v{b.version}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Compare Tool */}
      <div className="rounded-2xl border border-edge bg-card p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-content-2 uppercase tracking-wider mb-3">
          Compare Versions
        </h3>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs text-content-3">
              Version A
            </label>
            <select
              value={compareV1 ?? ""}
              onChange={(e) =>
                setCompareV1(e.target.value ? Number(e.target.value) : null)
              }
              className="rounded-xl border border-edge bg-surface px-3 py-2 text-sm text-content focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Select...</option>
              {versions.map((v) => (
                <option key={v.version} value={v.version}>
                  v{v.version}
                </option>
              ))}
            </select>
          </div>
          <ArrowRight className="mb-2 h-4 w-4 text-content-4" />
          <div>
            <label className="mb-1 block text-xs text-content-3">
              Version B
            </label>
            <select
              value={compareV2 ?? ""}
              onChange={(e) =>
                setCompareV2(e.target.value ? Number(e.target.value) : null)
              }
              className="rounded-xl border border-edge bg-surface px-3 py-2 text-sm text-content focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Select...</option>
              {versions.map((v) => (
                <option key={v.version} value={v.version}>
                  v{v.version}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleCompare}
            disabled={comparing || !compareV1 || !compareV2}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {comparing && <Loader2 className="h-4 w-4 animate-spin" />}
            <Diff className="h-4 w-4" />
            Compare
          </button>
        </div>

        {/* Compare Results */}
        {compareResult && (
          <div className="mt-4 rounded-xl border border-edge bg-surface p-4 space-y-3">
            <h4 className="text-sm font-semibold text-content">
              v{compareResult.version1?.version || compareV1} → v
              {compareResult.version2?.version || compareV2}
            </h4>
            {compareResult.diff ? (
              <div className="space-y-2 text-sm">
                {compareResult.diff.fieldsChanged?.length > 0 && (
                  <div>
                    <span className="font-medium text-amber-400">
                      Fields Changed:
                    </span>
                    <span className="ml-2 text-content-2">
                      {compareResult.diff.fieldsChanged.join(", ")}
                    </span>
                  </div>
                )}
                {compareResult.diff.sectionsAdded?.length > 0 && (
                  <div>
                    <span className="font-medium text-emerald-400">
                      Sections Added:
                    </span>
                    <span className="ml-2 text-content-2">
                      {compareResult.diff.sectionsAdded.join(", ")}
                    </span>
                  </div>
                )}
                {compareResult.diff.sectionsRemoved?.length > 0 && (
                  <div>
                    <span className="font-medium text-red-400">
                      Sections Removed:
                    </span>
                    <span className="ml-2 text-content-2">
                      {compareResult.diff.sectionsRemoved.join(", ")}
                    </span>
                  </div>
                )}
                {compareResult.diff.sectionsModified?.length > 0 && (
                  <div>
                    <span className="font-medium text-blue-400">
                      Sections Modified:
                    </span>
                    <span className="ml-2 text-content-2">
                      {compareResult.diff.sectionsModified.join(", ")}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-content-3">No differences found</p>
            )}
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-content-2 uppercase tracking-wider mb-4">
          Version Timeline
        </h3>
        {versions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-edge bg-card/50 py-16 text-center">
            <History className="h-10 w-10 text-content-4" />
            <h3 className="mt-3 text-lg font-semibold text-content">
              No versions yet
            </h3>
            <p className="mt-1 text-sm text-content-3">
              Create your first snapshot to start tracking changes
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-edge" />

            <div className="space-y-0">
              {versions.map((v, idx) => {
                const config =
                  changeTypeConfig[v.changeType] || changeTypeConfig.manual;
                const Icon = config.icon;
                return (
                  <div key={v._id} className="relative flex gap-4 py-3 pl-0">
                    {/* Timeline dot */}
                    <div
                      className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-4 ring-page ${config.color}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 rounded-2xl border border-edge bg-card p-4 shadow-sm transition hover:border-indigo-500/20">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-content">
                              v{v.version}
                            </span>
                            {v.label && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-400">
                                <Tag className="h-3 w-3" />
                                {v.label}
                              </span>
                            )}
                            {v.isBranch && v.branchName && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-pink-500/10 px-2 py-0.5 text-xs font-medium text-pink-400">
                                <GitBranch className="h-3 w-3" />
                                {v.branchName}
                              </span>
                            )}
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${config.color}`}
                            >
                              {config.label}
                            </span>
                          </div>
                          {v.changeDescription && (
                            <p className="mt-1 text-sm text-content-3">
                              {v.changeDescription}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-content-4">
                            {new Date(v.createdAt).toLocaleDateString()}{" "}
                            {new Date(v.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {idx > 0 && (
                            <button
                              onClick={() => handleRestore(v.version)}
                              disabled={restoring === v.version}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-edge px-2.5 py-1 text-xs font-medium text-content-2 transition hover:bg-card-hover hover:text-content disabled:opacity-50"
                            >
                              {restoring === v.version ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <RotateCcw className="h-3 w-3" />
                              )}
                              Restore
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Diff summary */}
                      {v.diff &&
                        (v.diff.fieldsChanged?.length > 0 ||
                          v.diff.sectionsModified?.length > 0 ||
                          v.diff.sectionsAdded?.length > 0 ||
                          v.diff.sectionsRemoved?.length > 0) && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {v.diff.fieldsChanged?.map((f) => (
                              <span
                                key={f}
                                className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400"
                              >
                                {f}
                              </span>
                            ))}
                            {v.diff.sectionsAdded?.map((s) => (
                              <span
                                key={s}
                                className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400"
                              >
                                +{s}
                              </span>
                            ))}
                            {v.diff.sectionsRemoved?.map((s) => (
                              <span
                                key={s}
                                className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-400"
                              >
                                -{s}
                              </span>
                            ))}
                            {v.diff.sectionsModified?.map((s) => (
                              <span
                                key={s}
                                className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-400"
                              >
                                ~{s}
                              </span>
                            ))}
                          </div>
                        )}

                      {v.sizeBytes && (
                        <p className="mt-1.5 text-[10px] text-content-4">
                          {(v.sizeBytes / 1024).toFixed(1)} KB
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
