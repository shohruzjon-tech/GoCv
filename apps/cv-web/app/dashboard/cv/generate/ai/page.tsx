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
  Check,
  Brain,
  Lightbulb,
  Wand2,
  Target,
  X,
  Shield,
  Eye,
  CheckCircle2,
  AlertCircle,
  Info,
  Camera,
  ImageIcon,
  Upload,
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

const STEPS = [
  {
    id: "describe",
    label: "Describe Yourself",
    icon: Brain,
    color: "violet",
    desc: "Tell AI about yourself",
  },
  {
    id: "personal",
    label: "Personal Info",
    icon: User,
    color: "indigo",
    desc: "Contact details & links",
  },
  {
    id: "summary",
    label: "Summary",
    icon: FileText,
    color: "purple",
    desc: "Professional overview",
  },
  {
    id: "skills",
    label: "Skills",
    icon: Target,
    color: "emerald",
    desc: "Categorized competencies",
  },
  {
    id: "experience",
    label: "Experience",
    icon: Briefcase,
    color: "amber",
    desc: "Work history & achievements",
  },
  {
    id: "projects",
    label: "Projects",
    icon: FolderOpen,
    color: "pink",
    desc: "Notable work & portfolio",
  },
  {
    id: "education",
    label: "Education",
    icon: GraduationCap,
    color: "sky",
    desc: "Academic background",
  },
  {
    id: "certifications",
    label: "Certifications",
    icon: Award,
    color: "orange",
    desc: "Credentials & courses",
  },
  {
    id: "review",
    label: "Review & Generate",
    icon: Sparkles,
    color: "violet",
    desc: "Finalize your CV",
  },
];

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

function SectionTip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-indigo-500/10 bg-indigo-500/5 px-4 py-3">
      <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-400/70" />
      <p className="text-xs leading-relaxed text-content-3">{children}</p>
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

function StepHeader({
  icon: Icon,
  color,
  title,
  subtitle,
  action,
}: {
  icon: LucideIcon;
  color: string;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  const c = STEP_COLORS[color] || STEP_COLORS.indigo;
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.bg} ${c.text} ring-1 ${c.ring}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-content">{title}</h2>
          <p className="text-xs text-content-3">{subtitle}</p>
        </div>
      </div>
      {action}
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

/* ═══════════════════════════════════════════════════════════
   Main Page Component — AI Builder
   ═══════════════════════════════════════════════════════════ */

export default function AiBuilderPage() {
  const router = useRouter();

  // ── Navigation ──
  const [step, setStep] = useState(0);

  // ── Loading States ──
  const [aiLoading, setAiLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiPrefilling, setAiPrefilling] = useState(false);

  // ── Real-time Status Steps ──
  const [statusSteps, setStatusSteps] = useState<
    { label: string; done: boolean }[]
  >([]);
  const [statusIndex, setStatusIndex] = useState(-1);

  // ── Describe step ──
  const [description, setDescription] = useState("");

  // ── Avatar ──
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);

  // ── Data ──
  const [sourceData, setSourceData] = useState<Record<string, string> | null>(
    null,
  );
  const [showTips, setShowTips] = useState(true);

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

  const stepComplete = useMemo(
    () => [
      description.length >= 20,
      !!(personalInfo.fullName.trim() && personalInfo.email.trim()),
      summary.length >= 50,
      [...skills.technical, ...skills.tools, ...skills.soft].length > 0,
      experience.length > 0 && !!(experience[0].title || experience[0].company),
      true,
      education.length > 0 &&
        !!(education[0].degree || education[0].institution),
      true,
      false,
    ],
    [personalInfo, summary, skills, experience, education, description],
  );

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
        wizardMode: "generate",
        step,
        description,
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
    step,
    description,
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

  /* ─── AI: Prefill from description ─── */

  const handleAiPrefill = async () => {
    if (description.trim().length < 20) {
      toast.error(
        "Please write at least a couple of sentences about yourself.",
      );
      return;
    }
    setAiPrefilling(true);

    // Setup real-time status steps
    const steps = [
      { label: "Analyzing your description...", done: false },
      { label: "Generating personal info...", done: false },
      { label: "Crafting professional summary...", done: false },
      { label: "Identifying skills & expertise...", done: false },
      { label: "Building work experience...", done: false },
      { label: "Adding education & certs...", done: false },
      { label: "Finalizing your CV...", done: false },
    ];
    setStatusSteps(steps);
    setStatusIndex(0);

    const advanceStep = (idx: number) => {
      setStatusSteps((prev) =>
        prev.map((s, i) => (i < idx ? { ...s, done: true } : s)),
      );
      setStatusIndex(idx);
    };

    // Simulate steps advancing while the AI call runs
    const stepTimer = setInterval(() => {
      setStatusIndex((prev) => {
        const next = prev + 1;
        if (next < steps.length - 1) {
          setStatusSteps((prevSteps) =>
            prevSteps.map((s, i) => (i <= prev ? { ...s, done: true } : s)),
          );
          return next;
        }
        return prev;
      });
    }, 1800);

    try {
      const res = await aiApi.extractProfile(description, "prompt");
      clearInterval(stepTimer);
      const extracted = res.data;
      if (extracted && typeof extracted === "object") {
        advanceStep(steps.length - 1);
        setStatusSteps((prev) => prev.map((s) => ({ ...s, done: true })));
        await new Promise((r) => setTimeout(r, 400));
        applyExtractedData(extracted);
        toast.success(
          "AI filled your sections! Review each step and refine as needed.",
        );
        setStep(1); // advance to personal info
      } else {
        toast.error("AI returned unexpected format. You can fill in manually.");
      }
    } catch {
      clearInterval(stepTimer);
      toast.error("AI prefill failed. You can fill in details manually.");
    } finally {
      setAiPrefilling(false);
      setTimeout(() => {
        setStatusSteps([]);
        setStatusIndex(-1);
      }, 600);
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

  /* ─── Load Pending Data from Landing Page ─── */

  useEffect(() => {
    const pending = localStorage.getItem("pending_cv_wizard");
    if (pending) {
      try {
        const data = JSON.parse(pending);
        setSourceData(data);
        localStorage.removeItem("pending_cv_wizard");
        // If user came from landing page with a text description, pre-fill
        if (data.sourceText) {
          setDescription(data.sourceText);
        }
      } catch {}
      return;
    }
    // Restore draft
    const draft = localStorage.getItem("cv_wizard_draft");
    if (draft) {
      try {
        const d = JSON.parse(draft);
        if (d.wizardMode !== "generate") return; // wrong mode draft
        if (d.personalInfo) setPersonalInfo(d.personalInfo);
        if (d.summary) setSummary(d.summary);
        if (d.skills) setSkills(d.skills);
        if (d.experience?.length) setExperience(d.experience);
        if (d.projects?.length) setProjects(d.projects);
        if (d.education?.length) setEducation(d.education);
        if (d.certifications?.length) setCertifications(d.certifications);
        if (typeof d.step === "number") setStep(d.step);
        if (d.description) setDescription(d.description);
        if (d.avatarUrl) setAvatarUrl(d.avatarUrl);
      } catch {}
    }
  }, []);

  /* ─── AI: Generate Summary ─── */

  const handleAiSummary = async () => {
    const context = description || sourceData?.sourceText || "";
    const expContext = experience
      .map((e) => `${e.title} at ${e.company}: ${e.bullets.join("; ")}`)
      .join("\n");
    const result = await askAi(
      "You are an expert CV writer. Generate a concise, impactful professional summary (3-4 sentences). Write in first person. Focus on years of experience, key specializations, top achievements, and career value proposition. Make it ATS-friendly. Do NOT include any prefix labels—just the summary text.",
      `Name: ${personalInfo.fullName}\nBackground: ${context}\nExperience:\n${expContext}\nSkills: ${[...skills.technical, ...skills.tools].join(", ")}`,
    );
    if (result) {
      setSummary(result.replace(/^(professional\s*summary[:\s]*)/i, "").trim());
      toast.success("Summary generated!");
    }
  };

  /* ─── AI: Suggest Skills ─── */

  const handleAiSkills = async () => {
    const context = description || sourceData?.sourceText || "";
    const expContext = experience
      .map((e) => `${e.title} at ${e.company}`)
      .join(", ");
    const result = await askAi(
      'You are an expert CV writer. Based on the professional background, suggest categorized skills. Return ONLY a valid JSON object with keys: "technical", "tools", "soft", "languages". Each should be an array of 4-8 relevant items. No markdown—just JSON.',
      `Background: ${context}\nExperience: ${expContext}\nCurrent summary: ${summary}`,
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
      `Role: ${entry.title}\nCompany: ${entry.company}\nLocation: ${entry.location}\nBackground: ${description || sourceData?.sourceText || summary}`,
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
      `Project: ${entry.name}\nTechnologies: ${entry.technologies}\nContext: ${description || sourceData?.sourceText || summary}`,
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
      const prompt = `Generate a professional, ATS-optimized CV with this structured data. Use modern CV best practices. Structure: Contact Info, Professional Summary, Core Skills, Work Experience, Projects, Education, Certifications.${selectedTemplate ? `\n\nUse the "${selectedTemplate.name}" template style (${selectedTemplate.category} category).` : ""}\n\nData: ${JSON.stringify(cvData)}`;
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

  const stepValidation = useCallback(
    (s: number): { valid: boolean; message: string } => {
      switch (s) {
        case 0:
          if (description.trim().length < 20)
            return {
              valid: false,
              message:
                "Please describe yourself in at least 20 characters before continuing",
            };
          break;
        case 1:
          if (!personalInfo.fullName.trim())
            return { valid: false, message: "Full name is required" };
          if (!personalInfo.email.trim())
            return { valid: false, message: "Email address is required" };
          if (
            personalInfo.email.trim() &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalInfo.email.trim())
          )
            return {
              valid: false,
              message: "Please enter a valid email address",
            };
          break;
        case 2:
          if (summary.trim().length < 50)
            return {
              valid: false,
              message: "Professional summary should be at least 50 characters",
            };
          break;
        case 3:
          if (
            [
              ...skills.technical,
              ...skills.tools,
              ...skills.soft,
              ...skills.languages,
            ].length === 0
          )
            return {
              valid: false,
              message: "Add at least one skill to continue",
            };
          break;
        case 4:
          if (experience.length === 0)
            return {
              valid: false,
              message: "Add at least one work experience entry",
            };
          if (experience.some((e) => !e.title.trim() || !e.company.trim()))
            return {
              valid: false,
              message:
                "Each experience entry needs a job title and company name",
            };
          break;
        // Steps 5 (Projects), 6 (Education), 7 (Certifications) are optional
        case 5:
        case 6:
        case 7:
          break;
        default:
          break;
      }
      return { valid: true, message: "" };
    },
    [description, personalInfo, summary, skills, experience],
  );

  /** Check whether all steps from 0..targetStep-1 are valid */
  const canReachStep = useCallback(
    (targetStep: number): { valid: boolean; message: string } => {
      for (let s = 0; s < targetStep; s++) {
        const result = stepValidation(s);
        if (!result.valid)
          return {
            valid: false,
            message: `Step "${STEPS[s].label}": ${result.message}`,
          };
      }
      return { valid: true, message: "" };
    },
    [stepValidation],
  );

  const next = () => {
    const result = stepValidation(step);
    if (result.valid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
    else toast.error(result.message);
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));
  const goToStep = (target: number) => {
    if (target <= step) {
      // Always allow going backward
      setStep(target);
    } else {
      const result = canReachStep(target);
      if (result.valid) setStep(target);
      else toast.error(result.message);
    }
  };

  /* ─── Flags ─── */

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
            <button className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm">
              <Brain className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Build with AI</span>
              <span className="sm:hidden">AI</span>
            </button>
            <button
              onClick={() => router.push("/dashboard/cv/generate/polish")}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-content-3 transition hover:bg-card-hover hover:text-content"
            >
              <Upload className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Polish Existing</span>
              <span className="sm:hidden">Polish</span>
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-content sm:text-3xl">
              Build with AI
            </h1>
            <p className="mt-1 text-sm text-content-3">
              Describe yourself, let AI fill in the details, then refine step by
              step
            </p>
          </div>
          <div className="flex items-center gap-4">
            {lastSaved && (
              <div className="hidden items-center gap-1.5 text-xs text-content-4 sm:flex">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400/70" />
                Saved {lastSaved}
              </div>
            )}
            {hasData && step > 0 && (
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

      {/* AI Prefilling Overlay — Real-time Status Timeline */}
      {aiPrefilling && (
        <div className="mb-8 overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 via-card to-purple-500/5 p-8 sm:p-10 backdrop-blur-sm">
          <div className="text-center mb-6">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 ring-1 ring-indigo-500/20">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
            </div>
            <h3 className="mb-1 text-xl font-bold text-content">
              AI is Building Your CV
            </h3>
            <p className="mx-auto max-w-sm text-sm text-content-3 leading-relaxed">
              Watch the progress below as AI generates your professional CV
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
                        ? "bg-indigo-500/10"
                        : isActive
                          ? "bg-indigo-500/5 ring-1 ring-indigo-500/20"
                          : "opacity-40"
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                      ) : isActive ? (
                        <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-edge" />
                      )}
                    </div>
                    <span
                      className={`text-sm font-medium transition-colors duration-300 ${
                        isDone
                          ? "text-indigo-400"
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

          {/* Progress bar */}
          <div className="mt-6 mx-auto max-w-md">
            <div className="h-1.5 w-full rounded-full bg-indigo-400/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-400 transition-all duration-700 ease-out"
                style={{
                  width:
                    statusSteps.length > 0
                      ? `${Math.max(((statusIndex + 1) / statusSteps.length) * 100, 5)}%`
                      : "40%",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Step Wizard */}
      {!aiPrefilling && (
        <>
          {/* Step Progress */}
          <div className="mb-8">
            <div className="mb-4 flex items-center justify-between text-xs text-content-3">
              <span>
                Step {step + 1} of {STEPS.length} — {STEPS[step].desc}
              </span>
              <span>{Math.round(((step + 1) / STEPS.length) * 100)}%</span>
            </div>
            <div className="mb-5 h-1 w-full rounded-full bg-edge/50">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-500 ease-out"
                style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              />
            </div>
            <div className="hidden gap-1 md:flex">
              {STEPS.map((s, i) => {
                const done =
                  i < step || (i < STEPS.length - 1 && stepComplete[i]);
                const active = i === step;
                return (
                  <button
                    key={s.id}
                    onClick={() => setStep(i)}
                    className={`group flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-200 ${active ? "bg-indigo-600/10 text-indigo-400 ring-1 ring-indigo-500/20 shadow-sm" : done ? "text-emerald-400 hover:bg-emerald-500/10 cursor-pointer" : "text-content-4 hover:text-content-3 hover:bg-card cursor-pointer"}`}
                  >
                    {done && !active ? (
                      <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                    ) : (
                      <s.icon className="h-3.5 w-3.5 flex-shrink-0" />
                    )}
                    <span className="hidden lg:inline truncate">{s.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-1 overflow-x-auto pb-1 md:hidden">
              {STEPS.map((s, i) => {
                const done =
                  i < step || (i < STEPS.length - 1 && stepComplete[i]);
                const active = i === step;
                return (
                  <button
                    key={s.id}
                    onClick={() => setStep(i)}
                    className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-all ${active ? "bg-indigo-600/10 text-indigo-400 ring-1 ring-indigo-500/20" : done ? "text-emerald-400" : "text-content-4"}`}
                  >
                    {done && !active ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <s.icon className="h-3 w-3" />
                    )}
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step Content */}
          <div className="relative overflow-hidden rounded-2xl border border-edge bg-card/80 p-6 sm:p-8 backdrop-blur-sm">
            {/* Step 0: Describe Yourself */}
            {step === 0 && (
              <div className="space-y-6">
                <StepHeader
                  icon={Brain}
                  color="violet"
                  title="Tell Us About Yourself"
                  subtitle="Write a few sentences — AI will generate your entire CV from this"
                />
                <SectionTip>
                  <strong>Example:</strong> &quot;I&apos;m a full-stack
                  developer with 5 years of experience building React and
                  Node.js apps. I&apos;ve worked at startups and led a team of
                  4. I have a CS degree from MIT and AWS certification.&quot;
                </SectionTip>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="I'm a ... with X years of experience in ... I've worked at ... and specialize in ... My key achievements include ..."
                  rows={8}
                  className="w-full resize-none rounded-xl border border-edge bg-field p-4 text-sm leading-relaxed text-content placeholder:text-content-4 focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all duration-200"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs">
                    {description.length >= 20 ? (
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Info className="h-3 w-3 text-content-4" />
                    )}
                    <span
                      className={
                        description.length >= 20
                          ? "text-emerald-400"
                          : "text-content-4"
                      }
                    >
                      {description.length} characters
                    </span>
                  </div>
                  <span className="text-xs text-content-4">
                    Min 20 characters
                  </span>
                </div>
                <button
                  onClick={handleAiPrefill}
                  disabled={aiPrefilling || description.trim().length < 20}
                  className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 py-4 text-base font-bold text-white shadow-xl shadow-indigo-600/25 transition-all duration-300 hover:shadow-indigo-500/40 hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
                >
                  {aiPrefilling ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      AI is generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      Let AI Build My CV
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
                <button
                  onClick={() => setStep(1)}
                  className="flex w-full items-center justify-center gap-2 text-sm text-content-3 transition hover:text-content-2"
                >
                  Or skip and fill in manually
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Step 1: Personal Info */}
            {step === 1 && (
              <div className="space-y-6">
                <StepHeader
                  icon={User}
                  color="indigo"
                  title="Personal Information"
                  subtitle="Modern CVs: city & country only — no full address, DOB, or marital status"
                />
                {showTips && (
                  <SectionTip>
                    <strong>Pro tip:</strong> Include LinkedIn and GitHub if
                    you&apos;re in tech — recruiters check these first. A
                    portfolio link can boost callbacks by 40%.
                  </SectionTip>
                )}
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
                    label="Website / Portfolio"
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
                <div className="flex items-center gap-2 rounded-xl bg-field/50 px-4 py-2.5 text-xs text-content-3">
                  <Eye className="h-3.5 w-3.5" />
                  {
                    Object.values(personalInfo).filter((v) => v.trim()).length
                  }{" "}
                  of 7 fields filled
                </div>
              </div>
            )}

            {/* Step 2: Summary */}
            {step === 2 && (
              <div className="space-y-6">
                <StepHeader
                  icon={FileText}
                  color="purple"
                  title="Professional Summary"
                  subtitle="3-4 sentences highlighting your value proposition, key skills & achievements"
                  action={
                    <AiButton
                      onClick={handleAiSummary}
                      loading={aiLoading}
                      label="Generate"
                    />
                  }
                />
                {showTips && (
                  <SectionTip>
                    <strong>Pro tip:</strong> Start with years of experience +
                    specialization, then highlight 2-3 top achievements with
                    metrics. Keep it under 500 characters.
                  </SectionTip>
                )}
                {(description || sourceData?.sourceText) && (
                  <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs font-medium text-indigo-400">
                      <Lightbulb className="h-3.5 w-3.5" />
                      Your description
                    </div>
                    <p className="text-sm text-content-2 line-clamp-3">
                      {description || sourceData?.sourceText}
                    </p>
                  </div>
                )}
                <div className="relative">
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Results-driven software engineer with 5+ years of experience building scalable web applications..."
                    rows={6}
                    className="w-full resize-none rounded-xl border border-edge bg-field p-4 text-sm leading-relaxed text-content placeholder:text-content-4 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
                  />
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      {summary.length >= 100 && summary.length <= 500 ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      ) : summary.length > 500 ? (
                        <AlertCircle className="h-3 w-3 text-amber-400" />
                      ) : (
                        <Info className="h-3 w-3 text-content-4" />
                      )}
                      <span
                        className={
                          summary.length >= 100 && summary.length <= 500
                            ? "text-emerald-400"
                            : summary.length > 500
                              ? "text-amber-400"
                              : "text-content-4"
                        }
                      >
                        {summary.length} characters
                      </span>
                    </div>
                    <span className="text-content-4">
                      Recommended: 100–500 chars
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Skills */}
            {step === 3 && (
              <div className="space-y-6">
                <StepHeader
                  icon={Target}
                  color="emerald"
                  title="Core Skills"
                  subtitle="Categorize for ATS: use exact keywords from job descriptions"
                  action={
                    <AiButton
                      onClick={handleAiSkills}
                      loading={aiLoading}
                      label="AI Suggest"
                    />
                  }
                />
                {showTips && (
                  <SectionTip>
                    <strong>Pro tip:</strong> Mirror exact keywords from job
                    descriptions. ATS systems score by keyword match. Include
                    8-15 technical skills for best results.
                  </SectionTip>
                )}
                {(["technical", "tools", "soft", "languages"] as const).map(
                  (category) => (
                    <div
                      key={category}
                      className="rounded-xl border border-edge/50 bg-field/30 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <label className="text-sm font-semibold text-content-2">
                          {category === "soft"
                            ? "Soft Skills"
                            : category === "languages"
                              ? "Languages"
                              : category === "technical"
                                ? "Technical Skills"
                                : "Tools & Frameworks"}
                        </label>
                        <span className="text-xs text-content-4">
                          {skills[category].length} added
                        </span>
                      </div>
                      <div className="mb-3 flex flex-wrap gap-2">
                        {skills[category].map((skill, i) => (
                          <span
                            key={i}
                            className="group inline-flex items-center gap-1.5 rounded-lg bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-400 ring-1 ring-indigo-500/20 transition-all hover:ring-indigo-500/40"
                          >
                            {skill}
                            <button
                              onClick={() => removeSkill(category, i)}
                              className="opacity-60 hover:opacity-100 hover:text-red-400 transition"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                        {skills[category].length === 0 && (
                          <span className="text-xs text-content-4 italic">
                            No skills added yet
                          </span>
                        )}
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
                              ? "e.g. React, TypeScript, Python"
                              : category === "tools"
                                ? "e.g. Docker, AWS, Figma"
                                : category === "soft"
                                  ? "e.g. Leadership, Communication"
                                  : "e.g. English (Native)"
                          }
                          className="flex-1 rounded-xl border border-edge bg-field px-4 py-2.5 text-sm text-content placeholder:text-content-4 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                        />
                        <button
                          onClick={() => addSkill(category)}
                          className="rounded-xl border border-edge bg-card px-4 py-2.5 text-sm font-medium text-content-2 transition hover:bg-card-hover hover:border-emerald-500/30"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ),
                )}
                <div className="flex items-center gap-2 rounded-xl bg-field/50 px-4 py-2.5 text-xs text-content-3">
                  <Shield className="h-3.5 w-3.5" />
                  {
                    [
                      ...skills.technical,
                      ...skills.tools,
                      ...skills.soft,
                      ...skills.languages,
                    ].length
                  }{" "}
                  total skills
                </div>
              </div>
            )}

            {/* Step 4: Experience */}
            {step === 4 && (
              <div className="space-y-6">
                <StepHeader
                  icon={Briefcase}
                  color="amber"
                  title="Work Experience"
                  subtitle="Use Action + Result + Metric format for bullet points"
                  action={
                    <button
                      onClick={addExperience}
                      className="inline-flex items-center gap-2 rounded-xl border border-edge bg-card px-4 py-2.5 text-sm font-medium text-content-2 transition hover:bg-card-hover"
                    >
                      <Plus className="h-4 w-4" />
                      Add Role
                    </button>
                  }
                />
                {showTips && (
                  <SectionTip>
                    <strong>Pro tip:</strong> Use ARM format:{" "}
                    <em>Action verb + Result + Metric</em>. Example: &quot;Led
                    migration to microservices, reducing deploy time by 60% and
                    saving $50K/year.&quot;
                  </SectionTip>
                )}
                {experience.length === 0 && (
                  <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-edge/70 py-14">
                    <div className="mb-4 rounded-xl bg-amber-500/10 p-3">
                      <Briefcase className="h-8 w-8 text-amber-400/60" />
                    </div>
                    <p className="mb-1 text-sm font-medium text-content-2">
                      No experience added yet
                    </p>
                    <p className="mb-5 text-xs text-content-4">
                      Click &quot;Add Role&quot; to add your work history
                    </p>
                    <button
                      onClick={addExperience}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 shadow-lg shadow-indigo-600/20"
                    >
                      <Plus className="h-4 w-4" />
                      Add Your First Role
                    </button>
                  </div>
                )}
                {experience.map((entry, idx) => (
                  <div
                    key={entry.id}
                    className="overflow-hidden rounded-2xl border border-edge bg-field/20"
                  >
                    <div className="flex items-center justify-between border-b border-edge/50 bg-card/50 px-5 py-3">
                      <h3 className="text-sm font-semibold text-content">
                        {entry.title || entry.company
                          ? `${entry.title}${entry.company ? ` at ${entry.company}` : ""}`
                          : `Role ${idx + 1}`}
                      </h3>
                      <div className="flex items-center gap-2">
                        <AiButton
                          onClick={() => handleAiBullets(idx)}
                          loading={aiLoading}
                          label="AI Bullets"
                        />
                        <button
                          onClick={() => removeExperience(idx)}
                          className="rounded-lg p-2 text-content-4 transition hover:bg-red-500/10 hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-4 p-5">
                      <div className="grid gap-4 sm:grid-cols-2">
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
                        <div className="grid grid-cols-2 gap-3">
                          <Field
                            label="Start Date"
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
                              label="End Date"
                              type="month"
                              value={entry.endDate}
                              disabled={entry.current}
                              onChange={(e) =>
                                updateExperience(idx, {
                                  endDate: e.target.value,
                                })
                              }
                            />
                            <label className="mt-1.5 flex items-center gap-2 text-xs text-content-3">
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
                              Currently working here
                            </label>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-xl border border-edge/30 bg-card/30 p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <label className="text-sm font-medium text-content-2">
                            Achievements & Responsibilities
                          </label>
                          <span className="text-xs text-content-4">
                            {entry.bullets.filter((b) => b.trim()).length}{" "}
                            bullets
                          </span>
                        </div>
                        <div className="space-y-2">
                          {entry.bullets.map((bullet, bIdx) => (
                            <div key={bIdx} className="flex gap-2">
                              <span className="mt-3 text-xs font-bold text-indigo-400/50">
                                •
                              </span>
                              <input
                                value={bullet}
                                onChange={(e) =>
                                  updateBullet(idx, bIdx, e.target.value)
                                }
                                placeholder="Led migration of monolithic architecture to microservices, reducing deployment time by 60%"
                                className="flex-1 rounded-lg border border-edge bg-field px-3 py-2 text-sm text-content placeholder:text-content-4 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition"
                              />
                              <button
                                onClick={() => removeBullet(idx, bIdx)}
                                className="mt-1 rounded-lg p-1.5 text-content-4 transition hover:text-red-400"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => addBullet(idx)}
                          className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-400 transition hover:text-indigo-300"
                        >
                          <Plus className="h-3 w-3" />
                          Add bullet point
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Step 5: Projects */}
            {step === 5 && (
              <div className="space-y-6">
                <StepHeader
                  icon={FolderOpen}
                  color="pink"
                  title="Projects"
                  subtitle="Showcase key projects with technologies and impact"
                  action={
                    <button
                      onClick={addProject}
                      className="inline-flex items-center gap-2 rounded-xl border border-edge bg-card px-4 py-2.5 text-sm font-medium text-content-2 transition hover:bg-card-hover"
                    >
                      <Plus className="h-4 w-4" />
                      Add Project
                    </button>
                  }
                />
                {showTips && (
                  <SectionTip>
                    <strong>Pro tip:</strong> Even 1-2 projects can set you
                    apart. Include the problem solved, tech stack, and
                    measurable impact.
                  </SectionTip>
                )}
                {projects.length === 0 && (
                  <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-edge/70 py-14">
                    <div className="mb-4 rounded-xl bg-pink-500/10 p-3">
                      <FolderOpen className="h-8 w-8 text-pink-400/60" />
                    </div>
                    <p className="mb-1 text-sm font-medium text-content-2">
                      No projects added yet
                    </p>
                    <p className="mb-5 text-xs text-content-4">
                      This section is optional but highly recommended
                    </p>
                    <button
                      onClick={addProject}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 shadow-lg shadow-indigo-600/20"
                    >
                      <Plus className="h-4 w-4" />
                      Add Your First Project
                    </button>
                  </div>
                )}
                {projects.map((entry, idx) => (
                  <div
                    key={entry.id}
                    className="overflow-hidden rounded-2xl border border-edge bg-field/20"
                  >
                    <div className="flex items-center justify-between border-b border-edge/50 bg-card/50 px-5 py-3">
                      <h3 className="text-sm font-semibold text-content">
                        {entry.name || `Project ${idx + 1}`}
                      </h3>
                      <div className="flex items-center gap-2">
                        <AiButton
                          onClick={() => handleAiProjectDesc(idx)}
                          loading={aiLoading}
                          label="AI Describe"
                        />
                        <button
                          onClick={() => removeProject(idx)}
                          className="rounded-lg p-2 text-content-4 transition hover:bg-red-500/10 hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-4 p-5">
                      <div className="grid gap-4 sm:grid-cols-2">
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
                          placeholder="React, Node.js, PostgreSQL"
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
                          label="Source Code URL"
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
                        <label className="mb-1.5 block text-sm font-medium text-content-2">
                          Description
                        </label>
                        <textarea
                          value={entry.description}
                          onChange={(e) =>
                            updateProject(idx, { description: e.target.value })
                          }
                          placeholder="Built a full-stack e-commerce platform handling 10K+ daily transactions..."
                          rows={3}
                          className="w-full resize-none rounded-xl border border-edge bg-field p-4 text-sm text-content placeholder:text-content-4 focus:border-pink-500/50 focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Step 6: Education */}
            {step === 6 && (
              <div className="space-y-6">
                <StepHeader
                  icon={GraduationCap}
                  color="sky"
                  title="Education"
                  subtitle="Degrees, institutions, and academic achievements"
                  action={
                    <button
                      onClick={addEducation}
                      className="inline-flex items-center gap-2 rounded-xl border border-edge bg-card px-4 py-2.5 text-sm font-medium text-content-2 transition hover:bg-card-hover"
                    >
                      <Plus className="h-4 w-4" />
                      Add Education
                    </button>
                  }
                />
                {showTips && (
                  <SectionTip>
                    <strong>Pro tip:</strong> For senior professionals, keep
                    education brief. For recent grads, include GPA (if 3.5+) and
                    relevant coursework.
                  </SectionTip>
                )}
                {education.length === 0 && (
                  <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-edge/70 py-14">
                    <div className="mb-4 rounded-xl bg-sky-500/10 p-3">
                      <GraduationCap className="h-8 w-8 text-sky-400/60" />
                    </div>
                    <p className="mb-1 text-sm font-medium text-content-2">
                      No education added yet
                    </p>
                    <p className="mb-5 text-xs text-content-4">
                      Add your academic background
                    </p>
                    <button
                      onClick={addEducation}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 shadow-lg shadow-indigo-600/20"
                    >
                      <Plus className="h-4 w-4" />
                      Add Education
                    </button>
                  </div>
                )}
                {education.map((entry, idx) => (
                  <div
                    key={entry.id}
                    className="overflow-hidden rounded-2xl border border-edge bg-field/20"
                  >
                    <div className="flex items-center justify-between border-b border-edge/50 bg-card/50 px-5 py-3">
                      <h3 className="text-sm font-semibold text-content">
                        {entry.degree || entry.institution
                          ? `${entry.degree}${entry.institution ? ` — ${entry.institution}` : ""}`
                          : `Education ${idx + 1}`}
                      </h3>
                      <button
                        onClick={() => removeEducation(idx)}
                        className="rounded-lg p-2 text-content-4 transition hover:bg-red-500/10 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="p-5">
                      <div className="grid gap-4 sm:grid-cols-2">
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
                            updateEducation(idx, {
                              institution: e.target.value,
                            })
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
                        <div className="grid grid-cols-2 gap-3">
                          <Field
                            label="Start Date"
                            type="month"
                            value={entry.startDate}
                            onChange={(e) =>
                              updateEducation(idx, {
                                startDate: e.target.value,
                              })
                            }
                          />
                          <Field
                            label="End Date"
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
                          label="Honors / Relevant Courses"
                          optional
                          placeholder="Magna Cum Laude, Dean's List"
                          value={entry.honors}
                          onChange={(e) =>
                            updateEducation(idx, { honors: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Step 7: Certifications */}
            {step === 7 && (
              <div className="space-y-6">
                <StepHeader
                  icon={Award}
                  color="orange"
                  title="Certifications"
                  subtitle="Professional certifications, licenses, and courses"
                  action={
                    <button
                      onClick={addCertification}
                      className="inline-flex items-center gap-2 rounded-xl border border-edge bg-card px-4 py-2.5 text-sm font-medium text-content-2 transition hover:bg-card-hover"
                    >
                      <Plus className="h-4 w-4" />
                      Add Certification
                    </button>
                  }
                />
                {showTips && (
                  <SectionTip>
                    <strong>Pro tip:</strong> Industry certs (AWS, PMP, Google)
                    can boost ATS ranking by 15-20%. Always include verification
                    URLs when available.
                  </SectionTip>
                )}
                {certifications.length === 0 && (
                  <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-edge/70 py-14">
                    <div className="mb-4 rounded-xl bg-orange-500/10 p-3">
                      <Award className="h-8 w-8 text-orange-400/60" />
                    </div>
                    <p className="mb-1 text-sm font-medium text-content-2">
                      No certifications added yet
                    </p>
                    <p className="mb-5 text-xs text-content-4">
                      This section is optional
                    </p>
                    <button
                      onClick={addCertification}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 shadow-lg shadow-indigo-600/20"
                    >
                      <Plus className="h-4 w-4" />
                      Add Certification
                    </button>
                  </div>
                )}
                {certifications.map((entry, idx) => (
                  <div
                    key={entry.id}
                    className="overflow-hidden rounded-2xl border border-edge bg-field/20"
                  >
                    <div className="flex items-center justify-between border-b border-edge/50 bg-card/50 px-5 py-3">
                      <h3 className="text-sm font-semibold text-content">
                        {entry.name || `Certification ${idx + 1}`}
                      </h3>
                      <button
                        onClick={() => removeCertification(idx)}
                        className="rounded-lg p-2 text-content-4 transition hover:bg-red-500/10 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="p-5">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field
                          label="Certification Name"
                          placeholder="AWS Solutions Architect"
                          value={entry.name}
                          onChange={(e) =>
                            updateCertification(idx, { name: e.target.value })
                          }
                        />
                        <Field
                          label="Issuing Organization"
                          placeholder="Amazon Web Services"
                          value={entry.issuer}
                          onChange={(e) =>
                            updateCertification(idx, { issuer: e.target.value })
                          }
                        />
                        <Field
                          label="Date Earned"
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
                  </div>
                ))}
              </div>
            )}

            {/* Step 8: Review & Generate */}
            {step === 8 && (
              <div className="space-y-6">
                <StepHeader
                  icon={Sparkles}
                  color="violet"
                  title="Review & Generate"
                  subtitle="Review your information and generate your ATS-optimized CV"
                />
                <div className="rounded-2xl border border-edge bg-gradient-to-br from-indigo-500/5 via-card to-purple-500/5 p-6">
                  <div className="flex items-center gap-5">
                    <CompletionRing score={completionScore} size={64} />
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-content">
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
                      <p className="mt-1 text-xs text-content-3">
                        {completionScore >= 80
                          ? "Your CV is comprehensive and ready to generate!"
                          : completionScore >= 60
                            ? "Looking good! Consider filling a few more sections."
                            : "Add more content to improve your CV's impact."}
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                      {
                        label: "Personal",
                        filled: !!(personalInfo.fullName && personalInfo.email),
                        icon: User,
                      },
                      {
                        label: "Summary",
                        filled: summary.length >= 50,
                        icon: FileText,
                      },
                      {
                        label: "Skills",
                        filled:
                          [...skills.technical, ...skills.tools, ...skills.soft]
                            .length > 0,
                        icon: Target,
                      },
                      {
                        label: "Experience",
                        filled: experience.length > 0,
                        icon: Briefcase,
                      },
                      {
                        label: "Projects",
                        filled: projects.length > 0,
                        icon: FolderOpen,
                      },
                      {
                        label: "Education",
                        filled: education.length > 0,
                        icon: GraduationCap,
                      },
                      {
                        label: "Certs",
                        filled: certifications.length > 0,
                        icon: Award,
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${item.filled ? "bg-emerald-500/10 text-emerald-400" : "bg-field/50 text-content-4"}`}
                      >
                        {item.filled ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <item.icon className="h-3.5 w-3.5" />
                        )}
                        {item.label}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Quick review cards */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-edge bg-field/20 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-content">
                      <User className="h-4 w-4 text-indigo-400" />
                      Personal Info
                      <button
                        onClick={() => setStep(1)}
                        className="ml-auto text-xs text-indigo-400 hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                    <div className="space-y-1 text-sm text-content-2">
                      <p className="font-medium text-content">
                        {personalInfo.fullName || "—"}
                      </p>
                      <p>{personalInfo.email || "—"}</p>
                      {personalInfo.phone && <p>{personalInfo.phone}</p>}
                      {personalInfo.location && <p>{personalInfo.location}</p>}
                    </div>
                  </div>
                  <div className="rounded-xl border border-edge bg-field/20 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-content">
                      <FileText className="h-4 w-4 text-purple-400" />
                      Summary
                      <button
                        onClick={() => setStep(2)}
                        className="ml-auto text-xs text-indigo-400 hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                    <p className="text-sm text-content-2 line-clamp-4">
                      {summary || "No summary added"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-edge bg-field/20 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-content">
                      <Target className="h-4 w-4 text-emerald-400" />
                      Skills
                      <button
                        onClick={() => setStep(3)}
                        className="ml-auto text-xs text-indigo-400 hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {[...skills.technical, ...skills.tools, ...skills.soft]
                        .slice(0, 10)
                        .map((s, i) => (
                          <span
                            key={i}
                            className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-xs text-indigo-400"
                          >
                            {s}
                          </span>
                        ))}
                      {[...skills.technical, ...skills.tools, ...skills.soft]
                        .length > 10 && (
                        <span className="text-xs text-content-4">
                          +
                          {[
                            ...skills.technical,
                            ...skills.tools,
                            ...skills.soft,
                          ].length - 10}{" "}
                          more
                        </span>
                      )}
                      {[...skills.technical, ...skills.tools, ...skills.soft]
                        .length === 0 && (
                        <span className="text-xs text-content-4">
                          No skills added
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="rounded-xl border border-edge bg-field/20 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-content">
                      <Briefcase className="h-4 w-4 text-amber-400" />
                      Experience
                      <button
                        onClick={() => setStep(4)}
                        className="ml-auto text-xs text-indigo-400 hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                    {experience.length > 0 ? (
                      <div className="space-y-2">
                        {experience.map((e, i) => (
                          <div key={i} className="text-sm">
                            <p className="font-medium text-content">
                              {e.title}
                            </p>
                            <p className="text-content-3">{e.company}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-content-4">
                        No experience added
                      </p>
                    )}
                  </div>
                  <div className="rounded-xl border border-edge bg-field/20 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-content">
                      <FolderOpen className="h-4 w-4 text-pink-400" />
                      Projects
                      <button
                        onClick={() => setStep(5)}
                        className="ml-auto text-xs text-indigo-400 hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                    {projects.length > 0 ? (
                      <div className="space-y-1">
                        {projects.map((p, i) => (
                          <p key={i} className="text-sm text-content-2">
                            {p.name}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-content-4">
                        No projects added
                      </p>
                    )}
                  </div>
                  <div className="rounded-xl border border-edge bg-field/20 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-content">
                      <GraduationCap className="h-4 w-4 text-sky-400" />
                      Education
                      <button
                        onClick={() => setStep(6)}
                        className="ml-auto text-xs text-indigo-400 hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                    {education.length > 0 ? (
                      <div className="space-y-2">
                        {education.map((e, i) => (
                          <div key={i} className="text-sm">
                            <p className="font-medium text-content">
                              {e.degree}
                            </p>
                            <p className="text-content-3">{e.institution}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-content-4">
                        No education added
                      </p>
                    )}
                  </div>
                </div>
                {/* ATS Guarantee */}
                <div className="rounded-xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 p-5">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-indigo-400">
                    <Shield className="h-4 w-4" />
                    ATS Optimization Guarantee
                  </div>
                  <ul className="space-y-2.5 text-sm text-content-2">
                    <li className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
                      Excludes DOB, marital status, and full address (modern
                      best practice)
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
                      Bullet points use strong action verbs with quantifiable
                      results
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
                      Skills optimized with industry-standard keywords
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
                      Clean format parseable by Applicant Tracking Systems
                    </li>
                  </ul>
                </div>
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
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 py-4 text-base font-bold text-white shadow-xl shadow-indigo-600/25 transition-all duration-300 hover:shadow-indigo-500/40 hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Generating Your CV...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      Generate ATS-Optimized CV
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={back}
              disabled={step === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-edge bg-card/80 px-6 py-3 text-sm font-medium text-content-2 backdrop-blur-sm transition-all hover:bg-card-hover disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => {
                const reachable = i <= step || canReachStep(i).valid;
                return (
                  <button
                    key={i}
                    onClick={() => goToStep(i)}
                    title={
                      !reachable
                        ? `Complete previous steps first`
                        : STEPS[i].label
                    }
                    className={`rounded-full transition-all duration-300 ${
                      i === step
                        ? "h-2 w-6 bg-indigo-500"
                        : i < step
                          ? "h-2 w-2 bg-indigo-500/50 hover:bg-indigo-400"
                          : reachable
                            ? "h-2 w-2 bg-edge hover:bg-content-4"
                            : "h-2 w-2 bg-edge/50 cursor-not-allowed"
                    }`}
                  />
                );
              })}
            </div>
            {step < STEPS.length - 1 ? (
              <button
                onClick={next}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/25"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <div />
            )}
          </div>
        </>
      )}
    </div>
  );
}
