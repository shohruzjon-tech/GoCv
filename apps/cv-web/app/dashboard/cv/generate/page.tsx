"use client";

import { useState, useEffect, useRef } from "react";
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
  ChevronDown,
  ChevronUp,
  X,
  Upload,
  RefreshCw,
} from "lucide-react";
import { cvApi, aiApi, uploadApi } from "@/lib/api";
import toast from "react-hot-toast";

// ── Types ──

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

// ── Step Configuration ──

const STEPS = [
  {
    id: "personal",
    label: "Personal Info",
    icon: User,
    desc: "Contact details & links",
  },
  {
    id: "summary",
    label: "Summary",
    icon: FileText,
    desc: "Professional overview",
  },
  {
    id: "skills",
    label: "Skills",
    icon: Target,
    desc: "Categorized competencies",
  },
  {
    id: "experience",
    label: "Experience",
    icon: Briefcase,
    desc: "Work history & achievements",
  },
  {
    id: "projects",
    label: "Projects",
    icon: FolderOpen,
    desc: "Notable work & portfolio",
  },
  {
    id: "education",
    label: "Education",
    icon: GraduationCap,
    desc: "Academic background",
  },
  {
    id: "certifications",
    label: "Certifications",
    icon: Award,
    desc: "Credentials & courses",
  },
  {
    id: "review",
    label: "Review & Generate",
    icon: Sparkles,
    desc: "Finalize your CV",
  },
];

const uid = () => Math.random().toString(36).slice(2, 10);

// ── Reusable Field ──

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
      <label className="mb-1.5 block text-sm font-medium text-content-2">
        {label}
        {optional && (
          <span className="ml-1 text-content-4 font-normal">(optional)</span>
        )}
      </label>
      <input
        {...props}
        className="w-full rounded-xl border border-edge bg-field px-4 py-3 text-sm text-content placeholder:text-content-4 focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
      />
    </div>
  );
}

// ── AI Suggest Button ──

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

// ── Main Page ──

export default function CvGenerateWizardPage() {
  const router = useRouter();
  const [wizardMode, setWizardMode] = useState<"generate" | "polish">(
    "generate",
  );
  const [step, setStep] = useState(0);
  const [aiLoading, setAiLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [polishing, setPolishing] = useState(false);
  const [polishFile, setPolishFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const polishFileRef = useRef<HTMLInputElement>(null);
  const [sourceData, setSourceData] = useState<Record<string, string> | null>(
    null,
  );
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

  // ── Load pending data from landing page & auto-extract ──

  const applyExtractedData = (data: any) => {
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
    if (data.skills) {
      setSkills({
        technical: data.skills.technical || [],
        tools: data.skills.tools || [],
        soft: data.skills.soft || [],
        languages: data.skills.languages || [],
      });
    }
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
  };

  // ── AI: Analyze CV and recommend fields ──

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
        'You are a CV optimization expert. Analyze this CV data snapshot and suggest 3-6 specific, actionable improvements based on best CV practices. Focus on MISSING or WEAK sections. Return a JSON array of short recommendation strings. Each should be a clear action like "Add a LinkedIn profile URL to improve discoverability" or "Include at least 3 quantified achievements in experience bullets". Return ONLY a valid JSON array of strings, no explanation.',
        JSON.stringify(dataSnapshot),
      );

      if (result) {
        try {
          const jsonMatch = result.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const recs = JSON.parse(jsonMatch[0]);
            if (Array.isArray(recs)) {
              setAiRecommendations(
                recs.filter((r: any) => typeof r === "string"),
              );
            }
          }
        } catch {}
      }
    } catch {}
  };

  // ── Polish: upload & AI-enhance an existing CV ──

  // ── AI Helper (shared by polish + wizard steps) ──

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

  const handlePolishUpload = async (file: File) => {
    setPolishFile(file);
    setExtracting(true);
    try {
      // 1. Parse the file to get text
      const parseRes = await uploadApi.parseCvFile(file);
      const text = parseRes.data?.text || "";
      if (!text || text.length < 10) {
        toast.error("Could not read the file. Please try a different format.");
        setExtracting(false);
        return;
      }

      // 2. Extract structured data from the text
      const extractRes = await aiApi.extractProfile(text, "file");
      if (extractRes.data) {
        applyExtractedData(extractRes.data);
      }

      // 3. AI-polish: enhance the extracted content
      setExtracting(false);
      setPolishing(true);

      // Polish summary
      if (extractRes.data?.summary) {
        const polishedSummary = await askAi(
          "You are an expert CV writer. Rewrite and polish the following professional summary to be more impactful, concise, and ATS-optimized. Keep it 3-4 sentences. Return ONLY the polished summary text, no labels or prefixes.",
          extractRes.data.summary,
        );
        if (polishedSummary)
          setSummary(
            polishedSummary
              .replace(/^(professional\s*summary[:\s]*)/i, "")
              .trim(),
          );
      }

      // Polish experience bullets
      if (extractRes.data?.experience?.length) {
        const polishedExperience = [...(extractRes.data.experience || [])];
        for (let i = 0; i < Math.min(polishedExperience.length, 3); i++) {
          const entry = polishedExperience[i];
          if (entry?.bullets?.length) {
            const bulletsResult = await askAi(
              "You are an expert CV writer. Polish these bullet points to follow the Action + Result + Metric format. Start each with a strong action verb. Return ONLY the polished bullets, one per line, each starting with '•'. No other text.",
              entry.bullets.join("\n"),
            );
            if (bulletsResult) {
              const newBullets = bulletsResult
                .split("\n")
                .map((b: string) => b.replace(/^[•\-\*]\s*/, "").trim())
                .filter((b: string) => b.length > 10);
              if (newBullets.length > 0) {
                setExperience((prev) =>
                  prev.map((e, idx) =>
                    idx === i ? { ...e, bullets: newBullets } : e,
                  ),
                );
              }
            }
          }
        }
      }

      toast.success("CV polished! Review the enhanced content below.");
      setStep(0);
      runAiRecommendations(extractRes.data);
    } catch {
      toast.error("Failed to polish CV. You can fill in details manually.");
    } finally {
      setExtracting(false);
      setPolishing(false);
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

  useEffect(() => {
    const pending = localStorage.getItem("pending_cv_wizard");
    if (!pending) return;

    let data: Record<string, string>;
    try {
      data = JSON.parse(pending);
    } catch {
      return;
    }
    setSourceData(data);

    // Set wizard mode from landing page selection
    if (data.wizardMode === "polish") {
      setWizardMode("polish");
    }

    const runExtraction = async () => {
      setExtracting(true);
      try {
        let textToExtract = "";

        if (data.sourceType === "upload" && data.fileBase64) {
          // Convert base64 data URL back to a File, upload to parse endpoint
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
            setExtracting(false);
            return;
          }
        } else if (
          (data.sourceType === "prompt" || data.sourceType === "linkedin") &&
          data.sourceText
        ) {
          textToExtract = data.sourceText;
        }

        if (textToExtract && textToExtract.length >= 10) {
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
          if (res.data) {
            applyExtractedData(res.data);

            // If polish mode, also run AI enhancement after extraction
            if (data.wizardMode === "polish") {
              setExtracting(false);
              setPolishing(true);

              // Polish summary
              if (res.data.summary) {
                try {
                  const polishedSummary = await askAi(
                    "You are an expert CV writer. Rewrite and polish the following professional summary to be more impactful, concise, and ATS-optimized. Keep it 3-4 sentences. Return ONLY the polished summary text, no labels or prefixes.",
                    res.data.summary,
                  );
                  if (polishedSummary)
                    setSummary(
                      polishedSummary
                        .replace(/^(professional\s*summary[:\s]*)/i, "")
                        .trim(),
                    );
                } catch {}
              }

              // Polish experience bullets (first 3)
              if (res.data.experience?.length) {
                for (
                  let i = 0;
                  i < Math.min(res.data.experience.length, 3);
                  i++
                ) {
                  const entry = res.data.experience[i];
                  if (entry?.bullets?.length) {
                    try {
                      const bulletsResult = await askAi(
                        "You are an expert CV writer. Polish these bullet points to follow the Action + Result + Metric format. Start each with a strong action verb. Return ONLY the polished bullets, one per line, each starting with '•'. No other text.",
                        entry.bullets.join("\n"),
                      );
                      if (bulletsResult) {
                        const newBullets = bulletsResult
                          .split("\n")
                          .map((b: string) =>
                            b.replace(/^[•\-\*]\s*/, "").trim(),
                          )
                          .filter((b: string) => b.length > 10);
                        if (newBullets.length > 0) {
                          setExperience((prev) =>
                            prev.map((e, idx) =>
                              idx === i ? { ...e, bullets: newBullets } : e,
                            ),
                          );
                        }
                      }
                    } catch {}
                  }
                }
              }

              setPolishing(false);
              toast.success("CV polished! Review the enhanced content below.");
              runAiRecommendations(res.data);
            } else {
              toast.success("Profile data extracted! Review and adjust below.");
              runAiRecommendations(res.data);
            }
          }
        }
      } catch {
        toast.error("AI extraction failed. You can fill in details manually.");
      } finally {
        setExtracting(false);
      }
    };

    runExtraction();
  }, []);

  // ── AI: Generate Summary ──

  const handleAiSummary = async () => {
    const context = sourceData?.sourceText || "";
    const expContext = experience
      .map((e) => `${e.title} at ${e.company}: ${e.bullets.join("; ")}`)
      .join("\n");

    const result = await askAi(
      "You are an expert CV writer. Generate a concise, impactful professional summary (3-4 sentences). Write in first person. Focus on years of experience, key specializations, top achievements, and career value proposition. Make it ATS-friendly with relevant keywords. Do NOT include any prefix labels or headings—just the summary text.",
      `Name: ${personalInfo.fullName}\nBackground: ${context}\nExperience:\n${expContext}\nSkills: ${[...skills.technical, ...skills.tools].join(", ")}`,
    );
    if (result) {
      setSummary(result.replace(/^(professional\s*summary[:\s]*)/i, "").trim());
      toast.success("Summary generated!");
    }
  };

  // ── AI: Suggest Skills ──

  const handleAiSkills = async () => {
    const context = sourceData?.sourceText || "";
    const expContext = experience
      .map((e) => `${e.title} at ${e.company}`)
      .join(", ");

    const result = await askAi(
      'You are an expert CV writer. Based on the professional background, suggest categorized skills. Return ONLY a valid JSON object with these exact keys: "technical", "tools", "soft", "languages". Each value should be an array of 4-8 relevant skills/technologies. For "languages" include spoken languages with proficiency (e.g. "English (Native)", "Spanish (Fluent)"). No markdown, no explanation—just JSON.',
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

  // ── AI: Suggest Bullets ──

  const handleAiBullets = async (index: number) => {
    const entry = experience[index];
    if (!entry) return;

    const result = await askAi(
      "You are an expert CV writer. Generate 4 impactful bullet points for this work experience. Each bullet MUST follow the Action + Result + Metric format: start with a strong action verb, describe the result, and include a quantifiable metric where possible. Make them ATS-optimized with relevant keywords. Return ONLY the bullet points, one per line, each starting with '•'. No other text.",
      `Role: ${entry.title}\nCompany: ${entry.company}\nLocation: ${entry.location}\nBackground: ${sourceData?.sourceText || summary}`,
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

  // ── AI: Suggest Project Description ──

  const handleAiProjectDesc = async (index: number) => {
    const entry = projects[index];
    if (!entry) return;

    const result = await askAi(
      "You are an expert CV writer. Write a concise, impactful project description (2-3 sentences) that highlights the problem solved, technologies used, and impact/results. Make it ATS-friendly. Return ONLY the description text.",
      `Project: ${entry.name}\nTechnologies: ${entry.technologies}\nContext: ${sourceData?.sourceText || summary}`,
    );
    if (result) {
      const updated = [...projects];
      updated[index] = { ...updated[index], description: result.trim() };
      setProjects(updated);
      toast.success("Description generated!");
    }
  };

  // ── Final Generate ──

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
      };

      const prompt =
        wizardMode === "polish"
          ? `Polish and regenerate this existing CV with improved formatting, stronger language, and ATS optimization. Keep the factual content but enhance bullet points with Action + Result + Metric format, improve the summary, and ensure professional keyword density. Structure sections in this order: Contact Info, Professional Summary, Core Skills, Work Experience, Projects, Education, Certifications.\n\nData: ${JSON.stringify(cvData)}`
          : `Generate a professional, ATS-optimized CV with this structured data. Use modern CV best practices: no date of birth, no marital status, results-driven bullet points, keyword-optimized content. Structure sections in this order: Contact Info, Professional Summary, Core Skills, Work Experience, Projects, Education, Certifications.\n\nData: ${JSON.stringify(cvData)}`;

      const res = await cvApi.aiGenerate({ prompt, context: cvData });
      localStorage.removeItem("pending_cv_wizard");
      toast.success("CV generated successfully!");
      router.push(`/dashboard/cv/${res.data._id}/edit`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to generate CV");
    } finally {
      setGenerating(false);
    }
  };

  // ── Helpers ──

  const addSkill = (category: keyof SkillsData) => {
    const value = skillInputs[category].trim();
    if (value && !skills[category].includes(value)) {
      setSkills({ ...skills, [category]: [...skills[category], value] });
      setSkillInputs({ ...skillInputs, [category]: "" });
    }
  };

  const removeSkill = (category: keyof SkillsData, index: number) => {
    setSkills({
      ...skills,
      [category]: skills[category].filter((_, i) => i !== index),
    });
  };

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

  const updateExperience = (index: number, updates: Partial<ExperienceEntry>) =>
    setExperience(
      experience.map((e, i) => (i === index ? { ...e, ...updates } : e)),
    );

  const removeExperience = (index: number) =>
    setExperience(experience.filter((_, i) => i !== index));

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

  const updateProject = (index: number, updates: Partial<ProjectEntry>) =>
    setProjects(
      projects.map((p, i) => (i === index ? { ...p, ...updates } : p)),
    );

  const removeProject = (index: number) =>
    setProjects(projects.filter((_, i) => i !== index));

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

  const updateEducation = (index: number, updates: Partial<EducationEntry>) =>
    setEducation(
      education.map((e, i) => (i === index ? { ...e, ...updates } : e)),
    );

  const removeEducation = (index: number) =>
    setEducation(education.filter((_, i) => i !== index));

  const addCertification = () =>
    setCertifications([
      ...certifications,
      { id: uid(), name: "", issuer: "", date: "", url: "" },
    ]);

  const updateCertification = (
    index: number,
    updates: Partial<CertificationEntry>,
  ) =>
    setCertifications(
      certifications.map((c, i) => (i === index ? { ...c, ...updates } : c)),
    );

  const removeCertification = (index: number) =>
    setCertifications(certifications.filter((_, i) => i !== index));

  const addBullet = (expIndex: number) => {
    const updated = [...experience];
    updated[expIndex] = {
      ...updated[expIndex],
      bullets: [...updated[expIndex].bullets, ""],
    };
    setExperience(updated);
  };

  const updateBullet = (
    expIndex: number,
    bulletIndex: number,
    value: string,
  ) => {
    const updated = [...experience];
    const bullets = [...updated[expIndex].bullets];
    bullets[bulletIndex] = value;
    updated[expIndex] = { ...updated[expIndex], bullets };
    setExperience(updated);
  };

  const removeBullet = (expIndex: number, bulletIndex: number) => {
    const updated = [...experience];
    updated[expIndex] = {
      ...updated[expIndex],
      bullets: updated[expIndex].bullets.filter((_, i) => i !== bulletIndex),
    };
    setExperience(updated);
  };

  const canProceed = () => {
    if (step === 0)
      return personalInfo.fullName.trim() && personalInfo.email.trim();
    return true;
  };

  const next = () => {
    if (canProceed()) setStep((s) => Math.min(s + 1, STEPS.length - 1));
    else toast.error("Please fill in the required fields");
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  // ── Render ──

  return (
    <div className="relative pb-8">
      {/* Mode Router */}
      <div className="mb-6">
        <div className="flex gap-1 rounded-2xl bg-card p-1 border border-edge">
          <button
            onClick={() => setWizardMode("generate")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
              wizardMode === "generate"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/20"
                : "text-content-3 hover:text-content hover:bg-card-hover"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Generate with AI
          </button>
          <button
            onClick={() => setWizardMode("polish")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
              wizardMode === "polish"
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/20"
                : "text-content-3 hover:text-content hover:bg-card-hover"
            }`}
          >
            <RefreshCw className="h-4 w-4" />
            Polish my CV
          </button>
        </div>
      </div>

      {/* Polish Upload Area (shown when in polish mode and no data loaded yet) */}
      {wizardMode === "polish" &&
        !extracting &&
        !polishing &&
        !polishFile &&
        !sourceData && (
          <div className="mb-8 rounded-2xl border border-edge bg-card p-8">
            <div className="mx-auto max-w-lg text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
                <Upload className="h-7 w-7 text-emerald-400" />
              </div>
              <h2 className="mb-2 text-lg font-semibold text-content">
                Upload Your Existing CV
              </h2>
              <p className="mb-6 text-sm text-content-3">
                Upload your current CV and our AI will extract, enhance, and
                polish every section
              </p>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handlePolishFileDrop}
                onClick={() => polishFileRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed py-12 transition-all ${
                  isDragOver
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-edge bg-field hover:border-emerald-500/30 hover:bg-emerald-500/5"
                }`}
              >
                <input
                  ref={polishFileRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handlePolishFileSelect}
                  className="hidden"
                />
                <Upload className="mb-3 h-10 w-10 text-content-4" />
                <p className="text-sm font-medium text-content-2">
                  Drop your CV here or{" "}
                  <span className="text-emerald-400">browse</span>
                </p>
                <p className="mt-1 text-xs text-content-4">
                  PDF, DOC, DOCX up to 10MB
                </p>
              </div>
            </div>
          </div>
        )}

      {/* Polishing Overlay */}
      {(extracting || polishing) && wizardMode === "polish" && (
        <div className="mb-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-content">
            {extracting ? "Extracting Your CV..." : "Polishing Content..."}
          </h3>
          <p className="text-sm text-content-3">
            {extracting
              ? "AI is reading and parsing your document"
              : "AI is enhancing your summary, experience, and skills"}
          </p>
        </div>
      )}

      {/* Step Progress (show when data is loaded or in generate mode) */}
      {(wizardMode === "generate" || polishFile || sourceData) &&
        !extracting &&
        !polishing && (
          <div className="mb-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-content">
                  {wizardMode === "polish"
                    ? "Review & Polish"
                    : "Create Your CV"}
                </h1>
                <p className="text-sm text-content-3">
                  {extracting
                    ? "Extracting your profile data..."
                    : `Step ${step + 1} of ${STEPS.length} — ${STEPS[step].desc}`}
                </p>
              </div>
              <div className="text-sm font-medium text-content-3">
                {extracting ? (
                  <span className="inline-flex items-center gap-2 text-indigo-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing
                  </span>
                ) : (
                  `${Math.round(((step + 1) / STEPS.length) * 100)}% complete`
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6 h-1.5 w-full rounded-full bg-card">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-500"
                style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              />
            </div>

            {/* Step Indicators */}
            <div className="hidden gap-1 md:flex">
              {STEPS.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => i <= step && setStep(i)}
                  className={`flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium transition-all ${
                    i === step
                      ? "bg-indigo-600/10 text-indigo-400 ring-1 ring-indigo-500/20"
                      : i < step
                        ? "bg-emerald-500/10 text-emerald-400 cursor-pointer hover:bg-emerald-500/15"
                        : "text-content-4"
                  }`}
                >
                  {i < step ? (
                    <Check className="h-3.5 w-3.5 flex-shrink-0" />
                  ) : (
                    <s.icon className="h-3.5 w-3.5 flex-shrink-0" />
                  )}
                  <span className="hidden lg:inline truncate">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

      {/* AI Recommendations */}
      {aiRecommendations.length > 0 &&
        aiRecommendations.filter((r) => !dismissedRecs.has(r)).length > 0 &&
        !extracting &&
        !polishing && (
          <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
            <div className="mb-3 flex items-center justify-between">
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
            <div className="space-y-2">
              {aiRecommendations
                .filter((r) => !dismissedRecs.has(r))
                .map((rec, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-xl bg-card/50 px-4 py-3 ring-1 ring-edge"
                  >
                    <Sparkles className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-400" />
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

      {/* Step Content */}
      {(wizardMode === "generate" || polishFile || sourceData) &&
        !extracting &&
        !polishing && (
          <div className="relative rounded-2xl border border-edge bg-card p-6 sm:p-8 backdrop-blur-sm">
            {/* Extraction Overlay */}
            {extracting && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-card/90 backdrop-blur-sm">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 ring-1 ring-indigo-500/20">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-content">
                  Extracting Your Profile
                </h3>
                <p className="text-sm text-content-3">
                  AI is analyzing your data and pre-filling the form...
                </p>
              </div>
            )}
            {/* ──── Step 0: Personal Info ──── */}
            {step === 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-content">
                      Personal Information
                    </h2>
                    <p className="text-xs text-content-3">
                      Modern CVs: city & country only — no full address, DOB, or
                      marital status
                    </p>
                  </div>
                </div>

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
              </div>
            )}

            {/* ──── Step 1: Professional Summary ──── */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-content">
                        Professional Summary
                      </h2>
                      <p className="text-xs text-content-3">
                        3-4 sentences highlighting your value proposition, key
                        skills & achievements
                      </p>
                    </div>
                  </div>
                  <AiButton
                    onClick={handleAiSummary}
                    loading={aiLoading}
                    label="Generate Summary"
                  />
                </div>

                {sourceData?.sourceText && (
                  <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs font-medium text-indigo-400">
                      <Lightbulb className="h-3.5 w-3.5" />
                      Your input from the landing page
                    </div>
                    <p className="text-sm text-content-2 line-clamp-3">
                      {sourceData.sourceText}
                    </p>
                  </div>
                )}

                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Results-driven software engineer with 5+ years of experience building scalable web applications. Specialized in React, Node.js, and cloud architecture, with a proven track record of leading cross-functional teams and delivering products that serve millions of users..."
                  rows={6}
                  className="w-full resize-none rounded-xl border border-edge bg-field p-4 text-sm text-content placeholder:text-content-4 focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                />
              </div>
            )}

            {/* ──── Step 2: Skills ──── */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
                      <Target className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-content">
                        Core Skills
                      </h2>
                      <p className="text-xs text-content-3">
                        Categorize for ATS: use exact keywords from job
                        descriptions
                      </p>
                    </div>
                  </div>
                  <AiButton
                    onClick={handleAiSkills}
                    loading={aiLoading}
                    label="AI Suggest Skills"
                  />
                </div>

                {(["technical", "tools", "soft", "languages"] as const).map(
                  (category) => (
                    <div key={category}>
                      <label className="mb-2 block text-sm font-semibold capitalize text-content-2">
                        {category === "soft"
                          ? "Soft Skills"
                          : category === "languages"
                            ? "Languages"
                            : category === "technical"
                              ? "Technical Skills"
                              : "Tools & Frameworks"}
                      </label>
                      <div className="mb-2 flex flex-wrap gap-2">
                        {skills[category].map((skill, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-400 ring-1 ring-indigo-500/20"
                          >
                            {skill}
                            <button
                              onClick={() => removeSkill(category, i)}
                              className="hover:text-red-400 transition"
                            >
                              <X className="h-3 w-3" />
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
                              ? "e.g. React, TypeScript, Python"
                              : category === "tools"
                                ? "e.g. Docker, AWS, Figma"
                                : category === "soft"
                                  ? "e.g. Leadership, Communication"
                                  : "e.g. English (Native)"
                          }
                          className="flex-1 rounded-xl border border-edge bg-field px-4 py-2.5 text-sm text-content placeholder:text-content-4 focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                        />
                        <button
                          onClick={() => addSkill(category)}
                          className="rounded-xl border border-edge bg-card px-4 py-2.5 text-sm font-medium text-content-2 transition hover:bg-card-hover"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}

            {/* ──── Step 3: Work Experience ──── */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-content">
                        Work Experience
                      </h2>
                      <p className="text-xs text-content-3">
                        Use Action + Result + Metric format for bullet points
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={addExperience}
                    className="inline-flex items-center gap-2 rounded-xl border border-edge bg-card px-4 py-2.5 text-sm font-medium text-content-2 transition hover:bg-card-hover"
                  >
                    <Plus className="h-4 w-4" />
                    Add Role
                  </button>
                </div>

                {experience.length === 0 && (
                  <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-edge py-12">
                    <Briefcase className="mb-3 h-10 w-10 text-content-4" />
                    <p className="mb-1 text-sm font-medium text-content-2">
                      No experience added yet
                    </p>
                    <p className="mb-4 text-xs text-content-4">
                      Click &quot;Add Role&quot; to add your work history
                    </p>
                    <button
                      onClick={addExperience}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
                    >
                      <Plus className="h-4 w-4" />
                      Add Your First Role
                    </button>
                  </div>
                )}

                {experience.map((entry, idx) => (
                  <div
                    key={entry.id}
                    className="rounded-2xl border border-edge bg-card/50 p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between">
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
                            updateExperience(idx, { startDate: e.target.value })
                          }
                        />
                        <div>
                          <Field
                            label="End Date"
                            type="month"
                            value={entry.endDate}
                            disabled={entry.current}
                            onChange={(e) =>
                              updateExperience(idx, { endDate: e.target.value })
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
                            Present
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Bullet Points */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-content-2">
                        Achievements & Responsibilities
                      </label>
                      <div className="space-y-2">
                        {entry.bullets.map((bullet, bIdx) => (
                          <div key={bIdx} className="flex gap-2">
                            <span className="mt-3 text-xs text-content-4">
                              •
                            </span>
                            <input
                              value={bullet}
                              onChange={(e) =>
                                updateBullet(idx, bIdx, e.target.value)
                              }
                              placeholder="Led migration of monolithic architecture to microservices, reducing deployment time by 60%"
                              className="flex-1 rounded-lg border border-edge bg-field px-3 py-2 text-sm text-content placeholder:text-content-4 focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
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
                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-400 transition hover:text-indigo-300"
                      >
                        <Plus className="h-3 w-3" />
                        Add bullet point
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ──── Step 4: Projects ──── */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/10 text-pink-400 ring-1 ring-pink-500/20">
                      <FolderOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-content">
                        Projects
                      </h2>
                      <p className="text-xs text-content-3">
                        Showcase key projects with technologies and impact
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={addProject}
                    className="inline-flex items-center gap-2 rounded-xl border border-edge bg-card px-4 py-2.5 text-sm font-medium text-content-2 transition hover:bg-card-hover"
                  >
                    <Plus className="h-4 w-4" />
                    Add Project
                  </button>
                </div>

                {projects.length === 0 && (
                  <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-edge py-12">
                    <FolderOpen className="mb-3 h-10 w-10 text-content-4" />
                    <p className="mb-1 text-sm font-medium text-content-2">
                      No projects added yet
                    </p>
                    <p className="mb-4 text-xs text-content-4">
                      This section is optional but highly recommended
                    </p>
                    <button
                      onClick={addProject}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
                    >
                      <Plus className="h-4 w-4" />
                      Add Your First Project
                    </button>
                  </div>
                )}

                {projects.map((entry, idx) => (
                  <div
                    key={entry.id}
                    className="rounded-2xl border border-edge bg-card/50 p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between">
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
                        placeholder="Built a full-stack e-commerce platform handling 10K+ daily transactions with real-time inventory management..."
                        rows={3}
                        className="w-full resize-none rounded-xl border border-edge bg-field p-4 text-sm text-content placeholder:text-content-4 focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ──── Step 5: Education ──── */}
            {step === 5 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/20">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-content">
                        Education
                      </h2>
                      <p className="text-xs text-content-3">
                        Degrees, institutions, and academic achievements
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={addEducation}
                    className="inline-flex items-center gap-2 rounded-xl border border-edge bg-card px-4 py-2.5 text-sm font-medium text-content-2 transition hover:bg-card-hover"
                  >
                    <Plus className="h-4 w-4" />
                    Add Education
                  </button>
                </div>

                {education.length === 0 && (
                  <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-edge py-12">
                    <GraduationCap className="mb-3 h-10 w-10 text-content-4" />
                    <p className="mb-1 text-sm font-medium text-content-2">
                      No education added yet
                    </p>
                    <p className="mb-4 text-xs text-content-4">
                      Add your academic background
                    </p>
                    <button
                      onClick={addEducation}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
                    >
                      <Plus className="h-4 w-4" />
                      Add Education
                    </button>
                  </div>
                )}

                {education.map((entry, idx) => (
                  <div
                    key={entry.id}
                    className="rounded-2xl border border-edge bg-card/50 p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between">
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
                      <div className="grid grid-cols-2 gap-3">
                        <Field
                          label="Start Date"
                          type="month"
                          value={entry.startDate}
                          onChange={(e) =>
                            updateEducation(idx, { startDate: e.target.value })
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
                ))}
              </div>
            )}

            {/* ──── Step 6: Certifications ──── */}
            {step === 6 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20">
                      <Award className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-content">
                        Certifications
                      </h2>
                      <p className="text-xs text-content-3">
                        Professional certifications, licenses, and courses
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={addCertification}
                    className="inline-flex items-center gap-2 rounded-xl border border-edge bg-card px-4 py-2.5 text-sm font-medium text-content-2 transition hover:bg-card-hover"
                  >
                    <Plus className="h-4 w-4" />
                    Add Certification
                  </button>
                </div>

                {certifications.length === 0 && (
                  <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-edge py-12">
                    <Award className="mb-3 h-10 w-10 text-content-4" />
                    <p className="mb-1 text-sm font-medium text-content-2">
                      No certifications added yet
                    </p>
                    <p className="mb-4 text-xs text-content-4">
                      This section is optional
                    </p>
                    <button
                      onClick={addCertification}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
                    >
                      <Plus className="h-4 w-4" />
                      Add Certification
                    </button>
                  </div>
                )}

                {certifications.map((entry, idx) => (
                  <div
                    key={entry.id}
                    className="rounded-2xl border border-edge bg-card/50 p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between">
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
                ))}
              </div>
            )}

            {/* ──── Step 7: Review & Generate ──── */}
            {step === 7 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 ring-1 ring-indigo-500/20">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-content">
                      Review & Generate
                    </h2>
                    <p className="text-xs text-content-3">
                      Review your information and generate your ATS-optimized CV
                    </p>
                  </div>
                </div>

                {/* Review Cards */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Personal Info */}
                  <div className="rounded-xl border border-edge bg-card/50 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-content">
                      <User className="h-4 w-4 text-indigo-400" />
                      Personal Info
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

                  {/* Summary */}
                  <div className="rounded-xl border border-edge bg-card/50 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-content">
                      <FileText className="h-4 w-4 text-purple-400" />
                      Summary
                    </div>
                    <p className="text-sm text-content-2 line-clamp-4">
                      {summary || "No summary added"}
                    </p>
                  </div>

                  {/* Skills */}
                  <div className="rounded-xl border border-edge bg-card/50 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-content">
                      <Target className="h-4 w-4 text-emerald-400" />
                      Skills
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

                  {/* Experience */}
                  <div className="rounded-xl border border-edge bg-card/50 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-content">
                      <Briefcase className="h-4 w-4 text-amber-400" />
                      Experience
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

                  {/* Projects */}
                  <div className="rounded-xl border border-edge bg-card/50 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-content">
                      <FolderOpen className="h-4 w-4 text-pink-400" />
                      Projects
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

                  {/* Education */}
                  <div className="rounded-xl border border-edge bg-card/50 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-content">
                      <GraduationCap className="h-4 w-4 text-sky-400" />
                      Education
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

                {/* ATS Tips */}
                <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-5">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-indigo-400">
                    <Brain className="h-4 w-4" />
                    ATS Optimization Tips
                  </div>
                  <ul className="space-y-2 text-sm text-content-2">
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
                      Your CV will exclude DOB, marital status, and full address
                      (modern best practice)
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
                      Bullet points will use strong action verbs with
                      quantifiable results
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
                      Skills section will be optimized with industry-standard
                      keywords
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
                      Format will be clean and parseable by Applicant Tracking
                      Systems
                    </li>
                  </ul>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 py-4 text-base font-semibold text-white shadow-xl shadow-indigo-600/25 transition-all hover:shadow-indigo-500/30 hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {wizardMode === "polish"
                        ? "Polishing Your CV..."
                        : "Generating Your CV..."}
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      {wizardMode === "polish"
                        ? "Polish & Generate CV"
                        : "Generate ATS-Optimized CV"}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

      {/* Navigation */}
      {(wizardMode === "generate" || polishFile || sourceData) &&
        !extracting &&
        !polishing && (
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={back}
              disabled={step === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-edge bg-card px-6 py-3 text-sm font-medium text-content-2 transition hover:bg-card-hover disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === step
                      ? "w-6 bg-indigo-500"
                      : i < step
                        ? "w-1.5 bg-indigo-500/50"
                        : "w-1.5 bg-edge"
                  }`}
                />
              ))}
            </div>

            {step < STEPS.length - 1 ? (
              <button
                onClick={next}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <div /> /* spacer */
            )}
          </div>
        )}
    </div>
  );
}
