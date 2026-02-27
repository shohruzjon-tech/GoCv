"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { organizationsApi } from "@/lib/api";
import { useOrganizationStore } from "@/lib/store";
import toast from "react-hot-toast";
import {
  Building2,
  ArrowLeft,
  Loader2,
  Globe,
  Briefcase,
  Users,
  FileText,
} from "lucide-react";

const companySizes = [
  { value: "1-10", label: "1–10 employees" },
  { value: "11-50", label: "11–50 employees" },
  { value: "51-200", label: "51–200 employees" },
  { value: "201-500", label: "201–500 employees" },
  { value: "501-1000", label: "501–1,000 employees" },
  { value: "1000+", label: "1,000+ employees" },
];

export default function NewOrganizationPage() {
  const router = useRouter();
  const { organizations, setOrganizations } = useOrganizationStore();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    industry: "",
    website: "",
    size: "",
  });

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
      toast.success("Organization created!");
      router.push("/dashboard/organizations");
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Failed to create organization",
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/organizations"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-content-3 transition hover:text-content"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Organizations
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/20 ring-1 ring-indigo-500/30">
            <Building2 className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-content">
              <span className="text-gradient">New Organization</span>
            </h1>
            <p className="mt-1 text-sm text-content-2">
              Set up a workspace for your team or company
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleCreate}
        className="space-y-6 rounded-2xl border border-edge bg-card p-8 shadow-sm"
      >
        {/* Name */}
        <div>
          <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-content-2">
            <Building2 className="h-4 w-4 text-content-3" />
            Organization Name <span className="text-red-400">*</span>
          </label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Acme Corp"
            className="w-full rounded-xl border border-edge bg-surface px-4 py-3 text-sm text-content placeholder:text-content-4 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-content-2">
            <FileText className="h-4 w-4 text-content-3" />
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="A brief description of your organization and its goals"
            rows={3}
            className="w-full resize-none rounded-xl border border-edge bg-surface px-4 py-3 text-sm text-content placeholder:text-content-4 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Industry */}
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-content-2">
              <Briefcase className="h-4 w-4 text-content-3" />
              Industry
            </label>
            <input
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
              placeholder="Technology"
              className="w-full rounded-xl border border-edge bg-surface px-4 py-3 text-sm text-content placeholder:text-content-4 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Website */}
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-content-2">
              <Globe className="h-4 w-4 text-content-3" />
              Website
            </label>
            <input
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="https://acme.com"
              className="w-full rounded-xl border border-edge bg-surface px-4 py-3 text-sm text-content placeholder:text-content-4 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* Company Size */}
        <div>
          <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-content-2">
            <Users className="h-4 w-4 text-content-3" />
            Company Size
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {companySizes.map((size) => (
              <button
                key={size.value}
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    size: form.size === size.value ? "" : size.value,
                  })
                }
                className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                  form.size === size.value
                    ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20"
                    : "border-edge bg-surface text-content-2 hover:border-edge hover:bg-card-hover"
                }`}
              >
                {size.label}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 border-t border-edge pt-6">
          <button
            type="submit"
            disabled={creating || !form.name.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {creating && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Organization
          </button>
          <Link
            href="/dashboard/organizations"
            className="rounded-xl border border-edge px-6 py-3 text-sm font-medium text-content-2 transition hover:bg-card-hover"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
