"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { organizationsApi } from "@/lib/api";
import { useOrganizationStore } from "@/lib/store";
import { Organization } from "@/types";
import toast from "react-hot-toast";
import {
  Building2,
  Plus,
  Users,
  Crown,
  Shield,
  FileText,
  Loader2,
  ChevronRight,
  Globe,
  Briefcase,
} from "lucide-react";

export default function OrganizationsPage() {
  const { organizations, setOrganizations } = useOrganizationStore();
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    industry: "",
    website: "",
    size: "",
  });

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      const res = await organizationsApi.getAll();
      setOrganizations(res.data);
    } catch {
      toast.error("Failed to load organizations");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      const res = await organizationsApi.create({
        name: form.name,
        description: form.description || undefined,
        industry: form.industry || undefined,
        website: form.website || undefined,
        size: form.size || undefined,
      });
      setOrganizations([...organizations, res.data]);
      setShowCreate(false);
      setForm({
        name: "",
        description: "",
        industry: "",
        website: "",
        size: "",
      });
      toast.success("Organization created!");
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Failed to create organization",
      );
    } finally {
      setCreating(false);
    }
  };

  const planColors: Record<string, string> = {
    team: "text-blue-400 bg-blue-500/10 ring-blue-500/20",
    business: "text-purple-400 bg-purple-500/10 ring-purple-500/20",
    enterprise: "text-amber-400 bg-amber-500/10 ring-amber-500/20",
  };

  const statusColors: Record<string, string> = {
    active: "text-emerald-400 bg-emerald-500/10",
    trial: "text-amber-400 bg-amber-500/10",
    suspended: "text-red-400 bg-red-500/10",
    deactivated: "text-content-4 bg-card-hover",
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-content">
            <span className="text-gradient">Organizations</span>
          </h1>
          <p className="mt-1 text-sm text-content-2">
            Manage your teams and enterprise workspaces
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" />
          New Organization
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="rounded-2xl border border-edge bg-card p-6 shadow-sm space-y-4"
        >
          <h2 className="text-lg font-semibold text-content">
            Create Organization
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-content-2">
                Name <span className="text-red-400">*</span>
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Acme Corp"
                className="w-full rounded-xl border border-edge bg-surface px-4 py-2.5 text-sm text-content placeholder:text-content-4 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-content-2">
                Industry
              </label>
              <input
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
                placeholder="Technology"
                className="w-full rounded-xl border border-edge bg-surface px-4 py-2.5 text-sm text-content placeholder:text-content-4 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-content-2">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="A brief description of your organization"
                rows={2}
                className="w-full rounded-xl border border-edge bg-surface px-4 py-2.5 text-sm text-content placeholder:text-content-4 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-content-2">
                Website
              </label>
              <input
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://acme.com"
                className="w-full rounded-xl border border-edge bg-surface px-4 py-2.5 text-sm text-content placeholder:text-content-4 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-content-2">
                Company Size
              </label>
              <select
                value={form.size}
                onChange={(e) => setForm({ ...form, size: e.target.value })}
                className="w-full rounded-xl border border-edge bg-surface px-4 py-2.5 text-sm text-content focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Select size...</option>
                <option value="1-10">1-10</option>
                <option value="11-50">11-50</option>
                <option value="51-200">51-200</option>
                <option value="201-500">201-500</option>
                <option value="501-1000">501-1000</option>
                <option value="1000+">1000+</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Organization
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

      {/* Organizations Grid */}
      {organizations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-edge bg-card/50 py-20 text-center">
          <Building2 className="h-12 w-12 text-content-4" />
          <h3 className="mt-4 text-lg font-semibold text-content">
            No organizations yet
          </h3>
          <p className="mt-1 max-w-sm text-sm text-content-3">
            Create your first organization to start collaborating with your team
            on CVs and hiring.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" />
            Create Organization
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <Link
              key={org._id}
              href={`/dashboard/organizations/${org._id}`}
              className="group rounded-2xl border border-edge bg-card p-6 shadow-sm transition hover:border-indigo-500/30 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600/20 ring-1 ring-indigo-500/30">
                  <Building2 className="h-5 w-5 text-indigo-400" />
                </div>
                <ChevronRight className="h-5 w-5 text-content-4 transition group-hover:text-indigo-400 group-hover:translate-x-0.5" />
              </div>

              <h3 className="mt-4 text-lg font-semibold text-content">
                {org.name}
              </h3>
              {org.description && (
                <p className="mt-1 text-sm text-content-3 line-clamp-2">
                  {org.description}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${
                    planColors[org.plan] || planColors.team
                  }`}
                >
                  <Crown className="mr-1 h-3 w-3" />
                  {org.plan.charAt(0).toUpperCase() + org.plan.slice(1)}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    statusColors[org.status] || statusColors.active
                  }`}
                >
                  {org.status.charAt(0).toUpperCase() + org.status.slice(1)}
                </span>
              </div>

              <div className="mt-4 flex items-center gap-4 text-xs text-content-3">
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {org.memberCount} member{org.memberCount !== 1 ? "s" : ""}
                </span>
                {org.industry && (
                  <span className="inline-flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" />
                    {org.industry}
                  </span>
                )}
                {org.website && (
                  <span className="inline-flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5" />
                    Website
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
