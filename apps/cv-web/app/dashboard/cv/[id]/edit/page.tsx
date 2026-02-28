"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { cvApi, pdfApi, templatesApi } from "@/lib/api";
import { Cv, CvSection, Template } from "@/types";
import { useSubscriptionStore } from "@/lib/store";
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
  Loader2,
  Share2,
  Palette,
  User,
  FileText,
  Monitor,
  Smartphone,
  X,
  Target,
  Briefcase,
  GraduationCap,
  Award,
  FolderOpen,
  Plus,
  Trash2,
  Wand2,
  RefreshCw,
  Crown,
  Lock,
  Star,
  CheckCircle2,
  ArrowRight,
  Info,
  type LucideIcon,
} from "lucide-react";
import toast from "react-hot-toast";

/* ═══════════════════════════════════════════════════════════
   Reusable Sub-components
   ═══════════════════════════════════════════════════════════ */

function Field({
  label,
  optional,
  ...props
}: {
  label: string;
  optional?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-content-3">
        {label}
        {optional && (
          <span className="text-content-4 font-normal text-[10px]">
            (optional)
          </span>
        )}
      </label>
      <input
        {...props}
        className="w-full rounded-xl border border-edge bg-field px-3 py-2.5 text-sm text-content placeholder:text-content-4 focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
      />
    </div>
  );
}

function CompletionRing({
  score,
  size = 48,
}: {
  score: number;
  size?: number;
}) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color =
    score >= 80
      ? "text-emerald-400"
      : score >= 50
        ? "text-amber-400"
        : "text-red-400";
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={3}
          className="stroke-edge"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className={`${color} transition-all duration-700 ease-out`}
          style={{ stroke: "currentColor" }}
        />
      </svg>
      <span
        className={`absolute text-xs font-bold ${color}`}
        style={{ fontSize: size * 0.22 }}
      >
        {score}%
      </span>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  color,
  title,
  subtitle,
  action,
}: {
  icon: LucideIcon;
  color: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  const colors: Record<string, { bg: string; text: string; ring: string }> = {
    indigo: {
      bg: "bg-indigo-500/10",
      text: "text-indigo-400",
      ring: "ring-indigo-500/20",
    },
    purple: {
      bg: "bg-purple-500/10",
      text: "text-purple-400",
      ring: "ring-purple-500/20",
    },
    emerald: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      ring: "ring-emerald-500/20",
    },
    amber: {
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      ring: "ring-amber-500/20",
    },
    pink: {
      bg: "bg-pink-500/10",
      text: "text-pink-400",
      ring: "ring-pink-500/20",
    },
    sky: {
      bg: "bg-sky-500/10",
      text: "text-sky-400",
      ring: "ring-sky-500/20",
    },
    orange: {
      bg: "bg-orange-500/10",
      text: "text-orange-400",
      ring: "ring-orange-500/20",
    },
  };
  const c = colors[color] || colors.indigo;
  return (
    <div className="flex items-center justify-between gap-3 border-b border-edge bg-card/50 px-5 py-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${c.bg} ${c.text} ring-1 ${c.ring}`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-content">{title}</h3>
          {subtitle && <p className="text-xs text-content-4">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

/* ─── Template Selector ─── */

const templateCategoryColors: Record<string, string> = {
  minimal: "from-zinc-500 to-zinc-700",
  corporate: "from-blue-600 to-blue-800",
  creative: "from-pink-500 to-purple-600",
  tech: "from-emerald-500 to-teal-600",
  executive: "from-amber-500 to-orange-600",
};

function TemplateSelector({
  templates,
  selectedId,
  onSelect,
  loading,
  canUse,
}: {
  templates: Template[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  loading: boolean;
  canUse: (t: Template) => boolean;
}) {
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const filtered =
    filterCategory === "all"
      ? templates
      : templates.filter((t) => t.category === filterCategory);

  if (loading) {
    return (
      <div className="flex gap-3 overflow-hidden">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse shrink-0 w-32 h-40 rounded-xl border border-edge bg-card"
          >
            <div className="h-20 rounded-t-xl bg-card-hover" />
            <div className="p-2 space-y-2">
              <div className="h-3 w-2/3 rounded bg-card-hover" />
              <div className="h-2 w-full rounded bg-card-hover" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (templates.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-indigo-400" />
          <span className="text-sm font-semibold text-content">Template</span>
          <span className="text-xs text-content-4">
            ({templates.length} available)
          </span>
        </div>
        {selectedId && (
          <button
            onClick={() => onSelect(null)}
            className="text-xs text-content-3 hover:text-content-2 transition"
          >
            Use default
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {["all", "minimal", "corporate", "creative", "tech", "executive"].map(
          (cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium capitalize transition ${
                filterCategory === cat
                  ? "bg-indigo-600/20 text-indigo-300 ring-1 ring-indigo-500/30"
                  : "text-content-3 hover:bg-card-hover hover:text-content-2"
              }`}
            >
              {cat === "all" ? "All" : cat}
            </button>
          ),
        )}
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-edge scrollbar-track-transparent">
        {filtered.map((template) => {
          const isSelected = selectedId === template._id;
          const locked = !canUse(template);
          return (
            <button
              key={template._id}
              onClick={() => {
                if (locked) {
                  toast.error("Upgrade your plan to use this template");
                  return;
                }
                onSelect(isSelected ? null : template._id);
              }}
              className={`group relative shrink-0 w-32 overflow-hidden rounded-xl border-2 text-left transition-all duration-200 ${
                isSelected
                  ? "border-indigo-500 ring-2 ring-indigo-500/30 scale-[1.02]"
                  : "border-edge hover:border-content-4"
              } ${locked ? "opacity-60" : ""}`}
            >
              <div
                className={`relative h-20 bg-gradient-to-br ${templateCategoryColors[template.category] || "from-indigo-600 to-purple-700"} p-2`}
              >
                <div className="h-full overflow-hidden rounded-md bg-white/90 backdrop-blur-sm">
                  <div className="p-1.5 space-y-0.5">
                    <div
                      className="h-1.5 w-3/5 rounded"
                      style={{
                        backgroundColor:
                          template.colorThemes?.[0]?.primary || "#4f46e5",
                        opacity: 0.6,
                      }}
                    />
                    <div className="h-1 w-4/5 rounded bg-gray-300/60" />
                    <div className="h-1 w-3/5 rounded bg-gray-300/40" />
                  </div>
                </div>
                {template.isPremium && (
                  <span className="absolute left-1 top-1 flex items-center gap-0.5 rounded-full bg-amber-500/90 px-1.5 py-0.5 text-[7px] font-bold text-black">
                    <Crown className="h-2 w-2" /> PRO
                  </span>
                )}
                {locked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
                    <Lock className="h-4 w-4 text-white/80" />
                  </div>
                )}
                {isSelected && (
                  <div className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 shadow">
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
              <div className="bg-card p-1.5">
                <p className="truncate text-[10px] font-semibold text-content">
                  {template.name}
                </p>
                <div className="flex items-center justify-between text-[8px] text-content-4">
                  <span className="capitalize">{template.category}</span>
                  <div className="flex items-center gap-0.5">
                    <Star className="h-2 w-2 fill-amber-400 text-amber-400" />
                    {template.rating?.toFixed(1) || "5.0"}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── AI Edit Inline Prompt ─── */

function AiEditInline({
  sectionType,
  onSubmit,
  loading,
}: {
  sectionType: string;
  onSubmit: (prompt: string) => void;
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600/10 to-purple-600/10 px-3 py-1.5 text-xs font-medium text-indigo-400 ring-1 ring-indigo-500/20 transition hover:from-indigo-600/20 hover:to-purple-600/20"
      >
        <Sparkles className="h-3 w-3" />
        AI Edit
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="relative flex-1">
        <Wand2 className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-indigo-400" />
        <input
          autoFocus
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && prompt.trim()) {
              onSubmit(prompt.trim());
              setPrompt("");
              setOpen(false);
            }
            if (e.key === "Escape") {
              setOpen(false);
              setPrompt("");
            }
          }}
          placeholder={`How should AI improve "${sectionType}"?`}
          className="w-full rounded-lg border border-indigo-500/30 bg-indigo-500/5 py-1.5 pl-8 pr-3 text-xs text-content placeholder:text-content-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>
      <button
        onClick={() => {
          if (prompt.trim()) {
            onSubmit(prompt.trim());
            setPrompt("");
            setOpen(false);
          }
        }}
        disabled={loading || !prompt.trim()}
        className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <ArrowRight className="h-3 w-3" />
        )}
      </button>
      <button
        onClick={() => {
          setOpen(false);
          setPrompt("");
        }}
        className="rounded-lg p-1.5 text-content-4 hover:text-content-2"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ─── Section Icon Map ─── */

const sectionIconMap: Record<string, { icon: LucideIcon; color: string }> = {
  experience: { icon: Briefcase, color: "amber" },
  education: { icon: GraduationCap, color: "sky" },
  skills: { icon: Target, color: "emerald" },
  certifications: { icon: Award, color: "orange" },
  projects: { icon: FolderOpen, color: "pink" },
};

/* ═══════════════════════════════════════════════════════════
   Structured Section Editors
   ═══════════════════════════════════════════════════════════ */

function ExperienceEditor({
  content,
  onChange,
}: {
  content: any;
  onChange: (c: any) => void;
}) {
  const items: any[] = content?.items || [];

  const updateItem = (i: number, updates: any) => {
    const next = [...items];
    next[i] = { ...next[i], ...updates };
    onChange({ ...content, items: next });
  };
  const removeItem = (i: number) =>
    onChange({
      ...content,
      items: items.filter((_: any, idx: number) => idx !== i),
    });
  const addItem = () =>
    onChange({
      ...content,
      items: [
        ...items,
        {
          title: "",
          company: "",
          location: "",
          startDate: "",
          endDate: "",
          description: "",
          highlights: [""],
        },
      ],
    });

  return (
    <div className="space-y-4">
      {items.map((item: any, i: number) => (
        <div
          key={i}
          className="rounded-xl border border-edge bg-field/30 p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-content-2">
              {item.title || item.company || `Experience ${i + 1}`}
            </span>
            <button
              onClick={() => removeItem(i)}
              className="rounded-lg p-1 text-content-4 hover:text-red-400 hover:bg-red-500/10 transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Job Title"
              value={item.title || ""}
              onChange={(e) => updateItem(i, { title: e.target.value })}
              placeholder="Software Engineer"
            />
            <Field
              label="Company"
              value={item.company || ""}
              onChange={(e) => updateItem(i, { company: e.target.value })}
              placeholder="Acme Inc."
            />
            <Field
              label="Location"
              optional
              value={item.location || ""}
              onChange={(e) => updateItem(i, { location: e.target.value })}
              placeholder="San Francisco, CA"
            />
            <div className="grid grid-cols-2 gap-2">
              <Field
                label="Start"
                type="month"
                value={item.startDate || ""}
                onChange={(e) => updateItem(i, { startDate: e.target.value })}
              />
              <Field
                label="End"
                type="month"
                value={item.endDate || ""}
                onChange={(e) => updateItem(i, { endDate: e.target.value })}
                placeholder="Present"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-3">
              Description
            </label>
            <textarea
              value={item.description || ""}
              onChange={(e) => updateItem(i, { description: e.target.value })}
              rows={2}
              placeholder="Brief description of your role..."
              className="w-full resize-none rounded-xl border border-edge bg-field px-3 py-2.5 text-sm text-content placeholder:text-content-4 focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
            />
          </div>
          {/* Highlights / Bullets */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-3">
              Key Achievements
            </label>
            <div className="space-y-1.5">
              {(item.highlights || [""]).map((h: string, hi: number) => (
                <div key={hi} className="flex items-center gap-2">
                  <span className="text-[10px] text-content-4 w-4 text-center">
                    &bull;
                  </span>
                  <input
                    value={h}
                    onChange={(e) => {
                      const hl = [...(item.highlights || [""])];
                      hl[hi] = e.target.value;
                      updateItem(i, { highlights: hl });
                    }}
                    placeholder="Achieved X by doing Y resulting in Z..."
                    className="flex-1 rounded-lg border border-edge bg-field px-3 py-2 text-sm text-content placeholder:text-content-4 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 transition"
                  />
                  <button
                    onClick={() => {
                      const hl = (item.highlights || [""]).filter(
                        (_: string, j: number) => j !== hi,
                      );
                      updateItem(i, {
                        highlights: hl.length ? hl : [""],
                      });
                    }}
                    className="rounded p-1 text-content-4 hover:text-red-400 transition"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={() =>
                  updateItem(i, {
                    highlights: [...(item.highlights || [""]), ""],
                  })
                }
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium text-indigo-400 hover:bg-indigo-500/10 transition"
              >
                <Plus className="h-3 w-3" /> Add bullet
              </button>
            </div>
          </div>
        </div>
      ))}
      <button
        onClick={addItem}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-edge py-3 text-xs font-medium text-content-3 transition hover:border-indigo-500/40 hover:text-indigo-400 hover:bg-indigo-500/5"
      >
        <Plus className="h-3.5 w-3.5" /> Add Experience
      </button>
    </div>
  );
}

function EducationEditor({
  content,
  onChange,
}: {
  content: any;
  onChange: (c: any) => void;
}) {
  const items: any[] = content?.items || [];
  const updateItem = (i: number, updates: any) => {
    const next = [...items];
    next[i] = { ...next[i], ...updates };
    onChange({ ...content, items: next });
  };
  const removeItem = (i: number) =>
    onChange({
      ...content,
      items: items.filter((_: any, idx: number) => idx !== i),
    });
  const addItem = () =>
    onChange({
      ...content,
      items: [
        ...items,
        {
          degree: "",
          institution: "",
          location: "",
          startDate: "",
          endDate: "",
          description: "",
        },
      ],
    });

  return (
    <div className="space-y-4">
      {items.map((item: any, i: number) => (
        <div
          key={i}
          className="rounded-xl border border-edge bg-field/30 p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-content-2">
              {item.degree || item.institution || `Education ${i + 1}`}
            </span>
            <button
              onClick={() => removeItem(i)}
              className="rounded-lg p-1 text-content-4 hover:text-red-400 hover:bg-red-500/10 transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Degree"
              value={item.degree || ""}
              onChange={(e) => updateItem(i, { degree: e.target.value })}
              placeholder="Bachelor of Science in Computer Science"
            />
            <Field
              label="Institution"
              value={item.institution || ""}
              onChange={(e) => updateItem(i, { institution: e.target.value })}
              placeholder="MIT"
            />
            <Field
              label="Location"
              optional
              value={item.location || ""}
              onChange={(e) => updateItem(i, { location: e.target.value })}
              placeholder="Cambridge, MA"
            />
            <div className="grid grid-cols-2 gap-2">
              <Field
                label="Start"
                type="month"
                value={item.startDate || ""}
                onChange={(e) => updateItem(i, { startDate: e.target.value })}
              />
              <Field
                label="End"
                type="month"
                value={item.endDate || ""}
                onChange={(e) => updateItem(i, { endDate: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-3">
              Description
            </label>
            <textarea
              value={item.description || ""}
              onChange={(e) => updateItem(i, { description: e.target.value })}
              rows={2}
              placeholder="Relevant coursework, honors, activities..."
              className="w-full resize-none rounded-xl border border-edge bg-field px-3 py-2.5 text-sm text-content placeholder:text-content-4 focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
            />
          </div>
        </div>
      ))}
      <button
        onClick={addItem}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-edge py-3 text-xs font-medium text-content-3 transition hover:border-sky-500/40 hover:text-sky-400 hover:bg-sky-500/5"
      >
        <Plus className="h-3.5 w-3.5" /> Add Education
      </button>
    </div>
  );
}

function SkillsEditor({
  content,
  onChange,
}: {
  content: any;
  onChange: (c: any) => void;
}) {
  const categories: { name: string; skills: string[] }[] =
    content?.categories || [];
  const [inputs, setInputs] = useState<Record<number, string>>({});

  const updateCat = (i: number, updates: any) => {
    const next = [...categories];
    next[i] = { ...next[i], ...updates };
    onChange({ ...content, categories: next });
  };
  const removeCat = (i: number) =>
    onChange({
      ...content,
      categories: categories.filter((_: any, idx: number) => idx !== i),
    });
  const addCat = () =>
    onChange({
      ...content,
      categories: [...categories, { name: "", skills: [] }],
    });
  const addSkill = (i: number) => {
    const v = (inputs[i] || "").trim();
    if (v && !categories[i].skills.includes(v)) {
      updateCat(i, { skills: [...categories[i].skills, v] });
      setInputs({ ...inputs, [i]: "" });
    }
  };

  return (
    <div className="space-y-4">
      {categories.map((cat, i) => (
        <div
          key={i}
          className="rounded-xl border border-edge bg-field/30 p-4 space-y-3"
        >
          <div className="flex items-center gap-3">
            <input
              value={cat.name}
              onChange={(e) => updateCat(i, { name: e.target.value })}
              placeholder="Category name (e.g. Programming Languages)"
              className="flex-1 rounded-lg border border-edge bg-field px-3 py-2 text-sm font-medium text-content placeholder:text-content-4 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 transition"
            />
            <button
              onClick={() => removeCat(i)}
              className="rounded-lg p-1.5 text-content-4 hover:text-red-400 hover:bg-red-500/10 transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {cat.skills.map((skill, si) => (
              <span
                key={si}
                className="group inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20"
              >
                {skill}
                <button
                  onClick={() =>
                    updateCat(i, {
                      skills: cat.skills.filter(
                        (_: string, j: number) => j !== si,
                      ),
                    })
                  }
                  className="ml-0.5 rounded p-0.5 text-emerald-400/50 hover:text-red-400 transition"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              value={inputs[i] || ""}
              onChange={(e) => setInputs({ ...inputs, [i]: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && addSkill(i)}
              placeholder="Type a skill and press Enter..."
              className="flex-1 rounded-lg border border-edge bg-field px-3 py-2 text-sm text-content placeholder:text-content-4 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 transition"
            />
            <button
              onClick={() => addSkill(i)}
              className="rounded-lg bg-emerald-600/10 px-3 py-2 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20 hover:bg-emerald-600/20 transition"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}
      <button
        onClick={addCat}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-edge py-3 text-xs font-medium text-content-3 transition hover:border-emerald-500/40 hover:text-emerald-400 hover:bg-emerald-500/5"
      >
        <Plus className="h-3.5 w-3.5" /> Add Skills Category
      </button>
    </div>
  );
}

function CertificationsEditor({
  content,
  onChange,
}: {
  content: any;
  onChange: (c: any) => void;
}) {
  const items: any[] = content?.items || [];
  const updateItem = (i: number, updates: any) => {
    const next = [...items];
    next[i] = { ...next[i], ...updates };
    onChange({ ...content, items: next });
  };
  const removeItem = (i: number) =>
    onChange({
      ...content,
      items: items.filter((_: any, idx: number) => idx !== i),
    });
  const addItem = () =>
    onChange({
      ...content,
      items: [...items, { name: "", issuer: "", date: "", url: "" }],
    });

  return (
    <div className="space-y-4">
      {items.map((item: any, i: number) => (
        <div
          key={i}
          className="rounded-xl border border-edge bg-field/30 p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-content-2">
              {item.name || `Certification ${i + 1}`}
            </span>
            <button
              onClick={() => removeItem(i)}
              className="rounded-lg p-1 text-content-4 hover:text-red-400 hover:bg-red-500/10 transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Certification Name"
              value={item.name || ""}
              onChange={(e) => updateItem(i, { name: e.target.value })}
              placeholder="AWS Solutions Architect"
            />
            <Field
              label="Issuer"
              value={item.issuer || ""}
              onChange={(e) => updateItem(i, { issuer: e.target.value })}
              placeholder="Amazon Web Services"
            />
            <Field
              label="Date"
              type="month"
              value={item.date || ""}
              onChange={(e) => updateItem(i, { date: e.target.value })}
            />
            <Field
              label="Verification URL"
              optional
              type="url"
              value={item.url || ""}
              onChange={(e) => updateItem(i, { url: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>
      ))}
      <button
        onClick={addItem}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-edge py-3 text-xs font-medium text-content-3 transition hover:border-orange-500/40 hover:text-orange-400 hover:bg-orange-500/5"
      >
        <Plus className="h-3.5 w-3.5" /> Add Certification
      </button>
    </div>
  );
}

function ProjectsEditor({
  content,
  onChange,
}: {
  content: any;
  onChange: (c: any) => void;
}) {
  const items: any[] = content?.items || [];
  const updateItem = (i: number, updates: any) => {
    const next = [...items];
    next[i] = { ...next[i], ...updates };
    onChange({ ...content, items: next });
  };
  const removeItem = (i: number) =>
    onChange({
      ...content,
      items: items.filter((_: any, idx: number) => idx !== i),
    });
  const addItem = () =>
    onChange({
      ...content,
      items: [
        ...items,
        { name: "", description: "", technologies: "", url: "" },
      ],
    });

  return (
    <div className="space-y-4">
      {items.map((item: any, i: number) => (
        <div
          key={i}
          className="rounded-xl border border-edge bg-field/30 p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-content-2">
              {item.name || `Project ${i + 1}`}
            </span>
            <button
              onClick={() => removeItem(i)}
              className="rounded-lg p-1 text-content-4 hover:text-red-400 hover:bg-red-500/10 transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Project Name"
              value={item.name || ""}
              onChange={(e) => updateItem(i, { name: e.target.value })}
              placeholder="My Awesome Project"
            />
            <Field
              label="Technologies"
              optional
              value={item.technologies || ""}
              onChange={(e) => updateItem(i, { technologies: e.target.value })}
              placeholder="React, Node.js, MongoDB"
            />
            <Field
              label="Live URL"
              optional
              type="url"
              value={item.url || ""}
              onChange={(e) => updateItem(i, { url: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-3">
              Description
            </label>
            <textarea
              value={item.description || ""}
              onChange={(e) => updateItem(i, { description: e.target.value })}
              rows={2}
              placeholder="Brief description of the project..."
              className="w-full resize-none rounded-xl border border-edge bg-field px-3 py-2.5 text-sm text-content placeholder:text-content-4 focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
            />
          </div>
        </div>
      ))}
      <button
        onClick={addItem}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-edge py-3 text-xs font-medium text-content-3 transition hover:border-pink-500/40 hover:text-pink-400 hover:bg-pink-500/5"
      >
        <Plus className="h-3.5 w-3.5" /> Add Project
      </button>
    </div>
  );
}

function GenericSectionEditor({
  content,
  onChange,
}: {
  content: any;
  onChange: (c: any) => void;
}) {
  const [raw, setRaw] = useState(() => JSON.stringify(content, null, 2));

  const handleBlur = () => {
    try {
      onChange(JSON.parse(raw));
    } catch {
      toast.error("Invalid JSON — changes not applied");
    }
  };

  return (
    <div>
      <div className="mb-2 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
        <Info className="h-3.5 w-3.5 mt-0.5 text-amber-400 shrink-0" />
        <p className="text-[11px] text-content-3">
          This section type doesn&apos;t have a structured editor yet. You can
          edit the raw JSON data below, or use AI Edit to make changes.
        </p>
      </div>
      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        onBlur={handleBlur}
        rows={8}
        className="w-full resize-y rounded-xl border border-edge bg-field px-4 py-3 font-mono text-xs text-content placeholder:text-content-4 focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main Page Component — Edit CV
   ═══════════════════════════════════════════════════════════ */

export default function EditCvPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  // ── Core State ──
  const [cv, setCv] = useState<Cv | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [aiEditingSection, setAiEditingSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"content" | "preview">("content");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">(
    "desktop",
  );
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(),
  );
  const [slugCopied, setSlugCopied] = useState(false);
  const [showPublishSuccess, setShowPublishSuccess] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // ── Auto-save ──
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const initialLoad = useRef(true);

  // ── Template State ──
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const { subscription } = useSubscriptionStore();

  const canUseTemplate = useCallback(
    (t: Template) => {
      if (!t.isPremium && !t.isEnterprise) return true;
      if (t.isEnterprise && subscription?.plan === "enterprise") return true;
      if (
        t.isPremium &&
        (subscription?.plan === "premium" ||
          subscription?.plan === "enterprise")
      )
        return true;
      return false;
    },
    [subscription],
  );

  /* ─── Load CV ─── */

  useEffect(() => {
    const loadCv = async () => {
      try {
        const res = await cvApi.getById(id);
        setCv(res.data);
        if (res.data.templateId) setSelectedTemplateId(res.data.templateId);
        // Expand all sections by default
        const expanded = new Set<string>();
        res.data.sections?.forEach((_: CvSection, i: number) => {
          expanded.add(String(i));
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
    loadCv();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /* ─── Load Templates ─── */

  useEffect(() => {
    const load = async () => {
      setTemplatesLoading(true);
      try {
        const res = await templatesApi.getAll();
        setTemplates(res.data);
      } catch {
        setTemplates([]);
      } finally {
        setTemplatesLoading(false);
      }
    };
    load();
  }, []);

  /* ─── Auto-save (debounced) ─── */

  const handleSave = useCallback(async () => {
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
        ...(selectedTemplateId ? { templateId: selectedTemplateId } : {}),
      });
      setCv(res.data);
      setHasUnsaved(false);
      setLastSaved(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    } catch (err: any) {
      if (err.response?.status === 403) {
        toast.error("Permission denied. Please re-login and try again.");
      } else {
        toast.error("Failed to save changes");
      }
    } finally {
      setSaving(false);
    }
  }, [cv, selectedTemplateId]);

  useEffect(() => {
    if (!cv) return;
    if (initialLoad.current) {
      initialLoad.current = false;
      return;
    }
    setHasUnsaved(true);
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      handleSave();
    }, 3000);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    cv?.title,
    cv?.summary,
    cv?.sections,
    cv?.personalInfo,
    cv?.theme,
    cv?.isPublic,
    selectedTemplateId,
  ]);

  /* ─── Completion Score ─── */

  const completionScore = useMemo(() => {
    if (!cv) return 0;
    let score = 0;
    if (cv.personalInfo?.fullName?.trim()) score += 10;
    if (cv.personalInfo?.email?.trim()) score += 5;
    const optionals = [
      cv.personalInfo?.phone,
      cv.personalInfo?.location,
      cv.personalInfo?.website,
      cv.personalInfo?.linkedin,
      cv.personalInfo?.github,
    ].filter((v) => v?.trim()).length;
    score += Math.min(optionals * 2, 10);
    if (cv.summary && cv.summary.length >= 100) score += 15;
    else if (cv.summary && cv.summary.length >= 50) score += 10;
    else if (cv.summary && cv.summary.length > 0) score += 5;
    const sections = cv.sections || [];
    const expSection = sections.find((s) => s.type === "experience");
    if (expSection?.content?.items?.length >= 2) score += 20;
    else if (expSection?.content?.items?.length === 1) score += 12;
    const skillsSection = sections.find((s) => s.type === "skills");
    const skillCount =
      skillsSection?.content?.categories?.reduce(
        (acc: number, c: any) => acc + (c.skills?.length || 0),
        0,
      ) || 0;
    if (skillCount >= 10) score += 15;
    else if (skillCount >= 5) score += 10;
    else if (skillCount > 0) score += 5;
    const eduSection = sections.find((s) => s.type === "education");
    if (eduSection?.content?.items?.length > 0) score += 15;
    const otherSections = sections.filter(
      (s) => !["experience", "skills", "education"].includes(s.type),
    );
    if (otherSections.length > 0) score += 10;
    return Math.min(score, 100);
  }, [cv]);

  /* ─── Actions ─── */

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

  const handleRegenerateHtml = async () => {
    if (!cv) return;
    setRegenerating(true);
    try {
      const res = await cvApi.regenerateHtml(cv._id);
      setCv(res.data);
      toast.success("Preview regenerated!");
    } catch {
      toast.error("Failed to regenerate preview");
    } finally {
      setRegenerating(false);
    }
  };

  const handleAiEditSection = async (sectionType: string, prompt: string) => {
    if (!cv) return;
    setAiEditingSection(sectionType);
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
      setAiEditingSection(null);
    }
  };

  const updatePersonalInfo = (field: string, value: string) => {
    if (!cv) return;
    setCv({
      ...cv,
      personalInfo: { ...cv.personalInfo, [field]: value },
    });
  };

  const updateSection = (index: number, updates: Partial<CvSection>) => {
    if (!cv) return;
    const sections = [...cv.sections];
    sections[index] = { ...sections[index], ...updates };
    setCv({ ...cv, sections });
  };

  const toggleSection = (index: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      const key = String(index);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const copySlugUrl = () => {
    if (!cv?.slug) return;
    navigator.clipboard.writeText(`${window.location.origin}/cv/${cv.slug}`);
    setSlugCopied(true);
    setTimeout(() => setSlugCopied(false), 2000);
  };

  /* ─── Render section editor based on type ─── */

  const renderSectionEditor = (section: CvSection, index: number) => {
    const handleChange = (newContent: any) =>
      updateSection(index, { content: newContent });

    switch (section.type) {
      case "experience":
        return (
          <ExperienceEditor content={section.content} onChange={handleChange} />
        );
      case "education":
        return (
          <EducationEditor content={section.content} onChange={handleChange} />
        );
      case "skills":
        return (
          <SkillsEditor content={section.content} onChange={handleChange} />
        );
      case "certifications":
        return (
          <CertificationsEditor
            content={section.content}
            onChange={handleChange}
          />
        );
      case "projects":
        return (
          <ProjectsEditor content={section.content} onChange={handleChange} />
        );
      default:
        return (
          <GenericSectionEditor
            content={section.content}
            onChange={handleChange}
          />
        );
    }
  };

  /* ═══════════════════════════════════════════════════════════
     Render
     ═══════════════════════════════════════════════════════════ */

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
    { key: "fullName", label: "Full Name", required: true },
    { key: "email", label: "Email", required: true },
    { key: "phone", label: "Phone" },
    { key: "location", label: "Location" },
    { key: "website", label: "Website" },
    { key: "linkedin", label: "LinkedIn" },
    { key: "github", label: "GitHub" },
  ];

  const sectionColors: Record<
    string,
    { bg: string; text: string; ring: string }
  > = {
    amber: {
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      ring: "ring-amber-500/20",
    },
    sky: { bg: "bg-sky-500/10", text: "text-sky-400", ring: "ring-sky-500/20" },
    emerald: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      ring: "ring-emerald-500/20",
    },
    orange: {
      bg: "bg-orange-500/10",
      text: "text-orange-400",
      ring: "ring-orange-500/20",
    },
    pink: {
      bg: "bg-pink-500/10",
      text: "text-pink-400",
      ring: "ring-pink-500/20",
    },
    indigo: {
      bg: "bg-indigo-500/10",
      text: "text-indigo-400",
      ring: "ring-indigo-500/20",
    },
  };

  return (
    <div className="pb-20 sm:pb-8">
      {/* ══════════════ Top Bar ══════════════ */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex-shrink-0 rounded-xl p-2.5 text-content-3 transition hover:bg-card-hover hover:text-content"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
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
              {/* Auto-save indicator */}
              <span className="text-[10px] text-content-4">
                {saving ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="h-2.5 w-2.5 animate-spin" /> Saving...
                  </span>
                ) : lastSaved ? (
                  <span className="flex items-center gap-1">
                    <Check className="h-2.5 w-2.5 text-emerald-400" /> Saved at{" "}
                    {lastSaved}
                  </span>
                ) : hasUnsaved ? (
                  <span className="text-amber-400">Unsaved changes</span>
                ) : null}
              </span>
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

      {/* ══════════════ Publish Success Banner ══════════════ */}
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

      {/* ══════════════ Completion Score Bar ══════════════ */}
      <div className="mb-6 rounded-2xl border border-edge bg-card/80 backdrop-blur-sm p-4">
        <div className="flex items-center gap-4">
          <CompletionRing score={completionScore} size={52} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-content">
                CV Strength:{" "}
                <span
                  className={
                    completionScore >= 80
                      ? "text-emerald-400"
                      : completionScore >= 60
                        ? "text-amber-400"
                        : "text-red-400"
                  }
                >
                  {completionScore >= 80
                    ? "Excellent"
                    : completionScore >= 60
                      ? "Good"
                      : completionScore >= 40
                        ? "Fair"
                        : "Needs Work"}
                </span>
              </h3>
            </div>
            <p className="mt-0.5 text-xs text-content-3">
              {completionScore >= 80
                ? "Your CV is comprehensive and ready to publish!"
                : completionScore >= 60
                  ? "Looking good! Consider filling a few more sections."
                  : "Add more content to improve your CV\u2019s impact."}
            </p>
          </div>
          {/* Quick section badges */}
          <div className="hidden sm:flex items-center gap-1.5 flex-wrap">
            {[
              {
                label: "Personal",
                filled: !!(cv.personalInfo?.fullName && cv.personalInfo?.email),
              },
              {
                label: "Summary",
                filled: (cv.summary?.length || 0) >= 50,
              },
              {
                label: "Experience",
                filled: cv.sections?.some(
                  (s) =>
                    s.type === "experience" && s.content?.items?.length > 0,
                ),
              },
              {
                label: "Skills",
                filled: cv.sections?.some(
                  (s) =>
                    s.type === "skills" &&
                    s.content?.categories?.some(
                      (c: any) => c.skills?.length > 0,
                    ),
                ),
              },
              {
                label: "Education",
                filled: cv.sections?.some(
                  (s) => s.type === "education" && s.content?.items?.length > 0,
                ),
              },
            ].map((item) => (
              <span
                key={item.label}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium ${
                  item.filled
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-field text-content-4"
                }`}
              >
                {item.filled && <CheckCircle2 className="h-2.5 w-2.5" />}
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════ Mobile Tab Switcher ══════════════ */}
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

      {/* ══════════════ Two-Column Layout ══════════════ */}
      <div className="grid gap-6 lg:grid-cols-[1fr,400px] xl:grid-cols-[1fr,440px]">
        {/* ── Editor Panel ── */}
        <div
          className={`space-y-5 ${activeTab === "preview" ? "hidden lg:block" : ""}`}
        >
          {/* Personal Information */}
          <div className="rounded-2xl border border-edge bg-card overflow-hidden">
            <SectionHeader
              icon={User}
              color="indigo"
              title="Personal Information"
              subtitle="Contact details & social links"
            />
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              {personalFields.map(({ key, label, required }) => (
                <div key={key}>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-content-3">
                    {label}
                    {required ? (
                      <span className="text-indigo-400 text-[10px]">*</span>
                    ) : (
                      <span className="text-content-4 font-normal text-[10px]">
                        (optional)
                      </span>
                    )}
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
            <SectionHeader
              icon={FileText}
              color="purple"
              title="Professional Summary"
              subtitle="A compelling overview of your career"
              action={
                <AiEditInline
                  sectionType="summary"
                  loading={aiEditingSection === "summary"}
                  onSubmit={(prompt) => handleAiEditSection("summary", prompt)}
                />
              }
            />
            <div className="p-5">
              <textarea
                value={cv.summary || ""}
                onChange={(e) => setCv({ ...cv, summary: e.target.value })}
                rows={4}
                placeholder="Write a compelling professional summary..."
                className="w-full resize-none rounded-xl border border-edge bg-field px-4 py-3 text-sm text-content placeholder:text-content-4 focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
              />
              <div className="mt-2 flex items-center justify-between text-[10px] text-content-4">
                <span>{cv.summary?.length || 0} characters</span>
                {cv.summary && cv.summary.length < 50 && (
                  <span className="text-amber-400">
                    Aim for at least 50 characters
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Theme & Template */}
          <div className="rounded-2xl border border-edge bg-card overflow-hidden">
            <SectionHeader
              icon={Palette}
              color="amber"
              title="Theme & Template"
              subtitle="Customize the look and feel"
            />
            <div className="p-5 space-y-5">
              {/* Theme Settings */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-content-3">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={cv.theme?.primaryColor || "#4f46e5"}
                      onChange={(e) =>
                        setCv({
                          ...cv,
                          theme: {
                            ...cv.theme,
                            primaryColor: e.target.value,
                          },
                        })
                      }
                      className="h-10 w-10 cursor-pointer rounded-lg border border-edge bg-transparent"
                    />
                    <input
                      value={cv.theme?.primaryColor || "#4f46e5"}
                      onChange={(e) =>
                        setCv({
                          ...cv,
                          theme: {
                            ...cv.theme,
                            primaryColor: e.target.value,
                          },
                        })
                      }
                      className="flex-1 rounded-xl border border-edge bg-field px-3 py-2.5 text-sm text-content focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-content-3">
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
                  <label className="mb-1.5 block text-xs font-medium text-content-3">
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
              {/* Template Selector */}
              <div className="border-t border-edge pt-5">
                <TemplateSelector
                  templates={templates}
                  selectedId={selectedTemplateId}
                  onSelect={setSelectedTemplateId}
                  loading={templatesLoading}
                  canUse={canUseTemplate}
                />
              </div>
            </div>
          </div>

          {/* Sections */}
          {cv.sections?.map((section, idx) => {
            const iconConfig = sectionIconMap[section.type] || {
              icon: FileText,
              color: "indigo",
            };
            const colorStyle =
              sectionColors[iconConfig.color] || sectionColors.indigo;
            const isExpanded = expandedSections.has(String(idx));
            const SectionIcon = iconConfig.icon;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-edge bg-card overflow-hidden"
              >
                <button
                  onClick={() => toggleSection(idx)}
                  className="flex w-full items-center justify-between px-5 py-4 transition hover:bg-card-hover"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl ${colorStyle.bg} ${colorStyle.text} ring-1 ${colorStyle.ring}`}
                    >
                      <SectionIcon className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-sm font-semibold text-content">
                        {section.title}
                      </h3>
                      <span className="text-[10px] text-content-4 capitalize">
                        {section.type}
                        {section.content?.items?.length > 0 &&
                          ` \u00B7 ${section.content.items.length} item${section.content.items.length > 1 ? "s" : ""}`}
                        {section.content?.categories?.length > 0 &&
                          ` \u00B7 ${section.content.categories.reduce((a: number, c: any) => a + (c.skills?.length || 0), 0)} skills`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${
                        section.visible
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-content-4/10 text-content-4"
                      }`}
                    >
                      {section.visible ? "Visible" : "Hidden"}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-content-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                    />
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-edge">
                    {/* Section toolbar */}
                    <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-edge/50 bg-field/20">
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
                      <AiEditInline
                        sectionType={section.type}
                        loading={aiEditingSection === section.type}
                        onSubmit={(prompt) =>
                          handleAiEditSection(section.type, prompt)
                        }
                      />
                    </div>
                    {/* Section content editor */}
                    <div className="p-5">
                      {renderSectionEditor(section, idx)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Preview Panel (sticky) ── */}
        <div className={`${activeTab === "content" ? "hidden lg:block" : ""}`}>
          <div className="lg:sticky lg:top-4">
            {/* Preview header */}
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-content flex items-center gap-2">
                <Eye className="h-4 w-4 text-content-3" />
                Live Preview
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRegenerateHtml}
                  disabled={regenerating}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-edge bg-card px-2.5 py-1.5 text-[11px] font-medium text-content-2 transition hover:bg-card-hover disabled:opacity-50"
                  title="Regenerate preview from current data"
                >
                  {regenerating ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                  Regenerate
                </button>
                <div className="flex items-center gap-0.5 rounded-lg border border-edge bg-card p-0.5">
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
            </div>

            {/* Preview frame */}
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
                  <p className="text-xs text-content-4 mb-4">
                    Click &quot;Regenerate&quot; to create a preview from your
                    current content
                  </p>
                  <button
                    onClick={handleRegenerateHtml}
                    disabled={regenerating}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {regenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Generate Preview
                  </button>
                </div>
              )}
            </div>

            {/* Public link */}
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
