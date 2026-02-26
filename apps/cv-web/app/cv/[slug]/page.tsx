"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { cvApi, projectsApi } from "@/lib/api";
import { Cv, Project } from "@/types";
import {
  Mail,
  Phone,
  MapPin,
  Globe,
  ExternalLink,
  Github,
  Linkedin,
  Download,
  FileText,
} from "lucide-react";

export default function PublicCvPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [cv, setCv] = useState<Cv | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    loadCv();
  }, [slug]);

  const loadCv = async () => {
    try {
      const res = await cvApi.getPublic(slug);
      setCv(res.data);
      // Try to load projects for this CV
      if (res.data._id) {
        try {
          const projRes = await projectsApi.getByCv(res.data._id);
          setProjects(projRes.data);
        } catch {
          // No projects or not accessible
        }
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (notFound || !cv) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-zinc-950">
        <FileText className="mb-4 h-16 w-16 text-zinc-300" />
        <h1 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-white">
          CV Not Found
        </h1>
        <p className="text-zinc-500">
          This CV does not exist or is not publicly available.
        </p>
      </div>
    );
  }

  // If there is AI-generated HTML, render it
  if (cv.aiGeneratedHtml) {
    return (
      <div className="min-h-screen bg-white">
        <div
          className="mx-auto max-w-4xl"
          dangerouslySetInnerHTML={{ __html: cv.aiGeneratedHtml }}
        />
        {projects.length > 0 && (
          <div className="mx-auto max-w-4xl border-t border-zinc-200 px-8 py-12">
            <h2 className="mb-8 text-2xl font-bold text-zinc-900">Projects</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {projects
                .filter((p) => p.isVisible)
                .map((project) => (
                  <ProjectCard key={project._id} project={project} />
                ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Fallback: structured rendering from CV data
  const primaryColor = cv.theme?.primaryColor || "#2563eb";

  return (
    <div className="min-h-screen bg-zinc-50 py-12 dark:bg-zinc-950">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div
          className="rounded-t-2xl px-8 py-10 text-white"
          style={{ backgroundColor: primaryColor }}
        >
          <h1 className="text-3xl font-bold">
            {cv.personalInfo?.fullName || cv.title}
          </h1>
          {cv.summary && <p className="mt-3 text-white/90">{cv.summary}</p>}
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/80">
            {cv.personalInfo?.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                {cv.personalInfo.email}
              </span>
            )}
            {cv.personalInfo?.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                {cv.personalInfo.phone}
              </span>
            )}
            {cv.personalInfo?.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {cv.personalInfo.location}
              </span>
            )}
            {cv.personalInfo?.website && (
              <a
                href={cv.personalInfo.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-white"
              >
                <Globe className="h-3.5 w-3.5" />
                Website
              </a>
            )}
            {cv.personalInfo?.github && (
              <a
                href={cv.personalInfo.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-white"
              >
                <Github className="h-3.5 w-3.5" />
                GitHub
              </a>
            )}
            {cv.personalInfo?.linkedin && (
              <a
                href={cv.personalInfo.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-white"
              >
                <Linkedin className="h-3.5 w-3.5" />
                LinkedIn
              </a>
            )}
          </div>
        </div>

        {/* Sections */}
        <div className="rounded-b-2xl bg-white px-8 py-8 shadow-sm dark:bg-zinc-900">
          {cv.sections
            .filter((s) => s.visible)
            .sort((a, b) => a.order - b.order)
            .map((section) => (
              <div
                key={section.type + section.order}
                className="mb-8 last:mb-0"
              >
                <h2
                  className="mb-4 text-lg font-bold"
                  style={{ color: primaryColor }}
                >
                  {section.title}
                </h2>
                <SectionContent section={section} />
              </div>
            ))}
        </div>

        {/* Projects */}
        {projects.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-white">
              Projects
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {projects
                .filter((p) => p.isVisible)
                .map((project) => (
                  <ProjectCard key={project._id} project={project} />
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionContent({ section }: { section: any }) {
  const content = section.content;

  if (!content) return null;

  // Experience / Education items
  if (Array.isArray(content.items)) {
    return (
      <div className="space-y-4">
        {content.items.map((item: any, i: number) => (
          <div
            key={i}
            className="border-l-2 border-zinc-200 pl-4 dark:border-zinc-700"
          >
            <p className="font-semibold text-zinc-900 dark:text-white">
              {item.title || item.degree || item.name}
            </p>
            {(item.company || item.institution) && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {item.company || item.institution}
              </p>
            )}
            {(item.startDate || item.endDate) && (
              <p className="text-xs text-zinc-400">
                {item.startDate} — {item.endDate || "Present"}
              </p>
            )}
            {item.description && (
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {item.description}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Skills
  if (Array.isArray(content.skills)) {
    return (
      <div className="flex flex-wrap gap-2">
        {content.skills.map((skill: string, i: number) => (
          <span
            key={i}
            className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          >
            {skill}
          </span>
        ))}
      </div>
    );
  }

  // Plain text
  if (typeof content.text === "string") {
    return (
      <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {content.text}
      </p>
    );
  }

  // Fallback: render as JSON-like text
  return (
    <pre className="text-xs text-zinc-500">
      {JSON.stringify(content, null, 2)}
    </pre>
  );
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {project.images?.[0] && (
        <img
          src={project.images[0].url}
          alt={project.title}
          className="h-40 w-full object-cover"
        />
      )}
      <div className="p-5">
        <h3 className="font-bold text-zinc-900 dark:text-white">
          {project.title}
        </h3>
        {project.description && (
          <p className="mt-1 text-sm text-zinc-500">{project.description}</p>
        )}
        {project.technologies.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {project.technologies.map((tech) => (
              <span
                key={tech}
                className="rounded-md bg-blue-50 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
              >
                {tech}
              </span>
            ))}
          </div>
        )}
        <div className="mt-4 flex gap-3">
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Live Demo
            </a>
          )}
          {project.sourceUrl && (
            <a
              href={project.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-zinc-600 hover:underline dark:text-zinc-400"
            >
              <Github className="h-3.5 w-3.5" />
              Source
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
