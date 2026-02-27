"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { templatesApi } from "@/lib/api";
import { Template } from "@/types";
import { useSubscriptionStore } from "@/lib/store";
import {
  Palette,
  Crown,
  Star,
  Eye,
  Search,
  Filter,
  Sparkles,
  Lock,
  ArrowRight,
} from "lucide-react";

const categories = [
  { key: "all", label: "All Templates" },
  { key: "minimal", label: "Minimal" },
  { key: "corporate", label: "Corporate" },
  { key: "creative", label: "Creative" },
  { key: "tech", label: "Tech" },
  { key: "executive", label: "Executive" },
];

const categoryColors: Record<string, string> = {
  minimal: "from-zinc-500 to-zinc-700",
  corporate: "from-blue-600 to-blue-800",
  creative: "from-pink-500 to-purple-600",
  tech: "from-emerald-500 to-teal-600",
  executive: "from-amber-500 to-orange-600",
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const { subscription } = useSubscriptionStore();

  useEffect(() => {
    loadTemplates();
  }, [activeCategory]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const cat = activeCategory === "all" ? undefined : activeCategory;
      const res = await templatesApi.getAll(cat);
      setTemplates(res.data);
    } catch {
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.tags?.some((tag) => tag.toLowerCase().includes(search.toLowerCase())),
  );

  const canUse = (t: Template) => {
    if (!t.isPremium && !t.isEnterprise) return true;
    if (t.isEnterprise && subscription?.plan === "enterprise") return true;
    if (
      t.isPremium &&
      (subscription?.plan === "premium" || subscription?.plan === "enterprise")
    )
      return true;
    return false;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-content">
            <span className="text-gradient">Template</span> Gallery
          </h1>
          <p className="mt-1 text-sm text-content-2">
            Choose from professionally designed templates to make your CV stand
            out
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-3" />
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-edge bg-card py-2.5 pl-10 pr-4 text-sm text-content placeholder-content-3 outline-none transition focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 sm:w-64"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeCategory === cat.key
                ? "bg-indigo-600/20 text-indigo-300 ring-1 ring-indigo-500/30"
                : "text-content-2 hover:bg-card-hover hover:text-content"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-edge bg-card p-1"
            >
              <div className="h-64 rounded-xl bg-card-hover" />
              <div className="p-4 space-y-3">
                <div className="h-5 w-2/3 rounded bg-card-hover" />
                <div className="h-4 w-full rounded bg-card-hover" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Palette className="h-12 w-12 text-content-4" />
          <p className="mt-4 text-lg font-medium text-content-2">
            No templates found
          </p>
          <p className="mt-1 text-sm text-content-4">
            Try a different search or category
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((template) => (
            <div
              key={template._id}
              className="group relative overflow-hidden rounded-2xl border border-edge bg-card transition hover:border-edge hover:bg-card-hover"
            >
              {/* Preview */}
              <div
                className={`relative h-56 bg-gradient-to-br ${categoryColors[template.category] || "from-indigo-600 to-purple-700"} p-6`}
              >
                <div className="h-full overflow-hidden rounded-lg bg-card-hover backdrop-blur-sm">
                  <div className="p-4 space-y-2">
                    <div className="h-3 w-1/2 rounded bg-white/30" />
                    <div className="h-2 w-3/4 rounded bg-white/20" />
                    <div className="h-2 w-2/3 rounded bg-white/20" />
                    <div className="mt-4 space-y-1.5">
                      <div className="h-2 w-full rounded bg-white/15" />
                      <div className="h-2 w-5/6 rounded bg-white/15" />
                      <div className="h-2 w-4/5 rounded bg-white/15" />
                    </div>
                  </div>
                </div>

                {/* Badges */}
                <div className="absolute left-3 top-3 flex gap-1.5">
                  {template.isPremium && (
                    <span className="flex items-center gap-1 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold text-black">
                      <Crown className="h-3 w-3" /> PRO
                    </span>
                  )}
                  {template.isEnterprise && (
                    <span className="flex items-center gap-1 rounded-full bg-purple-500/90 px-2 py-0.5 text-[10px] font-bold text-white">
                      <Sparkles className="h-3 w-3" /> ENTERPRISE
                    </span>
                  )}
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-sm transition group-hover:opacity-100">
                  {canUse(template) ? (
                    <Link
                      href={`/dashboard/cv/builder?template=${template._id}`}
                      className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 shadow-xl transition hover:bg-gray-100"
                    >
                      <Eye className="h-4 w-4" />
                      Use Template
                    </Link>
                  ) : (
                    <Link
                      href="/dashboard/settings/billing"
                      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xl"
                    >
                      <Lock className="h-4 w-4" />
                      Upgrade to Use
                    </Link>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-content">
                    {template.name}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-amber-400">
                    <Star className="h-3 w-3 fill-current" />
                    {template.rating?.toFixed(1) || "5.0"}
                  </div>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-content-3">
                  {template.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {template.tags?.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-card-hover px-2 py-0.5 text-[10px] text-content-2"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-content-4">
                  <span>{template.usageCount?.toLocaleString() || 0} uses</span>
                  <span className="flex items-center gap-1 capitalize">
                    <Palette className="h-3 w-3" />
                    {template.category}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
