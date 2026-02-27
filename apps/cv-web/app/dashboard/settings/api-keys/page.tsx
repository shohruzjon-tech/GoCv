"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiKeysApi } from "@/lib/api";
import { ApiKeyInfo } from "@/types";
import toast from "react-hot-toast";
import {
  Key,
  Plus,
  Trash2,
  RotateCcw,
  Copy,
  Loader2,
  Shield,
  Clock,
  Settings,
  User,
  ChevronLeft,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";

const SCOPE_OPTIONS = [
  { value: "cv:read", label: "CV Read", group: "CV" },
  { value: "cv:write", label: "CV Write", group: "CV" },
  { value: "cv:delete", label: "CV Delete", group: "CV" },
  { value: "ai:generate", label: "AI Generate", group: "AI" },
  { value: "ai:tools", label: "AI Tools", group: "AI" },
  { value: "templates:read", label: "Templates Read", group: "Templates" },
  { value: "users:read", label: "Users Read", group: "Users" },
  { value: "org:read", label: "Org Read", group: "Organization" },
  { value: "org:manage", label: "Org Manage", group: "Organization" },
  { value: "analytics:read", label: "Analytics Read", group: "Analytics" },
  { value: "webhooks:manage", label: "Webhooks Manage", group: "Webhooks" },
  { value: "*", label: "Full Access", group: "Admin" },
];

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    scopes: [] as string[],
    expiresIn: 90,
    allowedIps: "",
  });

  // New key display
  const [newKey, setNewKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    try {
      const res = await apiKeysApi.getAll();
      setKeys(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Failed to load API keys");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || form.scopes.length === 0) {
      toast.error("Name and at least one scope are required");
      return;
    }
    setCreating(true);
    try {
      const res = await apiKeysApi.create({
        name: form.name,
        scopes: form.scopes,
        expiresIn: form.expiresIn > 0 ? form.expiresIn : undefined,
        allowedIps: form.allowedIps
          ? form.allowedIps
              .split(",")
              .map((ip) => ip.trim())
              .filter(Boolean)
          : undefined,
      });
      setNewKey(res.data.rawKey || res.data.key);
      setKeys([res.data.apiKey || res.data, ...keys]);
      setForm({ name: "", scopes: [], expiresIn: 90, allowedIps: "" });
      setShowCreate(false);
      toast.success("API key created! Copy it now — it won't be shown again.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create API key");
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string, name: string) => {
    if (!confirm(`Revoke API key "${name}"? This cannot be undone.`)) return;
    try {
      await apiKeysApi.revoke(id);
      setKeys(
        keys.map((k) =>
          k._id === id ? { ...k, status: "revoked" as const } : k,
        ),
      );
      toast.success("API key revoked");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to revoke");
    }
  };

  const handleRotate = async (id: string, name: string) => {
    if (
      !confirm(
        `Rotate API key "${name}"? The old key will be immediately revoked.`,
      )
    )
      return;
    try {
      const res = await apiKeysApi.rotate(id);
      setNewKey(res.data.rawKey || res.data.key);
      loadKeys();
      toast.success("API key rotated! Copy the new key now.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to rotate");
    }
  };

  const copyKey = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      toast.success("Copied to clipboard");
    }
  };

  const toggleScope = (scope: string) => {
    setForm((prev) => ({
      ...prev,
      scopes: prev.scopes.includes(scope)
        ? prev.scopes.filter((s) => s !== scope)
        : [...prev.scopes, scope],
    }));
  };

  const statusColors: Record<string, string> = {
    active: "text-emerald-400 bg-emerald-500/10",
    revoked: "text-red-400 bg-red-500/10",
    expired: "text-amber-400 bg-amber-500/10",
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-content">
          <span className="text-gradient">API Keys</span>
        </h1>
        <p className="mt-1 text-sm text-content-2">
          Manage API keys for programmatic access to GoCV
        </p>
      </div>

      {/* Settings tabs */}
      <div className="flex gap-2 border-b border-edge pb-1">
        <Link
          href="/dashboard/settings"
          className="px-4 py-2 text-sm font-medium text-content-3 hover:text-content"
        >
          <span className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </span>
        </Link>
        <Link
          href="/dashboard/settings/billing"
          className="px-4 py-2 text-sm font-medium text-content-3 hover:text-content"
        >
          <span className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Billing
          </span>
        </Link>
        <Link
          href="/dashboard/settings/api-keys"
          className="border-b-2 border-indigo-500 px-4 py-2 text-sm font-medium text-content"
        >
          <span className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Keys
          </span>
        </Link>
      </div>

      {/* New Key Banner */}
      {newKey && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 space-y-3">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="text-sm font-semibold">Save your API key now</h3>
          </div>
          <p className="text-sm text-content-3">
            This is the only time you&apos;ll see this key. Copy it and store it
            securely.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-xl border border-edge bg-surface px-4 py-2.5 font-mono text-sm text-content">
              {showKey ? newKey : "gocv_" + "•".repeat(40)}
            </code>
            <button
              onClick={() => setShowKey(!showKey)}
              className="rounded-lg border border-edge p-2.5 text-content-3 transition hover:bg-card-hover"
            >
              {showKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={copyKey}
              className="rounded-lg bg-indigo-600 p-2.5 text-white transition hover:bg-indigo-500"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={() => setNewKey(null)}
            className="text-xs text-content-4 hover:text-content-3"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Create Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" />
          New API Key
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="rounded-2xl border border-edge bg-card p-6 shadow-sm space-y-5"
        >
          <h2 className="text-lg font-semibold text-content">Create API Key</h2>

          <div>
            <label className="mb-1 block text-sm font-medium text-content-2">
              Key Name <span className="text-red-400">*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Production Server"
              className="w-full rounded-xl border border-edge bg-surface px-4 py-2.5 text-sm text-content placeholder:text-content-4 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-content-2">
              Scopes <span className="text-red-400">*</span>
            </label>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {SCOPE_OPTIONS.map((scope) => (
                <label
                  key={scope.value}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition ${
                    form.scopes.includes(scope.value)
                      ? "border-indigo-500/50 bg-indigo-500/10 text-content"
                      : "border-edge bg-surface text-content-3 hover:border-edge hover:bg-card-hover"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.scopes.includes(scope.value)}
                    onChange={() => toggleScope(scope.value)}
                    className="sr-only"
                  />
                  <div
                    className={`flex h-4 w-4 items-center justify-center rounded border ${
                      form.scopes.includes(scope.value)
                        ? "border-indigo-500 bg-indigo-500"
                        : "border-edge"
                    }`}
                  >
                    {form.scopes.includes(scope.value) && (
                      <svg
                        className="h-3 w-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-xs font-medium text-content-4 w-16">
                    {scope.group}
                  </span>
                  <span>{scope.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-content-2">
                Expires In (days)
              </label>
              <input
                type="number"
                value={form.expiresIn}
                onChange={(e) =>
                  setForm({ ...form, expiresIn: parseInt(e.target.value) || 0 })
                }
                placeholder="90 (0 = never)"
                className="w-full rounded-xl border border-edge bg-surface px-4 py-2.5 text-sm text-content focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <p className="mt-1 text-xs text-content-4">
                Set to 0 for no expiration
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-content-2">
                Allowed IPs (comma-separated)
              </label>
              <input
                value={form.allowedIps}
                onChange={(e) =>
                  setForm({ ...form, allowedIps: e.target.value })
                }
                placeholder="e.g. 1.2.3.4, 5.6.7.8"
                className="w-full rounded-xl border border-edge bg-surface px-4 py-2.5 text-sm text-content placeholder:text-content-4 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <p className="mt-1 text-xs text-content-4">
                Leave empty for no restriction
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Key
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-xl border border-edge px-5 py-2.5 text-sm font-medium text-content-2 transition hover:bg-card-hover"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Keys List */}
      {keys.length === 0 && !showCreate ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-edge bg-card/50 py-20 text-center">
          <Key className="h-12 w-12 text-content-4" />
          <h3 className="mt-4 text-lg font-semibold text-content">
            No API keys
          </h3>
          <p className="mt-1 max-w-sm text-sm text-content-3">
            Create API keys to access GoCV programmatically via the REST API.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-edge bg-card shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-edge">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-content-3">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-content-3">
                  Key
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-content-3">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-content-3">
                  Scopes
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-content-3">
                  Last Used
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-content-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-edge">
              {keys.map((key) => (
                <tr key={key._id} className="transition hover:bg-card-hover">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-content">
                        {key.name}
                      </p>
                      <p className="text-xs text-content-4">
                        Created {new Date(key.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <code className="rounded bg-surface px-2 py-1 font-mono text-xs text-content-3">
                      {key.keyPrefix}•••••••
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[key.status] || statusColors.active}`}
                    >
                      {key.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {key.scopes.slice(0, 3).map((s) => (
                        <span
                          key={s}
                          className="rounded bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-medium text-indigo-400"
                        >
                          {s}
                        </span>
                      ))}
                      {key.scopes.length > 3 && (
                        <span className="rounded bg-card-hover px-1.5 py-0.5 text-[10px] font-medium text-content-4">
                          +{key.scopes.length - 3} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-content-3">
                    {key.lastUsedAt
                      ? new Date(key.lastUsedAt).toLocaleDateString()
                      : "Never"}
                    {key.usageCount > 0 && (
                      <span className="block text-xs text-content-4">
                        {key.usageCount} requests
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {key.status === "active" && (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleRotate(key._id, key.name)}
                          className="rounded-lg p-1.5 text-content-4 transition hover:bg-amber-500/10 hover:text-amber-400"
                          title="Rotate key"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleRevoke(key._id, key.name)}
                          className="rounded-lg p-1.5 text-content-4 transition hover:bg-red-500/10 hover:text-red-400"
                          title="Revoke key"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
