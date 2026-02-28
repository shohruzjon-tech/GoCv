"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Briefcase,
  GraduationCap,
  Award,
  FolderOpen,
  FileText,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  Wand2,
  Target,
  ChevronDown,
  X,
  Upload,
  RefreshCw,
  Eye,
  CheckCircle2,
  TrendingUp,
  Lightbulb,
  Info,
  Camera,
  Brain,
  FileUp,
  Palette,
  Crown,
  Lock,
  Star,
  type LucideIcon,
} from "lucide-react";
import { cvApi, aiApi, uploadApi, templatesApi } from "@/lib/api";
import { Template } from "@/types";
import { useSubscriptionStore } from "@/lib/store";
import toast from "react-hot-toast";

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */

interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
}

interface ExperienceEntry {
  id: string;
  company: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
}

interface ProjectEntry {
  id: string;
  name: string;
  description: string;
  technologies: string;
  liveUrl: string;
  sourceUrl: string;
}

interface EducationEntry {
  id: string;
  degree: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa: string;
  honors: string;
}

interface CertificationEntry {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url: string;
}

interface SkillsData {
  technical: string[];
  tools: string[];
  soft: string[];
  languages: string[];
}

/* ═══════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════ */

const uid = () => Math.random().toString(36).slice(2, 10);

const STEP_COLORS: Record<string, { bg: string; text: string; ring: string }> =
  {
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
    violet: {
      bg: "bg-violet-500/10",
      text: "text-violet-400",
      ring: "ring-violet-500/20",
    },
  };

const POLISH_SECTIONS = [
  { id: "personal", label: "Personal Info", icon: User, color: "indigo" },
  {
    id: "summary",
    label: "Professional Summary",
    icon: FileText,
    color: "purple",
  },
  { id: "skills", label: "Core Skills", icon: Target, color: "emerald" },
  {
    id: "experience",
    label: "Work Experience",
    icon: Briefcase,
    color: "amber",
  },
  { id: "projects", label: "Projects", icon: FolderOpen, color: "pink" },
  { id: "education", label: "Education", icon: GraduationCap, color: "sky" },
  {
    id: "certifications",
    label: "Certifications",
    icon: Award,
    color: "orange",
  },
];

/* ═══════════════════════════════════════════════════════════
   Reusable Components
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
      <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-content-2">
        {label}
        {optional ? (
          <span className="text-content-4 font-normal text-xs">(optional)</span>
        ) : (
          <span className="text-indigo-400 text-xs">*</span>
        )}
      </label>
      <input
        {...props}
        className="w-full rounded-xl border border-edge bg-field px-4 py-3 text-sm text-content placeholder:text-content-4 focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
      />
    </div>
  );
}

function AiButton({
  onClick,
  loading,
  label = "AI Suggest",
}: {
  onClick: () => void;
  loading: boolean;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:shadow-indigo-500/30 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Wand2 className="h-4 w-4" />
      )}
      {label}
    </button>
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

/* ─── Polish Section Accordion ─── */

function PolishSection({
  icon: Icon,
  color,
  title,
  badge,
  isOpen,
  onToggle,
  action,
  children,
}: {
  icon: LucideIcon;
  color: string;
  title: string;
  badge?: string;
  isOpen: boolean;
  onToggle: () => void;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const c = STEP_COLORS[color] || STEP_COLORS.indigo;
  return (
    <div className="overflow-hidden rounded-2xl border border-edge bg-card/80 backdrop-blur-sm transition-all">
      <button
        onClick={onToggle}
        type="button"
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-card-hover"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${c.bg} ${c.text} ring-1 ${c.ring}`}
          >
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold text-content truncate">
            {title}
          </span>
          {badge && (
            <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
              {badge}
            </span>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-content-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="border-t border-edge/50 px-5 py-5 space-y-4">
          {action && <div className="flex justify-end">{action}</div>}
          {children}
        </div>
      )}
    </div>
  );
}

/* ─── Live CV Preview ─── */

function CvPreview({
  personalInfo,
  summary,
  skills,
  experience,
  projects,
  education,
  certifications,
  avatarUrl,
  selectedTemplate,
}: {
  personalInfo: PersonalInfo;
  summary: string;
  skills: SkillsData;
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  education: EducationEntry[];
  certifications: CertificationEntry[];
  avatarUrl?: string;
  selectedTemplate?: Template | null;
}) {
  const allSkills = [
    ...skills.technical,
    ...skills.tools,
    ...skills.soft,
    ...skills.languages,
  ];
  const hasContent =
    personalInfo.fullName ||
    summary ||
    allSkills.length > 0 ||
    experience.length > 0;

  if (!hasContent) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Eye className="mb-3 h-10 w-10 text-content-4" />
        <p className="text-sm text-content-3">
          Your CV preview will appear here
        </p>
        <p className="mt-1 text-xs text-content-4">
          Edit sections on the left to see changes
        </p>
      </div>
    );
  }

  /* Derive template-aware styles */
  const theme = selectedTemplate?.colorThemes?.[0];
  const bgColor = theme?.background || "#ffffff";
  const textColor = theme?.text || "#1f2937";
  const headingColor = theme?.heading || "#111827";
  const accentColor = theme?.accent || "#3b82f6";
  const primaryColor = theme?.primary || "#4f46e5";
  const secondaryColor = theme?.secondary || "#6b7280";

  const layout = selectedTemplate?.layoutConfig;
  const hasSidebar = layout?.columns === 2 || layout?.sidebarPosition;
  const sidebarPos = layout?.sidebarPosition || "left";
  const headerStyle = layout?.headerStyle || "centered";

  return (
    <div
      className="space-y-3 rounded-xl shadow-lg p-5 sm:p-6 text-[11px] leading-relaxed max-h-[calc(100vh-200px)] overflow-y-auto transition-colors duration-300"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      {/* Header */}
      <div
        className="border-b pb-3"
        style={{
          borderColor: `${primaryColor}30`,
          textAlign: headerStyle === "left-aligned" ? "left" : "center",
        }}
      >
        {avatarUrl && (
          <img
            src={avatarUrl}
            alt=""
            className="mx-auto mb-2 h-14 w-14 rounded-full object-cover"
            style={{ boxShadow: `0 0 0 2px ${primaryColor}40` }}
          />
        )}
        <h2
          className="text-sm font-bold uppercase tracking-wide"
          style={{ color: headingColor }}
        >
          {personalInfo.fullName || "Your Name"}
        </h2>
        <div
          className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px]"
          style={{
            color: secondaryColor,
            justifyContent:
              headerStyle === "left-aligned" ? "flex-start" : "center",
          }}
        >
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && <span>• {personalInfo.phone}</span>}
          {personalInfo.location && <span>• {personalInfo.location}</span>}
        </div>
        {(personalInfo.website ||
          personalInfo.linkedin ||
          personalInfo.github) && (
          <div className="mt-0.5 text-[10px]" style={{ color: accentColor }}>
            {[personalInfo.website, personalInfo.linkedin, personalInfo.github]
              .filter(Boolean)
              .join(" • ")}
          </div>
        )}
      </div>

      {/* Summary */}
      {summary && (
        <div>
          <h3
            className="text-[10px] font-bold uppercase tracking-wider border-b pb-1 mb-1.5"
            style={{ color: primaryColor, borderColor: `${primaryColor}25` }}
          >
            Professional Summary
          </h3>
          <p style={{ color: textColor }} className="whitespace-pre-line">
            {summary}
          </p>
        </div>
      )}

      {/* Skills */}
      {allSkills.length > 0 && (
        <div>
          <h3
            className="text-[10px] font-bold uppercase tracking-wider border-b pb-1 mb-1.5"
            style={{ color: primaryColor, borderColor: `${primaryColor}25` }}
          >
            Core Skills
          </h3>
          <p style={{ color: textColor }}>{allSkills.join(" • ")}</p>
        </div>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <div>
          <h3
            className="text-[10px] font-bold uppercase tracking-wider border-b pb-1 mb-1.5"
            style={{ color: primaryColor, borderColor: `${primaryColor}25` }}
          >
            Work Experience
          </h3>
          {experience.map((e, i) => (
            <div key={i} className={i > 0 ? "mt-2" : ""}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold" style={{ color: headingColor }}>
                  {e.title || "Position"}
                </span>
                <span
                  className="shrink-0 text-[9px]"
                  style={{ color: secondaryColor }}
                >
                  {e.startDate} — {e.current ? "Present" : e.endDate}
                </span>
              </div>
              <div style={{ color: secondaryColor }}>
                {e.company}
                {e.location ? ` · ${e.location}` : ""}
              </div>
              {e.bullets.filter((b) => b.trim()).length > 0 && (
                <ul
                  className="mt-1 ml-3 list-disc space-y-0.5"
                  style={{ color: textColor }}
                >
                  {e.bullets
                    .filter((b) => b.trim())
                    .map((b, j) => (
                      <li key={j}>{b}</li>
                    ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <div>
          <h3
            className="text-[10px] font-bold uppercase tracking-wider border-b pb-1 mb-1.5"
            style={{ color: primaryColor, borderColor: `${primaryColor}25` }}
          >
            Projects
          </h3>
          {projects.map((p, i) => (
            <div key={i} className={i > 0 ? "mt-1.5" : ""}>
              <span className="font-semibold" style={{ color: headingColor }}>
                {p.name || "Project"}
              </span>
              {p.technologies && (
                <span className="ml-1" style={{ color: secondaryColor }}>
                  ({p.technologies})
                </span>
              )}
              {p.description && (
                <p className="mt-0.5" style={{ color: textColor }}>
                  {p.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {education.length > 0 && (
        <div>
          <h3
            className="text-[10px] font-bold uppercase tracking-wider border-b pb-1 mb-1.5"
            style={{ color: primaryColor, borderColor: `${primaryColor}25` }}
          >
            Education
          </h3>
          {education.map((e, i) => (
            <div key={i} className={i > 0 ? "mt-1.5" : ""}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold" style={{ color: headingColor }}>
                  {e.degree || "Degree"}
                </span>
                <span
                  className="shrink-0 text-[9px]"
                  style={{ color: secondaryColor }}
                >
                  {e.startDate} — {e.endDate}
                </span>
              </div>
              <div style={{ color: secondaryColor }}>
                {e.institution}
                {e.location ? ` · ${e.location}` : ""}
              </div>
              {e.gpa && (
                <div style={{ color: secondaryColor }}>GPA: {e.gpa}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <div>
          <h3
            className="text-[10px] font-bold uppercase tracking-wider border-b pb-1 mb-1.5"
            style={{ color: primaryColor, borderColor: `${primaryColor}25` }}
          >
            Certifications
          </h3>
          {certifications.map((c, i) => (
            <div key={i} className={i > 0 ? "mt-1" : ""}>
              <span className="font-semibold" style={{ color: headingColor }}>
                {c.name || "Certification"}
              </span>
              {c.issuer && (
                <span style={{ color: secondaryColor }}> — {c.issuer}</span>
              )}
              {c.date && (
                <span
                  className="ml-1 text-[9px]"
                  style={{ color: secondaryColor }}
                >
                  ({c.date})
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Template Selector Component ─── */

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
  const scrollRef = useRef<HTMLDivElement>(null);

  const filtered =
    filterCategory === "all"
      ? templates
      : templates.filter((t) => t.category === filterCategory);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-content-3" />
          <span className="text-sm font-semibold text-content">
            Choose a Template
          </span>
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse shrink-0 w-36 h-48 rounded-xl border border-edge bg-card"
            >
              <div className="h-28 rounded-t-xl bg-card-hover" />
              <div className="p-2 space-y-2">
                <div className="h-3 w-2/3 rounded bg-card-hover" />
                <div className="h-2 w-full rounded bg-card-hover" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (templates.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-indigo-400" />
          <span className="text-sm font-semibold text-content">
            Choose a Template
          </span>
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

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-1.5">
        {["all", "minimal", "corporate", "creative", "tech", "executive"].map(
          (cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`rounded-full px-3 py-1 text-[11px] font-medium capitalize transition ${
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

      {/* Horizontal scrollable grid */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-edge scrollbar-track-transparent"
      >
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
              className={`group relative shrink-0 w-36 overflow-hidden rounded-xl border-2 text-left transition-all duration-200 ${
                isSelected
                  ? "border-indigo-500 ring-2 ring-indigo-500/30 scale-[1.02]"
                  : "border-edge hover:border-content-4"
              } ${locked ? "opacity-60" : ""}`}
            >
              {/* Preview gradient */}
              <div
                className={`relative h-24 bg-gradient-to-br ${templateCategoryColors[template.category] || "from-indigo-600 to-purple-700"} p-3`}
              >
                <div className="h-full overflow-hidden rounded-md bg-white/90 backdrop-blur-sm">
                  <div className="p-2 space-y-1">
                    <div
                      className="h-2 w-3/5 rounded"
                      style={{
                        backgroundColor:
                          template.colorThemes?.[0]?.primary || "#4f46e5",
                        opacity: 0.6,
                      }}
                    />
                    <div className="h-1.5 w-4/5 rounded bg-gray-300/60" />
                    <div className="h-1.5 w-3/5 rounded bg-gray-300/40" />
                    <div className="mt-1.5 space-y-1">
                      <div className="h-1 w-full rounded bg-gray-200/50" />
                      <div className="h-1 w-4/5 rounded bg-gray-200/50" />
                    </div>
                  </div>
                </div>
                {/* Badges */}
                <div className="absolute left-1.5 top-1.5 flex gap-1">
                  {template.isPremium && (
                    <span className="flex items-center gap-0.5 rounded-full bg-amber-500/90 px-1.5 py-0.5 text-[8px] font-bold text-black">
                      <Crown className="h-2.5 w-2.5" /> PRO
                    </span>
                  )}
                  {template.isEnterprise && (
                    <span className="flex items-center gap-0.5 rounded-full bg-purple-500/90 px-1.5 py-0.5 text-[8px] font-bold text-white">
                      <Sparkles className="h-2.5 w-2.5" /> ENT
                    </span>
                  )}
                </div>
                {locked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
                    <Lock className="h-5 w-5 text-white/80" />
                  </div>
                )}
                {isSelected && (
                  <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 shadow">
                    <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="bg-card p-2">
                <p className="truncate text-[11px] font-semibold text-content">
                  {template.name}
                </p>
                <div className="mt-0.5 flex items-center justify-between text-[9px] text-content-4">
                  <span className="capitalize">{template.category}</span>
                  <div className="flex items-center gap-0.5">
                    <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                    {template.rating?.toFixed(1) || "5.0"}
                  </div>
                </div>
                {template.colorThemes?.length > 0 && (
                  <div className="mt-1 flex gap-0.5">
                    {template.colorThemes.slice(0, 5).map((theme, i) => (
                      <div
                        key={i}
                        className="h-2.5 w-2.5 rounded-full ring-1 ring-black/10"
                        style={{ backgroundColor: theme.primary }}
                        title={theme.name}
                      />
                    ))}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Avatar Upload Component ─── */

function AvatarUpload({
  avatarUrl,
  uploading,
  onUpload,
}: {
  avatarUrl: string;
  uploading: boolean;
  onUpload: (file: File) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="group relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-edge bg-field transition-all hover:border-indigo-500/40 hover:bg-indigo-500/5"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            className="h-full w-full object-cover"
          />
        ) : (
          <Camera className="h-6 w-6 text-content-4 transition group-hover:text-indigo-400" />
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUpload(f);
          }}
        />
      </button>
      <div>
        <p className="text-sm font-medium text-content-2">
          {avatarUrl ? "Change photo" : "Upload photo"}
        </p>
        <p className="text-xs text-content-4">Optional · JPG, PNG up to 2 MB</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main Page Component — Polish Existing CV
   ═══════════════════════════════════════════════════════════ */

export default function PolishCvPage() {
  const router = useRouter();

  // ── Loading States ──
  const [aiLoading, setAiLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [polishing, setPolishing] = useState(false);

  // ── Real-time Status Steps ──
  const [statusSteps, setStatusSteps] = useState<
    { label: string; done: boolean }[]
  >([]);
  const [statusIndex, setStatusIndex] = useState(-1);

  // ── Polish Mode ──
  const [polishFile, setPolishFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const polishFileRef = useRef<HTMLInputElement>(null);
  const [polishReady, setPolishReady] = useState(false);
  const [polishOpenSections, setPolishOpenSections] = useState<Set<string>>(
    new Set([
      "personal",
      "summary",
      "skills",
      "experience",
      "projects",
      "education",
      "certifications",
    ]),
  );
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  // ── Avatar ──
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);

  // ── Data ──
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);
  const [dismissedRecs, setDismissedRecs] = useState<Set<string>>(new Set());

  // ── Form State ──
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    website: "",
    linkedin: "",
    github: "",
  });
  const [summary, setSummary] = useState("");
  const [skills, setSkills] = useState<SkillsData>({
    technical: [],
    tools: [],
    soft: [],
    languages: [],
  });
  const [skillInputs, setSkillInputs] = useState({
    technical: "",
    tools: "",
    soft: "",
    languages: "",
  });
  const [experience, setExperience] = useState<ExperienceEntry[]>([]);
  const [projects, setProjects] = useState<ProjectEntry[]>([]);
  const [education, setEducation] = useState<EducationEntry[]>([]);
  const [certifications, setCertifications] = useState<CertificationEntry[]>(
    [],
  );

  // ── Template Selection ──
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const { subscription } = useSubscriptionStore();

  const selectedTemplate = useMemo(
    () => templates.find((t) => t._id === selectedTemplateId) || null,
    [templates, selectedTemplateId],
  );

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

  useEffect(() => {
    const loadTemplates = async () => {
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
    loadTemplates();
  }, []);

  /* ─── Toggle polish section ─── */

  const togglePolishSection = (id: string) => {
    setPolishOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /* ─── Polish section badge text ─── */

  const polishBadge = (id: string): string | undefined => {
    switch (id) {
      case "personal": {
        const filled = Object.values(personalInfo).filter((v) =>
          v.trim(),
        ).length;
        return filled > 0 ? `${filled}/7` : undefined;
      }
      case "summary":
        return summary ? `${summary.length} chars` : undefined;
      case "skills": {
        const total = [
          ...skills.technical,
          ...skills.tools,
          ...skills.soft,
          ...skills.languages,
        ].length;
        return total > 0 ? `${total} skills` : undefined;
      }
      case "experience":
        return experience.length > 0
          ? `${experience.length} role${experience.length > 1 ? "s" : ""}`
          : undefined;
      case "projects":
        return projects.length > 0
          ? `${projects.length} project${projects.length > 1 ? "s" : ""}`
          : undefined;
      case "education":
        return education.length > 0 ? `${education.length}` : undefined;
      case "certifications":
        return certifications.length > 0
          ? `${certifications.length}`
          : undefined;
      default:
        return undefined;
    }
  };

  /* ─── Completion Score ─── */

  const completionScore = useMemo(() => {
    let score = 0;
    if (personalInfo.fullName.trim()) score += 5;
    if (personalInfo.email.trim()) score += 5;
    const optionalPersonal = [
      personalInfo.phone,
      personalInfo.location,
      personalInfo.website,
      personalInfo.linkedin,
      personalInfo.github,
    ].filter((v) => v.trim()).length;
    score += Math.min(optionalPersonal, 5);
    if (summary.length >= 100) score += 15;
    else if (summary.length >= 50) score += 10;
    else if (summary.length > 0) score += 5;
    const totalSkills = [
      ...skills.technical,
      ...skills.tools,
      ...skills.soft,
      ...skills.languages,
    ].length;
    if (totalSkills >= 10) score += 15;
    else if (totalSkills >= 5) score += 10;
    else if (totalSkills > 0) score += 5;
    if (experience.length >= 2) score += 15;
    else if (experience.length === 1) score += 10;
    const bulletsCount = experience.reduce(
      (acc, e) => acc + e.bullets.filter((b) => b.trim()).length,
      0,
    );
    if (bulletsCount >= 6) score += 10;
    else if (bulletsCount >= 3) score += 7;
    else if (bulletsCount > 0) score += 3;
    if (education.length > 0 && education[0].degree) score += 15;
    else if (education.length > 0) score += 8;
    if (projects.length >= 2) score += 10;
    else if (projects.length === 1) score += 6;
    if (certifications.length > 0) score += 5;
    return Math.min(score, 100);
  }, [
    personalInfo,
    summary,
    skills,
    experience,
    education,
    projects,
    certifications,
  ]);

  /* ─── Auto-save Draft ─── */

  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  useEffect(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      const draft = {
        personalInfo,
        summary,
        skills,
        experience,
        projects,
        education,
        certifications,
        wizardMode: "polish",
        polishReady,
        avatarUrl,
      };
      localStorage.setItem("cv_wizard_draft", JSON.stringify(draft));
      setLastSaved(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    }, 2000);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [
    personalInfo,
    summary,
    skills,
    experience,
    projects,
    education,
    certifications,
    polishReady,
    avatarUrl,
  ]);

  /* ─── Apply Extracted Data ─── */

  const applyExtractedData = useCallback((data: any) => {
    if (data.personalInfo) {
      setPersonalInfo((prev) => ({
        fullName: data.personalInfo.fullName || prev.fullName,
        email: data.personalInfo.email || prev.email,
        phone: data.personalInfo.phone || prev.phone,
        location: data.personalInfo.location || prev.location,
        website: data.personalInfo.website || prev.website,
        linkedin: data.personalInfo.linkedin || prev.linkedin,
        github: data.personalInfo.github || prev.github,
      }));
    }
    if (data.summary) setSummary(data.summary);
    if (data.skills)
      setSkills({
        technical: data.skills.technical || [],
        tools: data.skills.tools || [],
        soft: data.skills.soft || [],
        languages: data.skills.languages || [],
      });
    if (data.experience?.length) {
      setExperience(
        data.experience.map((e: any) => ({
          id: uid(),
          company: e.company || "",
          title: e.title || "",
          location: e.location || "",
          startDate: e.startDate || "",
          endDate: e.endDate || "",
          current: e.current || false,
          bullets: e.bullets?.length ? e.bullets : [""],
        })),
      );
    }
    if (data.projects?.length) {
      setProjects(
        data.projects
          .filter((p: any) => p.name)
          .map((p: any) => ({
            id: uid(),
            name: p.name || "",
            description: p.description || "",
            technologies: p.technologies || "",
            liveUrl: p.liveUrl || "",
            sourceUrl: p.sourceUrl || "",
          })),
      );
    }
    if (data.education?.length) {
      setEducation(
        data.education
          .filter((e: any) => e.degree || e.institution)
          .map((e: any) => ({
            id: uid(),
            degree: e.degree || "",
            institution: e.institution || "",
            location: e.location || "",
            startDate: e.startDate || "",
            endDate: e.endDate || "",
            gpa: e.gpa || "",
            honors: e.honors || "",
          })),
      );
    }
    if (data.certifications?.length) {
      setCertifications(
        data.certifications
          .filter((c: any) => c.name)
          .map((c: any) => ({
            id: uid(),
            name: c.name || "",
            issuer: c.issuer || "",
            date: c.date || "",
            url: c.url || "",
          })),
      );
    }
  }, []);

  /* ─── AI Recommendations ─── */

  const runAiRecommendations = async (extractedData: any) => {
    try {
      const dataSnapshot = {
        hasName: !!extractedData.personalInfo?.fullName,
        hasEmail: !!extractedData.personalInfo?.email,
        hasPhone: !!extractedData.personalInfo?.phone,
        hasLocation: !!extractedData.personalInfo?.location,
        hasWebsite: !!extractedData.personalInfo?.website,
        hasLinkedin: !!extractedData.personalInfo?.linkedin,
        hasGithub: !!extractedData.personalInfo?.github,
        hasSummary: !!extractedData.summary,
        skillCount: {
          technical: extractedData.skills?.technical?.length || 0,
          tools: extractedData.skills?.tools?.length || 0,
          soft: extractedData.skills?.soft?.length || 0,
          languages: extractedData.skills?.languages?.length || 0,
        },
        experienceCount: extractedData.experience?.length || 0,
        projectCount: extractedData.projects?.length || 0,
        educationCount: extractedData.education?.length || 0,
        certificationCount: extractedData.certifications?.length || 0,
      };
      const result = await askAi(
        "You are a CV optimization expert. Analyze this CV data snapshot and suggest 3-6 specific, actionable improvements. Focus on MISSING or WEAK sections. Return a JSON array of short recommendation strings. Return ONLY a valid JSON array of strings, no explanation.",
        JSON.stringify(dataSnapshot),
      );
      if (result) {
        try {
          const jsonMatch = result.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const recs = JSON.parse(jsonMatch[0]);
            if (Array.isArray(recs))
              setAiRecommendations(
                recs.filter((r: any) => typeof r === "string"),
              );
          }
        } catch {}
      }
    } catch {}
  };

  /* ─── AI Helper ─── */

  const askAi = async (
    systemPrompt: string,
    userPrompt: string,
  ): Promise<string | null> => {
    setAiLoading(true);
    try {
      const res = await aiApi.chat([
        { role: "user", content: `${systemPrompt}\n\n${userPrompt}` },
      ]);
      return res.data?.message || res.data?.content || null;
    } catch {
      toast.error("AI suggestion failed. Please try again.");
      return null;
    } finally {
      setAiLoading(false);
    }
  };

  /* ─── Avatar Upload ─── */

  const handleAvatarUpload = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2 MB");
      return;
    }
    setAvatarUploading(true);
    try {
      const res = await uploadApi.uploadImage(file);
      const url = res.data?.url || res.data?.imageUrl || "";
      if (url) {
        setAvatarUrl(url);
        toast.success("Photo uploaded!");
      } else {
        toast.error("Upload failed — no URL returned.");
      }
    } catch {
      toast.error("Photo upload failed.");
    } finally {
      setAvatarUploading(false);
    }
  };

  /* ─── Polish Upload (extract only) ─── */

  const handlePolishUpload = async (file: File) => {
    setPolishFile(file);
    setExtracting(true);

    // Setup real-time status steps
    const steps = [
      { label: "Uploading document...", done: false },
      { label: "Parsing file contents...", done: false },
      { label: "AI is reading your CV...", done: false },
      { label: "Extracting personal info...", done: false },
      { label: "Extracting work experience...", done: false },
      { label: "Extracting skills & education...", done: false },
      { label: "Generating recommendations...", done: false },
      { label: "Finalizing extraction...", done: false },
    ];
    setStatusSteps(steps);
    setStatusIndex(0);

    const advanceStep = (idx: number) => {
      setStatusSteps((prev) =>
        prev.map((s, i) => (i < idx ? { ...s, done: true } : s)),
      );
      setStatusIndex(idx);
    };

    try {
      advanceStep(1);
      const parseRes = await uploadApi.parseCvFile(file);
      const text = parseRes.data?.text || "";
      if (!text || text.length < 10) {
        toast.error("Could not read the file. Please try a different format.");
        setExtracting(false);
        setStatusSteps([]);
        setStatusIndex(-1);
        return;
      }
      advanceStep(2);
      // Simulate brief delay so user sees the step
      await new Promise((r) => setTimeout(r, 400));
      advanceStep(3);
      const extractRes = await aiApi.extractProfile(text, "file");
      const extracted = extractRes.data;
      advanceStep(4);
      await new Promise((r) => setTimeout(r, 300));
      advanceStep(5);
      if (extracted && typeof extracted === "object") {
        applyExtractedData(extracted);
        advanceStep(6);
        await new Promise((r) => setTimeout(r, 300));
        runAiRecommendations(extracted);
        advanceStep(7);
        await new Promise((r) => setTimeout(r, 300));
        setStatusSteps((prev) => prev.map((s) => ({ ...s, done: true })));
        toast.success("CV data extracted! Review and edit each section below.");
      } else {
        toast.error(
          "AI returned unexpected format. Please fill in details manually.",
        );
      }
      setPolishReady(true);
    } catch (err: any) {
      console.error("Polish upload error:", err);
      const msg = err?.response?.data?.message || "Failed to extract CV data.";
      toast.error(`${msg} Please fill in details manually.`);
      setPolishReady(true);
    } finally {
      setExtracting(false);
      setTimeout(() => {
        setStatusSteps([]);
        setStatusIndex(-1);
      }, 600);
    }
  };

  const handlePolishFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handlePolishUpload(file);
  };
  const handlePolishFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handlePolishUpload(file);
  };

  /* ─── Polish All Content ─── */

  const handlePolishContent = async () => {
    setPolishing(true);

    // Setup real-time status steps for polishing
    const polishSteps = [
      { label: "Analyzing current content...", done: false },
      { label: "Polishing professional summary...", done: false },
      ...experience.slice(0, 3).map((e, i) => ({
        label: `Enhancing ${e.title || `role ${i + 1}`} bullet points...`,
        done: false,
      })),
      { label: "Optimizing for ATS keywords...", done: false },
      { label: "Finalizing polished CV...", done: false },
    ];
    setStatusSteps(polishSteps);
    setStatusIndex(0);

    const advancePolishStep = (idx: number) => {
      setStatusSteps((prev) =>
        prev.map((s, i) => (i < idx ? { ...s, done: true } : s)),
      );
      setStatusIndex(idx);
    };

    try {
      let stepIdx = 1;
      if (summary && summary.length >= 10) {
        advancePolishStep(stepIdx);
        const polishedSummary = await askAi(
          "You are an expert CV writer. Rewrite and polish the following professional summary to be more impactful, concise, and ATS-optimized. Keep it 3-4 sentences. Return ONLY the polished summary text, no labels or prefixes.",
          summary,
        );
        if (polishedSummary)
          setSummary(
            polishedSummary
              .replace(/^(professional\s*summary[:\s]*)/i, "")
              .trim(),
          );
      }
      stepIdx++;
      for (let i = 0; i < Math.min(experience.length, 3); i++) {
        advancePolishStep(stepIdx);
        const entry = experience[i];
        if (entry?.bullets?.filter((b) => b.trim()).length > 0) {
          try {
            const bulletsResult = await askAi(
              "You are an expert CV writer. Polish these bullet points to follow the Action + Result + Metric format. Start each with a strong action verb. Return ONLY the polished bullets, one per line, each starting with '•'. No other text.",
              entry.bullets.filter((b) => b.trim()).join("\n"),
            );
            if (bulletsResult) {
              const newBullets = bulletsResult
                .split("\n")
                .map((b: string) => b.replace(/^[•\-\*]\s*/, "").trim())
                .filter((b: string) => b.length > 10);
              if (newBullets.length > 0)
                setExperience((prev) =>
                  prev.map((e, idx) =>
                    idx === i ? { ...e, bullets: newBullets } : e,
                  ),
                );
            }
          } catch {}
        }
        stepIdx++;
      }
      advancePolishStep(polishSteps.length - 1);
      await new Promise((r) => setTimeout(r, 300));
      setStatusSteps((prev) => prev.map((s) => ({ ...s, done: true })));
      toast.success("CV polished! Review the enhanced content.");
    } catch {
      toast.error("Polish failed. You can edit the content manually.");
    } finally {
      setPolishing(false);
      setTimeout(() => {
        setStatusSteps([]);
        setStatusIndex(-1);
      }, 600);
    }
  };

  /* ─── Load Pending Data from Landing Page ─── */

  useEffect(() => {
    const pending = localStorage.getItem("pending_cv_wizard");
    if (pending) {
      let data: Record<string, string>;
      try {
        data = JSON.parse(pending);
      } catch {
        return;
      }
      localStorage.removeItem("pending_cv_wizard");

      // Only handle polish mode
      const runExtraction = async () => {
        setExtracting(true);

        // Setup real-time status steps
        const steps = [
          { label: "Processing uploaded file...", done: false },
          { label: "Parsing document contents...", done: false },
          { label: "AI is reading your CV...", done: false },
          { label: "Extracting personal info...", done: false },
          { label: "Extracting work experience...", done: false },
          { label: "Extracting skills & education...", done: false },
          { label: "Generating recommendations...", done: false },
          { label: "Finalizing extraction...", done: false },
        ];
        setStatusSteps(steps);
        setStatusIndex(0);

        const advStep = (idx: number) => {
          setStatusSteps((prev) =>
            prev.map((s, i) => (i < idx ? { ...s, done: true } : s)),
          );
          setStatusIndex(idx);
        };

        try {
          let textToExtract = "";
          if (data.sourceType === "upload" && data.fileBase64) {
            advStep(1);
            const resp = await fetch(data.fileBase64);
            const blob = await resp.blob();
            const file = new File([blob], data.sourceFileName || "cv.pdf", {
              type: blob.type,
            });
            try {
              const parseRes = await uploadApi.parseCvFile(file);
              textToExtract = parseRes.data?.text || "";
            } catch {
              toast.error(
                "Could not parse file. Please fill in details manually.",
              );
              setPolishReady(true);
              setExtracting(false);
              setStatusSteps([]);
              setStatusIndex(-1);
              return;
            }
          } else if (
            (data.sourceType === "prompt" || data.sourceType === "linkedin") &&
            data.sourceText
          ) {
            advStep(1);
            textToExtract = data.sourceText;
          }
          advStep(2);
          if (textToExtract && textToExtract.length >= 10) {
            advStep(3);
            const sourceType =
              data.sourceType === "upload"
                ? "file"
                : data.sourceType === "linkedin"
                  ? "linkedin"
                  : "prompt";
            const res = await aiApi.extractProfile(
              textToExtract,
              sourceType as "prompt" | "linkedin" | "file",
            );
            const extracted = res.data;
            advStep(4);
            await new Promise((r) => setTimeout(r, 300));
            advStep(5);
            if (extracted && typeof extracted === "object") {
              applyExtractedData(extracted);
              advStep(6);
              await new Promise((r) => setTimeout(r, 300));
              runAiRecommendations(extracted);
              advStep(7);
              await new Promise((r) => setTimeout(r, 300));
              setStatusSteps((prev) => prev.map((s) => ({ ...s, done: true })));
              toast.success(
                "CV data extracted! Review and edit each section below.",
              );
            }
          }
          setPolishReady(true);
        } catch (err: any) {
          console.error("Polish extraction error:", err);
          toast.error(
            "AI extraction failed. You can fill in details manually.",
          );
          setPolishReady(true);
        } finally {
          setExtracting(false);
          setTimeout(() => {
            setStatusSteps([]);
            setStatusIndex(-1);
          }, 600);
        }
      };
      runExtraction();
      return;
    }

    // Restore draft
    const draft = localStorage.getItem("cv_wizard_draft");
    if (draft) {
      try {
        const d = JSON.parse(draft);
        if (d.wizardMode !== "polish") return; // wrong mode draft
        if (d.personalInfo) setPersonalInfo(d.personalInfo);
        if (d.summary) setSummary(d.summary);
        if (d.skills) setSkills(d.skills);
        if (d.experience?.length) setExperience(d.experience);
        if (d.projects?.length) setProjects(d.projects);
        if (d.education?.length) setEducation(d.education);
        if (d.certifications?.length) setCertifications(d.certifications);
        if (d.polishReady) setPolishReady(true);
        if (d.avatarUrl) setAvatarUrl(d.avatarUrl);
      } catch {}
    }
  }, [applyExtractedData]);

  /* ─── AI: Generate Summary ─── */

  const handleAiSummary = async () => {
    const expContext = experience
      .map((e) => `${e.title} at ${e.company}: ${e.bullets.join("; ")}`)
      .join("\n");
    const result = await askAi(
      "You are an expert CV writer. Generate a concise, impactful professional summary (3-4 sentences). Write in first person. Focus on years of experience, key specializations, top achievements, and career value proposition. Make it ATS-friendly. Do NOT include any prefix labels—just the summary text.",
      `Name: ${personalInfo.fullName}\nExperience:\n${expContext}\nSkills: ${[...skills.technical, ...skills.tools].join(", ")}`,
    );
    if (result) {
      setSummary(result.replace(/^(professional\s*summary[:\s]*)/i, "").trim());
      toast.success("Summary generated!");
    }
  };

  /* ─── AI: Suggest Skills ─── */

  const handleAiSkills = async () => {
    const expContext = experience
      .map((e) => `${e.title} at ${e.company}`)
      .join(", ");
    const result = await askAi(
      'You are an expert CV writer. Based on the professional background, suggest categorized skills. Return ONLY a valid JSON object with keys: "technical", "tools", "soft", "languages". Each should be an array of 4-8 relevant items. No markdown—just JSON.',
      `Experience: ${expContext}\nCurrent summary: ${summary}`,
    );
    if (result) {
      try {
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          setSkills({
            technical: parsed.technical || [],
            tools: parsed.tools || [],
            soft: parsed.soft || [],
            languages: parsed.languages || [],
          });
          toast.success("Skills suggested!");
        }
      } catch {
        toast.error("Could not parse AI response. Please add skills manually.");
      }
    }
  };

  /* ─── AI: Suggest Bullets ─── */

  const handleAiBullets = async (index: number) => {
    const entry = experience[index];
    if (!entry) return;
    const result = await askAi(
      "You are an expert CV writer. Generate 4 impactful bullet points for this work experience. Each bullet MUST follow Action + Result + Metric format. Return ONLY the bullet points, one per line, each starting with '•'.",
      `Role: ${entry.title}\nCompany: ${entry.company}\nLocation: ${entry.location}\nContext: ${summary}`,
    );
    if (result) {
      const bullets = result
        .split("\n")
        .map((b) => b.replace(/^[•\-\*]\s*/, "").trim())
        .filter((b) => b.length > 10);
      if (bullets.length > 0) {
        const updated = [...experience];
        updated[index] = { ...updated[index], bullets };
        setExperience(updated);
        toast.success("Bullet points generated!");
      }
    }
  };

  /* ─── AI: Suggest Project Description ─── */

  const handleAiProjectDesc = async (index: number) => {
    const entry = projects[index];
    if (!entry) return;
    const result = await askAi(
      "You are an expert CV writer. Write a concise, impactful project description (2-3 sentences). Highlight the problem solved, technologies, and impact. Return ONLY the description.",
      `Project: ${entry.name}\nTechnologies: ${entry.technologies}\nContext: ${summary}`,
    );
    if (result) {
      const updated = [...projects];
      updated[index] = { ...updated[index], description: result.trim() };
      setProjects(updated);
      toast.success("Description generated!");
    }
  };

  /* ─── Final Generate ─── */

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const cvData = {
        personalInfo,
        summary,
        skills,
        experience: experience.map(({ id, ...rest }) => rest),
        projects: projects.map(({ id, ...rest }) => rest),
        education: education.map(({ id, ...rest }) => rest),
        certifications: certifications.map(({ id, ...rest }) => rest),
        ...(avatarUrl ? { avatarUrl } : {}),
        ...(selectedTemplateId ? { templateId: selectedTemplateId } : {}),
      };
      const prompt = `Polish and regenerate this existing CV with improved formatting, stronger language, and ATS optimization. Keep factual content but enhance bullet points with Action + Result + Metric format. Structure: Contact Info, Professional Summary, Core Skills, Work Experience, Projects, Education, Certifications.${selectedTemplate ? `\n\nUse the "${selectedTemplate.name}" template style (${selectedTemplate.category} category).` : ""}\n\nData: ${JSON.stringify(cvData)}`;
      const res = await cvApi.aiGenerate({ prompt, context: cvData });
      localStorage.removeItem("pending_cv_wizard");
      localStorage.removeItem("cv_wizard_draft");
      toast.success("CV generated successfully!");
      router.push(`/dashboard/cv/${res.data._id}/edit`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to generate CV");
    } finally {
      setGenerating(false);
    }
  };

  /* ─── CRUD Helpers ─── */

  const addSkill = (category: keyof SkillsData) => {
    const v = skillInputs[category].trim();
    if (v && !skills[category].includes(v)) {
      setSkills({ ...skills, [category]: [...skills[category], v] });
      setSkillInputs({ ...skillInputs, [category]: "" });
    }
  };
  const removeSkill = (cat: keyof SkillsData, i: number) =>
    setSkills({ ...skills, [cat]: skills[cat].filter((_, idx) => idx !== i) });

  const addExperience = () =>
    setExperience([
      ...experience,
      {
        id: uid(),
        company: "",
        title: "",
        location: "",
        startDate: "",
        endDate: "",
        current: false,
        bullets: [""],
      },
    ]);
  const updateExperience = (i: number, u: Partial<ExperienceEntry>) =>
    setExperience(experience.map((e, idx) => (idx === i ? { ...e, ...u } : e)));
  const removeExperience = (i: number) =>
    setExperience(experience.filter((_, idx) => idx !== i));

  const addProject = () =>
    setProjects([
      ...projects,
      {
        id: uid(),
        name: "",
        description: "",
        technologies: "",
        liveUrl: "",
        sourceUrl: "",
      },
    ]);
  const updateProject = (i: number, u: Partial<ProjectEntry>) =>
    setProjects(projects.map((p, idx) => (idx === i ? { ...p, ...u } : p)));
  const removeProject = (i: number) =>
    setProjects(projects.filter((_, idx) => idx !== i));

  const addEducation = () =>
    setEducation([
      ...education,
      {
        id: uid(),
        degree: "",
        institution: "",
        location: "",
        startDate: "",
        endDate: "",
        gpa: "",
        honors: "",
      },
    ]);
  const updateEducation = (i: number, u: Partial<EducationEntry>) =>
    setEducation(education.map((e, idx) => (idx === i ? { ...e, ...u } : e)));
  const removeEducation = (i: number) =>
    setEducation(education.filter((_, idx) => idx !== i));

  const addCertification = () =>
    setCertifications([
      ...certifications,
      { id: uid(), name: "", issuer: "", date: "", url: "" },
    ]);
  const updateCertification = (i: number, u: Partial<CertificationEntry>) =>
    setCertifications(
      certifications.map((c, idx) => (idx === i ? { ...c, ...u } : c)),
    );
  const removeCertification = (i: number) =>
    setCertifications(certifications.filter((_, idx) => idx !== i));

  const addBullet = (ei: number) => {
    const u = [...experience];
    u[ei] = { ...u[ei], bullets: [...u[ei].bullets, ""] };
    setExperience(u);
  };
  const updateBullet = (ei: number, bi: number, v: string) => {
    const u = [...experience];
    const b = [...u[ei].bullets];
    b[bi] = v;
    u[ei] = { ...u[ei], bullets: b };
    setExperience(u);
  };
  const removeBullet = (ei: number, bi: number) => {
    const u = [...experience];
    u[ei] = { ...u[ei], bullets: u[ei].bullets.filter((_, i) => i !== bi) };
    setExperience(u);
  };

  /* ─── Flags ─── */

  const showPolishEditor = polishReady && !extracting && !polishing;
  const showPolishUpload = !polishReady && !extracting && !polishing;
  const hasData =
    personalInfo.fullName.trim() || summary || experience.length > 0;

  /* ═══════════════════════════════════════════════════════════
     Render
     ═══════════════════════════════════════════════════════════ */

  return (
    <div className="relative pb-8">
      {/* Header */}
      <div className="mb-8">
        {/* Mode Switcher - synced with landing page */}
        <div className="mb-5 flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/cv/generate")}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-content-3 transition hover:bg-card hover:text-content-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
          <div className="flex gap-1 rounded-xl bg-card p-1 border border-edge">
            <button
              onClick={() => router.push("/dashboard/cv/generate/ai")}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-content-3 transition hover:bg-card-hover hover:text-content"
            >
              <Brain className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Build with AI</span>
              <span className="sm:hidden">AI</span>
            </button>
            <button className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm">
              <Upload className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Polish Existing</span>
              <span className="sm:hidden">Polish</span>
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-content sm:text-3xl">
              Polish Your CV
            </h1>
            <p className="mt-1 text-sm text-content-3">
              Upload your existing CV — we&apos;ll split it into sections for
              you to review, edit, and preview
            </p>
          </div>
          <div className="flex items-center gap-4">
            {lastSaved && (
              <div className="hidden items-center gap-1.5 text-xs text-content-4 sm:flex">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400/70" />
                Saved {lastSaved}
              </div>
            )}
            {showPolishEditor && hasData && (
              <div className="flex items-center gap-3 rounded-2xl border border-edge bg-card/80 px-4 py-2.5 backdrop-blur-sm">
                <CompletionRing score={completionScore} size={44} />
                <div className="hidden sm:block">
                  <p className="text-xs font-semibold text-content">
                    CV Strength
                  </p>
                  <p className="text-xs text-content-3">
                    {completionScore >= 80
                      ? "Excellent"
                      : completionScore >= 60
                        ? "Good"
                        : completionScore >= 40
                          ? "Fair"
                          : "Getting started"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Area */}
      {showPolishUpload && (
        <div className="mb-8 overflow-hidden rounded-2xl border border-edge bg-card/80 backdrop-blur-sm">
          <div className="bg-gradient-to-r from-emerald-500/5 to-teal-500/5 p-8 sm:p-10">
            <div className="mx-auto max-w-lg text-center">
              <h2 className="mb-2 text-xl font-bold text-content">
                Upload Your Existing CV
              </h2>
              <p className="mb-6 text-sm text-content-3 leading-relaxed">
                Our AI will extract all your information into editable sections.
                You can then review, edit, and preview the result in real-time.
              </p>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handlePolishFileDrop}
                onClick={() => polishFileRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed py-14 transition-all duration-300 ${isDragOver ? "border-emerald-500 bg-emerald-500/10 scale-[1.01]" : "border-edge bg-field/50 hover:border-emerald-500/40 hover:bg-emerald-500/5"}`}
              >
                <input
                  ref={polishFileRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handlePolishFileSelect}
                  className="hidden"
                />
                <div className="mb-4 rounded-2xl bg-emerald-500/10 p-4 ring-1 ring-emerald-500/20">
                  <FileUp className="h-8 w-8 text-emerald-400" />
                </div>
                <p className="text-sm font-medium text-content-2">
                  Drop your CV here or{" "}
                  <span className="text-emerald-400 underline underline-offset-2">
                    browse files
                  </span>
                </p>
                <p className="mt-2 text-xs text-content-4">
                  Supports PDF, DOC, DOCX — up to 10MB
                </p>
              </div>

              {/* Or switch to AI generate mode */}
              <div className="mt-6 flex items-center justify-center gap-2">
                <span className="text-xs text-content-4">No CV yet?</span>
                <button
                  onClick={() => router.push("/dashboard/cv/generate/ai")}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
                >
                  <Brain className="h-3.5 w-3.5" />
                  Build with AI instead
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Extracting / Polishing Overlay — Real-time Status Timeline */}
      {(extracting || polishing) && (
        <div className="mb-8 overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-card to-teal-500/5 p-8 sm:p-10 backdrop-blur-sm">
          <div className="text-center mb-6">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
            </div>
            <h3 className="mb-1 text-xl font-bold text-content">
              {extracting ? "Extracting Your CV Data" : "AI is Polishing..."}
            </h3>
            <p className="mx-auto max-w-sm text-sm text-content-3 leading-relaxed">
              {extracting
                ? "Watch the progress below as AI reads and structures your document"
                : "Enhancing your summary, polishing bullet points with metrics, and optimizing for ATS"}
            </p>
          </div>

          {/* Live Step Timeline */}
          {statusSteps.length > 0 && (
            <div className="mx-auto max-w-md space-y-2">
              {statusSteps.map((s, i) => {
                const isActive = i === statusIndex;
                const isDone = s.done;
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 rounded-xl px-4 py-2.5 transition-all duration-500 ${
                      isDone
                        ? "bg-emerald-500/10"
                        : isActive
                          ? "bg-emerald-500/5 ring-1 ring-emerald-500/20"
                          : "opacity-40"
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : isActive ? (
                        <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-edge" />
                      )}
                    </div>
                    <span
                      className={`text-sm font-medium transition-colors duration-300 ${
                        isDone
                          ? "text-emerald-400"
                          : isActive
                            ? "text-content"
                            : "text-content-4"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Polishing mode fallback (no steps) */}
          {statusSteps.length === 0 && polishing && (
            <div className="mx-auto max-w-md space-y-2">
              {[
                "Analyzing professional summary...",
                "Polishing bullet points with metrics...",
                "Optimizing for ATS keywords...",
              ].map((label, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl px-4 py-2.5 bg-emerald-500/5 animate-pulse"
                  style={{ animationDelay: `${i * 500}ms` }}
                >
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-content-2">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Progress bar */}
          <div className="mt-6 mx-auto max-w-md">
            <div className="h-1.5 w-full rounded-full bg-emerald-400/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700 ease-out"
                style={{
                  width:
                    statusSteps.length > 0
                      ? `${Math.max(((statusIndex + 1) / statusSteps.length) * 100, 5)}%`
                      : "60%",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      {aiRecommendations.length > 0 &&
        aiRecommendations.filter((r) => !dismissedRecs.has(r)).length > 0 &&
        !extracting &&
        !polishing &&
        showPolishEditor && (
          <div className="mb-6 overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-orange-500/5 backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-amber-500/10 px-5 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-400">
                <Lightbulb className="h-4 w-4" />
                AI Recommendations
              </div>
              <button
                onClick={() => setDismissedRecs(new Set(aiRecommendations))}
                className="text-xs text-content-4 hover:text-content-3 transition"
              >
                Dismiss all
              </button>
            </div>
            <div className="divide-y divide-edge/50 px-5">
              {aiRecommendations
                .filter((r) => !dismissedRecs.has(r))
                .map((rec, i) => (
                  <div key={i} className="flex items-start gap-3 py-3">
                    <TrendingUp className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-400/70" />
                    <p className="flex-1 text-sm text-content-2">{rec}</p>
                    <button
                      onClick={() =>
                        setDismissedRecs((prev) => new Set([...prev, rec]))
                      }
                      className="flex-shrink-0 rounded-lg p-1 text-content-4 hover:text-content-2 transition"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

      {/* Polish Editor */}
      {showPolishEditor && (
        <>
          {/* Polish Toolbar */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handlePolishContent}
                disabled={polishing || aiLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all hover:shadow-emerald-500/30 hover:scale-[1.02] disabled:opacity-50"
              >
                {polishing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
                Polish All Sections
              </button>
              {polishFile && (
                <span className="text-xs text-content-4 truncate max-w-[200px]">
                  📄 {polishFile.name}
                </span>
              )}
              {/* Clear & Upload New */}
              <button
                onClick={() => {
                  setPolishReady(false);
                  setPolishFile(null);
                  setPersonalInfo({
                    fullName: "",
                    email: "",
                    phone: "",
                    location: "",
                    website: "",
                    linkedin: "",
                    github: "",
                  });
                  setSummary("");
                  setSkills({
                    technical: [],
                    tools: [],
                    soft: [],
                    languages: [],
                  });
                  setExperience([]);
                  setProjects([]);
                  setEducation([]);
                  setCertifications([]);
                  setAvatarUrl("");
                  setAiRecommendations([]);
                  setDismissedRecs(new Set());
                  localStorage.removeItem("cv_wizard_draft");
                  toast.success("Cleared! Upload a new CV.");
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-edge bg-card px-4 py-2.5 text-sm font-medium text-content-3 transition hover:bg-card-hover hover:text-content-2"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear All
              </button>
              <button
                onClick={() => {
                  setPolishReady(false);
                  setPolishFile(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-edge bg-card px-4 py-2.5 text-sm font-medium text-content-3 transition hover:bg-card-hover hover:text-content-2"
              >
                <Upload className="h-3.5 w-3.5" />
                Upload New
              </button>
            </div>
            <div className="flex items-center gap-2">
              {/* Mobile preview toggle */}
              <button
                onClick={() => setShowMobilePreview(!showMobilePreview)}
                className="inline-flex items-center gap-2 rounded-xl border border-edge bg-card px-4 py-2.5 text-sm font-medium text-content-2 transition hover:bg-card-hover lg:hidden"
              >
                <Eye className="h-4 w-4" />
                {showMobilePreview ? "Show Editor" : "Show Preview"}
              </button>
            </div>
          </div>

          {/* Split layout */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left: Section Editor */}
            <div
              className={`flex-1 min-w-0 space-y-3 ${showMobilePreview ? "hidden lg:block" : ""}`}
            >
              {/* Personal Info */}
              <PolishSection
                icon={User}
                color="indigo"
                title="Personal Info"
                badge={polishBadge("personal")}
                isOpen={polishOpenSections.has("personal")}
                onToggle={() => togglePolishSection("personal")}
              >
                {/* Avatar */}
                <AvatarUpload
                  avatarUrl={avatarUrl}
                  uploading={avatarUploading}
                  onUpload={handleAvatarUpload}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Full Name"
                    placeholder="John Doe"
                    value={personalInfo.fullName}
                    onChange={(e) =>
                      setPersonalInfo({
                        ...personalInfo,
                        fullName: e.target.value,
                      })
                    }
                  />
                  <Field
                    label="Email"
                    type="email"
                    placeholder="john@example.com"
                    value={personalInfo.email}
                    onChange={(e) =>
                      setPersonalInfo({
                        ...personalInfo,
                        email: e.target.value,
                      })
                    }
                  />
                  <Field
                    label="Phone"
                    optional
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={personalInfo.phone}
                    onChange={(e) =>
                      setPersonalInfo({
                        ...personalInfo,
                        phone: e.target.value,
                      })
                    }
                  />
                  <Field
                    label="Location"
                    optional
                    placeholder="San Francisco, CA"
                    value={personalInfo.location}
                    onChange={(e) =>
                      setPersonalInfo({
                        ...personalInfo,
                        location: e.target.value,
                      })
                    }
                  />
                  <Field
                    label="Website"
                    optional
                    type="url"
                    placeholder="https://johndoe.dev"
                    value={personalInfo.website}
                    onChange={(e) =>
                      setPersonalInfo({
                        ...personalInfo,
                        website: e.target.value,
                      })
                    }
                  />
                  <Field
                    label="LinkedIn"
                    optional
                    type="url"
                    placeholder="https://linkedin.com/in/johndoe"
                    value={personalInfo.linkedin}
                    onChange={(e) =>
                      setPersonalInfo({
                        ...personalInfo,
                        linkedin: e.target.value,
                      })
                    }
                  />
                  <Field
                    label="GitHub"
                    optional
                    type="url"
                    placeholder="https://github.com/johndoe"
                    value={personalInfo.github}
                    onChange={(e) =>
                      setPersonalInfo({
                        ...personalInfo,
                        github: e.target.value,
                      })
                    }
                  />
                </div>
              </PolishSection>

              {/* Summary */}
              <PolishSection
                icon={FileText}
                color="purple"
                title="Professional Summary"
                badge={polishBadge("summary")}
                isOpen={polishOpenSections.has("summary")}
                onToggle={() => togglePolishSection("summary")}
                action={
                  <AiButton
                    onClick={handleAiSummary}
                    loading={aiLoading}
                    label="AI Generate"
                  />
                }
              >
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Results-driven software engineer with 5+ years of experience..."
                  rows={5}
                  className="w-full resize-none rounded-xl border border-edge bg-field p-4 text-sm leading-relaxed text-content placeholder:text-content-4 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition"
                />
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    {summary.length >= 100 && summary.length <= 500 ? (
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Info className="h-3 w-3 text-content-4" />
                    )}
                    <span
                      className={
                        summary.length >= 100 && summary.length <= 500
                          ? "text-emerald-400"
                          : "text-content-4"
                      }
                    >
                      {summary.length} chars
                    </span>
                  </div>
                  <span className="text-content-4">100–500 recommended</span>
                </div>
              </PolishSection>

              {/* Skills */}
              <PolishSection
                icon={Target}
                color="emerald"
                title="Core Skills"
                badge={polishBadge("skills")}
                isOpen={polishOpenSections.has("skills")}
                onToggle={() => togglePolishSection("skills")}
                action={
                  <AiButton
                    onClick={handleAiSkills}
                    loading={aiLoading}
                    label="AI Suggest"
                  />
                }
              >
                {(["technical", "tools", "soft", "languages"] as const).map(
                  (category) => (
                    <div
                      key={category}
                      className="rounded-xl border border-edge/50 bg-field/30 p-3"
                    >
                      <label className="mb-2 block text-xs font-semibold text-content-2">
                        {category === "soft"
                          ? "Soft Skills"
                          : category === "languages"
                            ? "Languages"
                            : category === "technical"
                              ? "Technical Skills"
                              : "Tools & Frameworks"}
                      </label>
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        {skills[category].map((skill, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-400 ring-1 ring-indigo-500/20"
                          >
                            {skill}
                            <button
                              onClick={() => removeSkill(category, i)}
                              className="opacity-60 hover:opacity-100 hover:text-red-400 transition"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          value={skillInputs[category]}
                          onChange={(e) =>
                            setSkillInputs({
                              ...skillInputs,
                              [category]: e.target.value,
                            })
                          }
                          onKeyDown={(e) =>
                            e.key === "Enter" &&
                            (e.preventDefault(), addSkill(category))
                          }
                          placeholder={
                            category === "technical"
                              ? "e.g. React, TypeScript"
                              : category === "tools"
                                ? "e.g. Docker, AWS"
                                : category === "soft"
                                  ? "e.g. Leadership"
                                  : "e.g. English (Native)"
                          }
                          className="flex-1 rounded-lg border border-edge bg-field px-3 py-2 text-sm text-content placeholder:text-content-4 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                        />
                        <button
                          onClick={() => addSkill(category)}
                          className="rounded-lg border border-edge bg-card px-3 py-2 text-content-2 hover:bg-card-hover transition"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ),
                )}
              </PolishSection>

              {/* Experience */}
              <PolishSection
                icon={Briefcase}
                color="amber"
                title="Work Experience"
                badge={polishBadge("experience")}
                isOpen={polishOpenSections.has("experience")}
                onToggle={() => togglePolishSection("experience")}
                action={
                  <button
                    onClick={addExperience}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-edge bg-card px-3 py-2 text-xs font-medium text-content-2 transition hover:bg-card-hover"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Role
                  </button>
                }
              >
                {experience.length === 0 && (
                  <button
                    onClick={addExperience}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-edge/70 py-8 text-sm text-content-3 hover:border-amber-500/40 hover:text-content-2 transition"
                  >
                    <Plus className="h-4 w-4" /> Add your first role
                  </button>
                )}
                {experience.map((entry, idx) => (
                  <div
                    key={entry.id}
                    className="rounded-xl border border-edge bg-field/20 overflow-hidden"
                  >
                    <div className="flex items-center justify-between bg-card/50 px-4 py-2.5 border-b border-edge/50">
                      <h4 className="text-xs font-semibold text-content truncate">
                        {entry.title || entry.company
                          ? `${entry.title}${entry.company ? ` at ${entry.company}` : ""}`
                          : `Role ${idx + 1}`}
                      </h4>
                      <div className="flex items-center gap-1.5">
                        <AiButton
                          onClick={() => handleAiBullets(idx)}
                          loading={aiLoading}
                          label="AI Bullets"
                        />
                        <button
                          onClick={() => removeExperience(idx)}
                          className="rounded-lg p-1.5 text-content-4 hover:bg-red-500/10 hover:text-red-400 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field
                          label="Job Title"
                          placeholder="Senior Software Engineer"
                          value={entry.title}
                          onChange={(e) =>
                            updateExperience(idx, { title: e.target.value })
                          }
                        />
                        <Field
                          label="Company"
                          placeholder="Google"
                          value={entry.company}
                          onChange={(e) =>
                            updateExperience(idx, { company: e.target.value })
                          }
                        />
                        <Field
                          label="Location"
                          optional
                          placeholder="Mountain View, CA"
                          value={entry.location}
                          onChange={(e) =>
                            updateExperience(idx, { location: e.target.value })
                          }
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Field
                            label="Start"
                            type="month"
                            value={entry.startDate}
                            onChange={(e) =>
                              updateExperience(idx, {
                                startDate: e.target.value,
                              })
                            }
                          />
                          <div>
                            <Field
                              label="End"
                              type="month"
                              value={entry.endDate}
                              disabled={entry.current}
                              onChange={(e) =>
                                updateExperience(idx, {
                                  endDate: e.target.value,
                                })
                              }
                            />
                            <label className="mt-1 flex items-center gap-1.5 text-[11px] text-content-3">
                              <input
                                type="checkbox"
                                checked={entry.current}
                                onChange={(e) =>
                                  updateExperience(idx, {
                                    current: e.target.checked,
                                    endDate: e.target.checked
                                      ? ""
                                      : entry.endDate,
                                  })
                                }
                                className="rounded border-edge"
                              />
                              Present
                            </label>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-content-2">
                          Bullet Points
                        </label>
                        <div className="space-y-1.5">
                          {entry.bullets.map((bullet, bIdx) => (
                            <div key={bIdx} className="flex gap-1.5">
                              <span className="mt-2.5 text-xs text-indigo-400/50">
                                •
                              </span>
                              <input
                                value={bullet}
                                onChange={(e) =>
                                  updateBullet(idx, bIdx, e.target.value)
                                }
                                placeholder="Led migration to microservices, reducing deploy time by 60%"
                                className="flex-1 rounded-lg border border-edge bg-field px-3 py-2 text-sm text-content placeholder:text-content-4 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition"
                              />
                              <button
                                onClick={() => removeBullet(idx, bIdx)}
                                className="rounded-lg p-1 text-content-4 hover:text-red-400 transition"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => addBullet(idx)}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition"
                        >
                          <Plus className="h-3 w-3" />
                          Add bullet
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </PolishSection>

              {/* Projects */}
              <PolishSection
                icon={FolderOpen}
                color="pink"
                title="Projects"
                badge={polishBadge("projects")}
                isOpen={polishOpenSections.has("projects")}
                onToggle={() => togglePolishSection("projects")}
                action={
                  <button
                    onClick={addProject}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-edge bg-card px-3 py-2 text-xs font-medium text-content-2 transition hover:bg-card-hover"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Project
                  </button>
                }
              >
                {projects.length === 0 && (
                  <button
                    onClick={addProject}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-edge/70 py-8 text-sm text-content-3 hover:border-pink-500/40 hover:text-content-2 transition"
                  >
                    <Plus className="h-4 w-4" /> Add a project
                  </button>
                )}
                {projects.map((entry, idx) => (
                  <div
                    key={entry.id}
                    className="rounded-xl border border-edge bg-field/20 overflow-hidden"
                  >
                    <div className="flex items-center justify-between bg-card/50 px-4 py-2.5 border-b border-edge/50">
                      <h4 className="text-xs font-semibold text-content truncate">
                        {entry.name || `Project ${idx + 1}`}
                      </h4>
                      <div className="flex items-center gap-1.5">
                        <AiButton
                          onClick={() => handleAiProjectDesc(idx)}
                          loading={aiLoading}
                          label="AI Describe"
                        />
                        <button
                          onClick={() => removeProject(idx)}
                          className="rounded-lg p-1.5 text-content-4 hover:bg-red-500/10 hover:text-red-400 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field
                          label="Project Name"
                          placeholder="E-commerce Platform"
                          value={entry.name}
                          onChange={(e) =>
                            updateProject(idx, { name: e.target.value })
                          }
                        />
                        <Field
                          label="Technologies"
                          placeholder="React, Node.js"
                          value={entry.technologies}
                          onChange={(e) =>
                            updateProject(idx, { technologies: e.target.value })
                          }
                        />
                        <Field
                          label="Live URL"
                          optional
                          type="url"
                          placeholder="https://project.com"
                          value={entry.liveUrl}
                          onChange={(e) =>
                            updateProject(idx, { liveUrl: e.target.value })
                          }
                        />
                        <Field
                          label="Source Code"
                          optional
                          type="url"
                          placeholder="https://github.com/..."
                          value={entry.sourceUrl}
                          onChange={(e) =>
                            updateProject(idx, { sourceUrl: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-content-2">
                          Description
                        </label>
                        <textarea
                          value={entry.description}
                          onChange={(e) =>
                            updateProject(idx, { description: e.target.value })
                          }
                          placeholder="Built a full-stack e-commerce platform..."
                          rows={2}
                          className="w-full resize-none rounded-lg border border-edge bg-field p-3 text-sm text-content placeholder:text-content-4 focus:border-pink-500/50 focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </PolishSection>

              {/* Education */}
              <PolishSection
                icon={GraduationCap}
                color="sky"
                title="Education"
                badge={polishBadge("education")}
                isOpen={polishOpenSections.has("education")}
                onToggle={() => togglePolishSection("education")}
                action={
                  <button
                    onClick={addEducation}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-edge bg-card px-3 py-2 text-xs font-medium text-content-2 transition hover:bg-card-hover"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Education
                  </button>
                }
              >
                {education.length === 0 && (
                  <button
                    onClick={addEducation}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-edge/70 py-8 text-sm text-content-3 hover:border-sky-500/40 hover:text-content-2 transition"
                  >
                    <Plus className="h-4 w-4" /> Add education
                  </button>
                )}
                {education.map((entry, idx) => (
                  <div
                    key={entry.id}
                    className="rounded-xl border border-edge bg-field/20 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-content truncate">
                        {entry.degree || entry.institution
                          ? `${entry.degree}${entry.institution ? ` — ${entry.institution}` : ""}`
                          : `Education ${idx + 1}`}
                      </h4>
                      <button
                        onClick={() => removeEducation(idx)}
                        className="rounded-lg p-1.5 text-content-4 hover:bg-red-500/10 hover:text-red-400 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field
                        label="Degree / Program"
                        placeholder="B.S. Computer Science"
                        value={entry.degree}
                        onChange={(e) =>
                          updateEducation(idx, { degree: e.target.value })
                        }
                      />
                      <Field
                        label="Institution"
                        placeholder="MIT"
                        value={entry.institution}
                        onChange={(e) =>
                          updateEducation(idx, { institution: e.target.value })
                        }
                      />
                      <Field
                        label="Location"
                        optional
                        placeholder="Cambridge, MA"
                        value={entry.location}
                        onChange={(e) =>
                          updateEducation(idx, { location: e.target.value })
                        }
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Field
                          label="Start"
                          type="month"
                          value={entry.startDate}
                          onChange={(e) =>
                            updateEducation(idx, { startDate: e.target.value })
                          }
                        />
                        <Field
                          label="End"
                          type="month"
                          value={entry.endDate}
                          onChange={(e) =>
                            updateEducation(idx, { endDate: e.target.value })
                          }
                        />
                      </div>
                      <Field
                        label="GPA"
                        optional
                        placeholder="3.9 / 4.0"
                        value={entry.gpa}
                        onChange={(e) =>
                          updateEducation(idx, { gpa: e.target.value })
                        }
                      />
                      <Field
                        label="Honors"
                        optional
                        placeholder="Magna Cum Laude"
                        value={entry.honors}
                        onChange={(e) =>
                          updateEducation(idx, { honors: e.target.value })
                        }
                      />
                    </div>
                  </div>
                ))}
              </PolishSection>

              {/* Certifications */}
              <PolishSection
                icon={Award}
                color="orange"
                title="Certifications"
                badge={polishBadge("certifications")}
                isOpen={polishOpenSections.has("certifications")}
                onToggle={() => togglePolishSection("certifications")}
                action={
                  <button
                    onClick={addCertification}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-edge bg-card px-3 py-2 text-xs font-medium text-content-2 transition hover:bg-card-hover"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Cert
                  </button>
                }
              >
                {certifications.length === 0 && (
                  <button
                    onClick={addCertification}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-edge/70 py-8 text-sm text-content-3 hover:border-orange-500/40 hover:text-content-2 transition"
                  >
                    <Plus className="h-4 w-4" /> Add a certification
                  </button>
                )}
                {certifications.map((entry, idx) => (
                  <div
                    key={entry.id}
                    className="rounded-xl border border-edge bg-field/20 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-content truncate">
                        {entry.name || `Certification ${idx + 1}`}
                      </h4>
                      <button
                        onClick={() => removeCertification(idx)}
                        className="rounded-lg p-1.5 text-content-4 hover:bg-red-500/10 hover:text-red-400 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field
                        label="Name"
                        placeholder="AWS Solutions Architect"
                        value={entry.name}
                        onChange={(e) =>
                          updateCertification(idx, { name: e.target.value })
                        }
                      />
                      <Field
                        label="Issuer"
                        placeholder="Amazon Web Services"
                        value={entry.issuer}
                        onChange={(e) =>
                          updateCertification(idx, { issuer: e.target.value })
                        }
                      />
                      <Field
                        label="Date"
                        type="month"
                        value={entry.date}
                        onChange={(e) =>
                          updateCertification(idx, { date: e.target.value })
                        }
                      />
                      <Field
                        label="Verification URL"
                        optional
                        type="url"
                        placeholder="https://verify.cert.com/..."
                        value={entry.url}
                        onChange={(e) =>
                          updateCertification(idx, { url: e.target.value })
                        }
                      />
                    </div>
                  </div>
                ))}
              </PolishSection>

              {/* Template Selection */}
              <div className="rounded-2xl border border-edge bg-card/80 backdrop-blur-sm p-5">
                <TemplateSelector
                  templates={templates}
                  selectedId={selectedTemplateId}
                  onSelect={setSelectedTemplateId}
                  loading={templatesLoading}
                  canUse={canUseTemplate}
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 py-4 text-base font-bold text-white shadow-xl shadow-emerald-600/25 transition-all duration-300 hover:shadow-emerald-500/40 hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Generating Polished CV...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Generate Polished CV
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </div>

            {/* Right: Live CV Preview (sticky) */}
            <div
              className={`w-full lg:w-[400px] xl:w-[440px] lg:shrink-0 ${showMobilePreview ? "" : "hidden lg:block"}`}
            >
              <div className="lg:sticky lg:top-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-content flex items-center gap-2">
                    <Eye className="h-4 w-4 text-content-3" />
                    Live Preview
                  </h3>
                  <span className="text-[10px] text-content-4 uppercase tracking-wider">
                    Updates in real-time
                  </span>
                </div>
                <div className="overflow-hidden rounded-2xl border border-edge bg-card/80 backdrop-blur-sm p-1">
                  <CvPreview
                    personalInfo={personalInfo}
                    summary={summary}
                    skills={skills}
                    experience={experience}
                    projects={projects}
                    education={education}
                    certifications={certifications}
                    avatarUrl={avatarUrl}
                    selectedTemplate={selectedTemplate}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
