"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { cvApi, projectsApi } from "@/lib/api";
import { Cv, CvSection, Project } from "@/types";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
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
  Briefcase,
  GraduationCap,
  Award,
  Target,
  FolderOpen,
  Calendar,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  ArrowUpRight,
  Code2,
  Sparkles,
  User,
  BarChart3,
  Brain,
  CheckCircle2,
  AlertTriangle,
  Info,
  Lightbulb,
  TrendingUp,
  Shield,
  Zap,
  Eye,
  Clock,
  Hash,
  Layers,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   Three.js — Neon Particle Grid Background
   ═══════════════════════════════════════════════════════════ */

function createGlowTexture(): THREE.Texture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.2, "rgba(255,255,255,0.8)");
  grad.addColorStop(0.5, "rgba(255,255,255,0.15)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

const mouseNDC = new THREE.Vector2(9999, 9999);
const mouseWorld = new THREE.Vector3(0, 0, 0);
let mouseActive = false;

function MouseTracker() {
  const { camera } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
    [],
  );
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseActive = true;
    };
    const onLeave = () => {
      mouseNDC.set(9999, 9999);
      mouseActive = false;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, []);
  useFrame(() => {
    raycaster.setFromCamera(mouseNDC, camera);
    const target = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, target);
    if (target) mouseWorld.lerp(target, 0.06);
  });
  return null;
}

function NeonGrid({ count = 120 }: { count?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const glowTex = useMemo(() => createGlowTexture(), []);
  const radius = 10;
  const maxDist = 2.8;

  const { nodes, velocities } = useMemo(() => {
    const n: THREE.Vector3[] = [];
    const v: THREE.Vector3[] = [];
    for (let i = 0; i < count; i++) {
      const u = Math.random(),
        vv = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * vv - 1);
      const r = radius * Math.cbrt(Math.random());
      n.push(
        new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi),
        ),
      );
      v.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.003,
          (Math.random() - 0.5) * 0.003,
          (Math.random() - 0.5) * 0.002,
        ),
      );
    }
    return { nodes: n, velocities: v };
  }, [count]);

  const pointGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = nodes[i].x;
      pos[i * 3 + 1] = nodes[i].y;
      pos[i * 3 + 2] = nodes[i].z;
      const t = Math.random();
      if (t < 0.33) {
        colors[i * 3] = 0.0;
        colors[i * 3 + 1] = 1.0;
        colors[i * 3 + 2] = 1.0;
      } else if (t < 0.66) {
        colors[i * 3] = 0.6;
        colors[i * 3 + 1] = 0.2;
        colors[i * 3 + 2] = 1.0;
      } else {
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.2;
        colors[i * 3 + 2] = 0.8;
      }
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return g;
  }, [nodes, count]);

  const lineGeo = useMemo(() => {
    const maxLines = (count * (count - 1)) / 2;
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(maxLines * 6), 3),
    );
    g.setAttribute(
      "color",
      new THREE.BufferAttribute(new Float32Array(maxLines * 6), 3),
    );
    g.setDrawRange(0, 0);
    return g;
  }, [count]);

  const _dir = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      nodes[i].add(velocities[i]);
      if (mouseActive) {
        _dir.copy(nodes[i]).sub(mouseWorld);
        const dist = _dir.length();
        if (dist < 4 && dist > 0.1) {
          _dir.normalize().multiplyScalar(0.02 * (1 - dist / 4));
          nodes[i].add(_dir);
        }
      }
      const d = nodes[i].length();
      if (d > radius) {
        nodes[i].multiplyScalar(radius / d);
        velocities[i].negate();
      }
    }

    if (pointsRef.current) {
      const attr = pointsRef.current.geometry.getAttribute(
        "position",
      ) as THREE.BufferAttribute;
      const a = attr.array as Float32Array;
      for (let i = 0; i < count; i++) {
        a[i * 3] = nodes[i].x;
        a[i * 3 + 1] = nodes[i].y;
        a[i * 3 + 2] = nodes[i].z;
      }
      attr.needsUpdate = true;
    }

    if (linesRef.current) {
      const posAttr = linesRef.current.geometry.getAttribute(
        "position",
      ) as THREE.BufferAttribute;
      const colAttr = linesRef.current.geometry.getAttribute(
        "color",
      ) as THREE.BufferAttribute;
      const pa = posAttr.array as Float32Array;
      const ca = colAttr.array as Float32Array;
      let idx = 0;
      for (let i = 0; i < count; i++) {
        for (let j = i + 1; j < count; j++) {
          const dist = nodes[i].distanceTo(nodes[j]);
          if (dist < maxDist) {
            const fade = 1 - dist / maxDist;
            const o = idx * 6;
            pa[o] = nodes[i].x;
            pa[o + 1] = nodes[i].y;
            pa[o + 2] = nodes[i].z;
            pa[o + 3] = nodes[j].x;
            pa[o + 4] = nodes[j].y;
            pa[o + 5] = nodes[j].z;
            ca[o] = 0.0 * fade;
            ca[o + 1] = 0.9 * fade;
            ca[o + 2] = 1.0 * fade;
            ca[o + 3] = 0.0 * fade;
            ca[o + 4] = 0.9 * fade;
            ca[o + 5] = 1.0 * fade;
            idx++;
          }
        }
      }
      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;
      linesRef.current.geometry.setDrawRange(0, idx * 2);
    }

    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.015;
      groupRef.current.rotation.x = Math.sin(t * 0.008) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      <points ref={pointsRef} geometry={pointGeo}>
        <pointsMaterial
          vertexColors
          map={glowTex}
          size={0.6}
          transparent
          opacity={0.9}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          alphaTest={0.01}
        />
      </points>
      <lineSegments ref={linesRef} geometry={lineGeo}>
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={0.12}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
}

function NeonScene() {
  return (
    <>
      <fog attach="fog" args={["#030014", 8, 28]} />
      <MouseTracker />
      <NeonGrid count={100} />
    </>
  );
}

function NeonBackground() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="fixed inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 14], fov: 50 }}
        dpr={isMobile ? [1, 1] : [1, 1.5]}
        gl={{
          antialias: !isMobile,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ background: "transparent", width: "100%", height: "100%" }}
      >
        <NeonScene />
      </Canvas>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Neon UI Helpers
   ═══════════════════════════════════════════════════════════ */

function NeonBadge({
  children,
  color = "cyan",
}: {
  children: React.ReactNode;
  color?: "cyan" | "purple" | "pink" | "green" | "amber";
}) {
  const colors = {
    cyan: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300 shadow-cyan-500/10",
    purple:
      "border-purple-500/30 bg-purple-500/10 text-purple-300 shadow-purple-500/10",
    pink: "border-pink-500/30 bg-pink-500/10 text-pink-300 shadow-pink-500/10",
    green:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-emerald-500/10",
    amber:
      "border-amber-500/30 bg-amber-500/10 text-amber-300 shadow-amber-500/10",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium shadow-sm ${colors[color]}`}
    >
      {children}
    </span>
  );
}

function GlassCard({
  children,
  className = "",
  neonBorder = "cyan",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  neonBorder?: "cyan" | "purple" | "pink" | "none";
  id?: string;
}) {
  const borders = {
    cyan: "border-cyan-500/20 hover:border-cyan-400/40",
    purple: "border-purple-500/20 hover:border-purple-400/40",
    pink: "border-pink-500/20 hover:border-pink-400/40",
    none: "border-white/5 hover:border-white/10",
  };
  return (
    <div
      id={id}
      className={`rounded-2xl border bg-white/[0.03] backdrop-blur-xl transition-all duration-500 ${borders[neonBorder]} ${className}`}
    >
      {children}
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  color = "cyan",
}: {
  icon: LucideIcon;
  title: string;
  color?: string;
}) {
  const glowMap: Record<string, string> = {
    cyan: "from-cyan-400 to-cyan-600 shadow-cyan-500/30",
    purple: "from-purple-400 to-purple-600 shadow-purple-500/30",
    pink: "from-pink-400 to-pink-600 shadow-pink-500/30",
    amber: "from-amber-400 to-amber-600 shadow-amber-500/30",
    emerald: "from-emerald-400 to-emerald-600 shadow-emerald-500/30",
  };
  const glow = glowMap[color] || glowMap.cyan;
  return (
    <div className="mb-8 flex items-center gap-4">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${glow} shadow-lg`}
      >
        <Icon className="h-5 w-5 text-white" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-white">{title}</h2>
      <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
    </div>
  );
}

const sectionMeta: Record<
  string,
  { icon: LucideIcon; color: string; neon: "cyan" | "purple" | "pink" }
> = {
  experience: { icon: Briefcase, color: "cyan", neon: "cyan" },
  education: { icon: GraduationCap, color: "purple", neon: "purple" },
  skills: { icon: Target, color: "emerald", neon: "cyan" },
  certifications: { icon: Award, color: "amber", neon: "pink" },
  projects: { icon: FolderOpen, color: "pink", neon: "pink" },
};

/* ═══════════════════════════════════════════════════════════
   Section Renderers
   ═══════════════════════════════════════════════════════════ */

function ExperienceSection({ items }: { items: any[] }) {
  return (
    <div className="relative space-y-6">
      <div className="absolute left-[18px] top-2 bottom-2 w-px bg-gradient-to-b from-cyan-500/40 via-cyan-500/20 to-transparent" />
      {items.map((item: any, i: number) => (
        <div key={i} className="group relative flex gap-5 pl-1">
          <div className="relative z-10 mt-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/10 shadow-lg shadow-cyan-500/10 transition group-hover:bg-cyan-500/20 group-hover:shadow-cyan-500/20">
            <Briefcase className="h-4 w-4 text-cyan-400" />
          </div>
          <GlassCard className="flex-1 p-5" neonBorder="cyan">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {item.title || "Untitled Role"}
                </h3>
                {item.company && (
                  <p className="mt-0.5 text-sm font-medium text-cyan-300/90">
                    {item.company}
                    {item.location && (
                      <span className="text-white/70"> · {item.location}</span>
                    )}
                  </p>
                )}
              </div>
              {(item.startDate || item.endDate) && (
                <NeonBadge color="cyan">
                  <Calendar className="h-3 w-3" />
                  {item.startDate || "?"} — {item.endDate || "Present"}
                </NeonBadge>
              )}
            </div>
            {item.description && (
              <p className="mt-3 text-sm leading-relaxed text-white/85">
                {item.description}
              </p>
            )}
            {item.highlights?.filter((h: string) => h.trim()).length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {item.highlights
                  .filter((h: string) => h.trim())
                  .map((h: string, hi: number) => (
                    <li
                      key={hi}
                      className="flex items-start gap-2 text-sm text-white/80"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400/60" />
                      {h}
                    </li>
                  ))}
              </ul>
            )}
          </GlassCard>
        </div>
      ))}
    </div>
  );
}

function EducationSection({ items }: { items: any[] }) {
  return (
    <div className="relative space-y-6">
      <div className="absolute left-[18px] top-2 bottom-2 w-px bg-gradient-to-b from-purple-500/40 via-purple-500/20 to-transparent" />
      {items.map((item: any, i: number) => (
        <div key={i} className="group relative flex gap-5 pl-1">
          <div className="relative z-10 mt-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-purple-500/30 bg-purple-500/10 shadow-lg shadow-purple-500/10 transition group-hover:bg-purple-500/20">
            <GraduationCap className="h-4 w-4 text-purple-400" />
          </div>
          <GlassCard className="flex-1 p-5" neonBorder="purple">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {item.degree || item.title || "Untitled"}
                </h3>
                {item.institution && (
                  <p className="mt-0.5 text-sm font-medium text-purple-300/90">
                    {item.institution}
                    {item.location && (
                      <span className="text-white/70"> · {item.location}</span>
                    )}
                  </p>
                )}
              </div>
              {(item.startDate || item.endDate) && (
                <NeonBadge color="purple">
                  <Calendar className="h-3 w-3" />
                  {item.startDate || "?"} — {item.endDate || "Present"}
                </NeonBadge>
              )}
            </div>
            {item.description && (
              <p className="mt-3 text-sm leading-relaxed text-white/85">
                {item.description}
              </p>
            )}
          </GlassCard>
        </div>
      ))}
    </div>
  );
}

function SkillsSection({ content }: { content: any }) {
  if (content?.categories?.length > 0) {
    return (
      <div className="space-y-6">
        {content.categories.map((cat: any, i: number) => (
          <div key={i}>
            {cat.name && (
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-cyan-400/70">
                {cat.name}
              </h4>
            )}
            <div className="flex flex-wrap gap-2">
              {(cat.skills || []).map((skill: string, si: number) => (
                <span
                  key={si}
                  className="group relative overflow-hidden rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-3.5 py-1.5 text-sm font-medium text-cyan-200 transition hover:border-cyan-400/40 hover:bg-cyan-500/10 hover:shadow-lg hover:shadow-cyan-500/10"
                >
                  <span className="relative z-10">{skill}</span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (Array.isArray(content?.skills)) {
    return (
      <div className="flex flex-wrap gap-2">
        {content.skills.map((skill: string, i: number) => (
          <span
            key={i}
            className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-3.5 py-1.5 text-sm font-medium text-cyan-200 transition hover:border-cyan-400/40 hover:bg-cyan-500/10"
          >
            {skill}
          </span>
        ))}
      </div>
    );
  }
  return null;
}

function CertificationsSection({ items }: { items: any[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((item: any, i: number) => (
        <GlassCard key={i} className="p-5" neonBorder="pink">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-pink-500/20 bg-pink-500/10">
              <Award className="h-5 w-5 text-pink-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-white">
                {item.name || "Certification"}
              </h4>
              {item.issuer && (
                <p className="text-sm text-pink-300/70">{item.issuer}</p>
              )}
              {item.date && (
                <p className="mt-1 text-xs text-white/70">{item.date}</p>
              )}
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-pink-400 hover:text-pink-300 transition"
                >
                  Verify <ArrowUpRight className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

function GenericSection({ content }: { content: any }) {
  if (content?.items && Array.isArray(content.items)) {
    return (
      <div className="space-y-4">
        {content.items.map((item: any, i: number) => (
          <GlassCard key={i} className="p-5" neonBorder="none">
            <h4 className="font-bold text-white">
              {item.title || item.name || item.degree || `Item ${i + 1}`}
            </h4>
            {item.description && (
              <p className="mt-2 text-sm text-white/80">{item.description}</p>
            )}
          </GlassCard>
        ))}
      </div>
    );
  }
  if (typeof content?.text === "string") {
    return (
      <p className="text-sm leading-relaxed text-white/85">{content.text}</p>
    );
  }
  return null;
}

function RenderSection({ section }: { section: CvSection }) {
  const content = section.content;
  if (!content) return null;
  switch (section.type) {
    case "experience":
      return content.items?.length > 0 ? (
        <ExperienceSection items={content.items} />
      ) : null;
    case "education":
      return content.items?.length > 0 ? (
        <EducationSection items={content.items} />
      ) : null;
    case "skills":
      return <SkillsSection content={content} />;
    case "certifications":
      return content.items?.length > 0 ? (
        <CertificationsSection items={content.items} />
      ) : null;
    default:
      return <GenericSection content={content} />;
  }
}

/* ═══════════════════════════════════════════════════════════
   Project Card
   ═══════════════════════════════════════════════════════════ */

function ProjectCard({ project }: { project: Project }) {
  return (
    <GlassCard
      className="group overflow-hidden transition-transform duration-300 hover:scale-[1.02]"
      neonBorder="purple"
    >
      {project.images?.[0] && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={project.images[0].url}
            alt={project.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          {project.isFeatured && (
            <div className="absolute left-3 top-3">
              <NeonBadge color="amber">
                <Sparkles className="h-3 w-3" /> Featured
              </NeonBadge>
            </div>
          )}
        </div>
      )}
      <div className="p-5">
        <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
          {project.title}
        </h3>
        {project.description && (
          <p className="mt-2 text-sm leading-relaxed text-white/80 line-clamp-3">
            {project.description}
          </p>
        )}
        {project.technologies.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {project.technologies.map((tech) => (
              <span
                key={tech}
                className="rounded-md border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-300"
              >
                {tech}
              </span>
            ))}
          </div>
        )}
        {(project.liveUrl || project.sourceUrl) && (
          <div className="mt-4 flex items-center gap-4 border-t border-white/5 pt-4">
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan-400 transition hover:text-cyan-300"
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
                className="inline-flex items-center gap-1.5 text-sm font-medium text-white/75 transition hover:text-white"
              >
                <Github className="h-3.5 w-3.5" />
                Source
              </a>
            )}
          </div>
        )}
      </div>
    </GlassCard>
  );
}

/* ═══════════════════════════════════════════════════════════
   Reading Progress Bar
   ═══════════════════════════════════════════════════════════ */

function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(h > 0 ? Math.min((window.scrollY / h) * 100, 100) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-0.5">
      <div
        className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 transition-all duration-150 ease-out shadow-lg shadow-cyan-500/20"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Scroll Controls (Top / Bottom)
   ═══════════════════════════════════════════════════════════ */

function ScrollControls() {
  const [showTop, setShowTop] = useState(false);
  const [showBottom, setShowBottom] = useState(true);

  useEffect(() => {
    const onScroll = () => {
      setShowTop(window.scrollY > 400);
      const remaining =
        document.documentElement.scrollHeight -
        window.scrollY -
        window.innerHeight;
      setShowBottom(remaining > 400);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (target: "top" | "bottom") => {
    window.scrollTo({
      top:
        target === "top"
          ? 0
          : document.documentElement.scrollHeight - window.innerHeight,
      behavior: "smooth",
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {showTop && (
        <button
          onClick={() => scrollTo("top")}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-500/30 bg-[#0a0a2e]/80 text-cyan-400 backdrop-blur-sm transition-all hover:border-cyan-400/60 hover:bg-cyan-500/10 hover:shadow-lg hover:shadow-cyan-500/20"
          title="Scroll to top"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      )}
      {showBottom && (
        <button
          onClick={() => scrollTo("bottom")}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-purple-500/30 bg-[#0a0a2e]/80 text-purple-400 backdrop-blur-sm transition-all hover:border-purple-400/60 hover:bg-purple-500/10 hover:shadow-lg hover:shadow-purple-500/20"
          title="Scroll to bottom"
        >
          <ArrowDown className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Top Navigation Bar
   ═══════════════════════════════════════════════════════════ */

function TopNav({
  name,
  initials,
  primaryColor,
  sections,
  hasProjects,
  hasAnalytics,
}: {
  name: string;
  initials: string;
  primaryColor: string;
  sections: { id: string; label: string }[];
  hasProjects: boolean;
  hasAnalytics: boolean;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        }
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    const allIds = [
      ...sections.map((s) => s.id),
      ...(hasProjects ? ["projects"] : []),
      ...(hasAnalytics ? ["analytics"] : []),
    ];
    allIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections, hasProjects, hasAnalytics]);

  const scrollToSection = (id: string) => {
    setDrawerOpen(false);
    // Small delay so drawer starts closing before scroll
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  };

  const allNavItems = [
    ...sections,
    ...(hasProjects ? [{ id: "projects", label: "Projects" }] : []),
    ...(hasAnalytics ? [{ id: "analytics", label: "Analytics" }] : []),
  ];

  const sectionIcons: Record<string, LucideIcon> = {
    projects: Code2,
    analytics: BarChart3,
    experience: Briefcase,
    education: GraduationCap,
    skills: Target,
    certifications: Award,
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[55] border-b transition-[background-color,border-color,box-shadow] duration-500 ${
          scrolled
            ? "bg-[#030014]/80 backdrop-blur-xl border-white/5 shadow-lg shadow-black/20"
            : "bg-transparent border-transparent shadow-none"
        }`}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          {/* Logo/Name */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-black"
              style={{
                backgroundColor: `${primaryColor}20`,
                color: primaryColor,
              }}
            >
              {initials}
            </div>
            <span
              className={`text-sm font-semibold text-white/90 transition-opacity duration-300 ${scrolled ? "opacity-100" : "opacity-0"}`}
            >
              {name}
            </span>
          </button>

          {/* Desktop Section Links */}
          <div className="hidden items-center gap-1 md:flex">
            {allNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-300 ${
                  activeSection === item.id
                    ? "bg-cyan-500/10 text-cyan-300"
                    : "text-white/60 hover:bg-white/5 hover:text-white/90"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/80 backdrop-blur-sm transition-colors hover:border-cyan-500/30 hover:text-cyan-300 md:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-4.5 w-4.5" />
          </button>
        </div>
      </nav>

      {/* ── Mobile Drawer Overlay ── */}
      <div
        className={`fixed inset-0 z-[100] transition-opacity duration-300 md:hidden ${
          drawerOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
        />

        {/* Drawer panel */}
        <div
          className={`absolute top-0 right-0 h-full w-72 bg-[#0a0a2e]/95 backdrop-blur-xl border-l border-white/10 shadow-2xl shadow-black/40 transition-transform duration-300 ease-out ${
            drawerOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Drawer header */}
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-black"
                style={{
                  backgroundColor: `${primaryColor}20`,
                  color: primaryColor,
                }}
              >
                {initials}
              </div>
              <span className="text-sm font-semibold text-white/90">
                Navigate
              </span>
            </div>
            <button
              onClick={() => setDrawerOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/60 transition-colors hover:border-white/20 hover:text-white"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Drawer links */}
          <div
            className="overflow-y-auto px-3 py-4"
            style={{ maxHeight: "calc(100vh - 65px)" }}
          >
            <div className="space-y-1">
              {allNavItems.map((item, idx) => {
                const sectionType = sections.find((s) => s.id === item.id)
                  ? item.label.toLowerCase()
                  : item.id;
                const IconComp = sectionIcons[sectionType] || FileText;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-200 ${
                      isActive
                        ? "bg-cyan-500/10 border border-cyan-500/20 shadow-md shadow-cyan-500/5"
                        : "border border-transparent hover:bg-white/5"
                    }`}
                    style={{
                      transitionDelay: drawerOpen ? `${idx * 30}ms` : "0ms",
                    }}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                        isActive
                          ? "bg-cyan-500/20 text-cyan-400"
                          : "bg-white/5 text-white/40 group-hover:bg-white/10 group-hover:text-white/70"
                      }`}
                    >
                      <IconComp className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span
                        className={`text-sm font-medium transition-colors ${
                          isActive
                            ? "text-cyan-300"
                            : "text-white/70 group-hover:text-white/90"
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                    {isActive && (
                      <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Scroll to top/bottom shortcuts */}
            <div className="mt-6 border-t border-white/5 pt-4">
              <p className="mb-2 px-4 text-[10px] font-semibold uppercase tracking-widest text-white/30">
                Quick Actions
              </p>
              <button
                onClick={() => {
                  setDrawerOpen(false);
                  setTimeout(
                    () => window.scrollTo({ top: 0, behavior: "smooth" }),
                    150,
                  );
                }}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-white/50 transition-colors hover:bg-white/5 hover:text-white/80"
              >
                <ArrowUp className="h-4 w-4" />
                <span className="text-sm">Scroll to top</span>
              </button>
              <button
                onClick={() => {
                  setDrawerOpen(false);
                  setTimeout(
                    () =>
                      window.scrollTo({
                        top: document.documentElement.scrollHeight,
                        behavior: "smooth",
                      }),
                    150,
                  );
                }}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-white/50 transition-colors hover:bg-white/5 hover:text-white/80"
              >
                <ArrowDown className="h-4 w-4" />
                <span className="text-sm">Scroll to bottom</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   SVG Chart Components
   ═══════════════════════════════════════════════════════════ */

function RadialScore({
  score,
  size = 120,
  strokeWidth = 8,
  label,
  sublabel,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
  label: string;
  sublabel?: string;
}) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color =
    score >= 80
      ? "#22d3ee"
      : score >= 60
        ? "#a78bfa"
        : score >= 40
          ? "#fbbf24"
          : "#f87171";
  const glow =
    score >= 80
      ? "drop-shadow(0 0 6px rgba(34,211,238,0.4))"
      : score >= 60
        ? "drop-shadow(0 0 6px rgba(167,139,250,0.4))"
        : score >= 40
          ? "drop-shadow(0 0 6px rgba(251,191,36,0.4))"
          : "drop-shadow(0 0 6px rgba(248,113,113,0.4))";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
          style={{ filter: glow }}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-white">{score}</span>
          <span className="text-[10px] text-white/70">/ 100</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold text-white/90">{label}</p>
        {sublabel && <p className="text-[10px] text-white/70">{sublabel}</p>}
      </div>
    </div>
  );
}

function HorizontalBar({
  label,
  value,
  max = 100,
  color = "#22d3ee",
}: {
  label: string;
  value: number;
  max?: number;
  color?: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-white/80">{label}</span>
        <span className="text-xs font-bold" style={{ color }}>
          {value}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            boxShadow: `0 0 8px ${color}40`,
          }}
        />
      </div>
    </div>
  );
}

function RadarChart({
  dimensions,
  size = 200,
}: {
  dimensions: { label: string; value: number }[];
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 30;
  const n = dimensions.length;
  if (n < 3) return null;

  const angleStep = (2 * Math.PI) / n;
  const levels = [0.25, 0.5, 0.75, 1.0];

  const getPoint = (angle: number, radius: number) => ({
    x: cx + radius * Math.cos(angle - Math.PI / 2),
    y: cy + radius * Math.sin(angle - Math.PI / 2),
  });

  const dataPoints = dimensions.map((d, i) => {
    const r = (d.value / 100) * maxR;
    return getPoint(i * angleStep, r);
  });

  const dataPath =
    dataPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ") +
    " Z";

  return (
    <svg width={size} height={size} className="mx-auto">
      {/* Grid */}
      {levels.map((lvl) => {
        const pts = Array.from({ length: n }, (_, i) =>
          getPoint(i * angleStep, maxR * lvl),
        );
        const path =
          pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ") +
          " Z";
        return (
          <path
            key={lvl}
            d={path}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={1}
          />
        );
      })}
      {/* Axes */}
      {dimensions.map((_, i) => {
        const ep = getPoint(i * angleStep, maxR);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={ep.x}
            y2={ep.y}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={1}
          />
        );
      })}
      {/* Data area */}
      <path
        d={dataPath}
        fill="rgba(34,211,238,0.1)"
        stroke="#22d3ee"
        strokeWidth={2}
        style={{ filter: "drop-shadow(0 0 4px rgba(34,211,238,0.3))" }}
      />
      {/* Data dots */}
      {dataPoints.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={3}
          fill="#22d3ee"
          style={{ filter: "drop-shadow(0 0 3px rgba(34,211,238,0.6))" }}
        />
      ))}
      {/* Labels */}
      {dimensions.map((d, i) => {
        const lp = getPoint(i * angleStep, maxR + 18);
        return (
          <text
            key={i}
            x={lp.x}
            y={lp.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-white/50 text-[9px] font-medium"
          >
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   Scoring Engine (client-side)
   ═══════════════════════════════════════════════════════════ */

interface CvScores {
  overall: number;
  completeness: number;
  experience: number;
  education: number;
  skills: number;
  presentation: number;
  contact: number;
  dimensions: { label: string; value: number }[];
  breakdown: { label: string; value: number; color: string }[];
}

function computeScores(cv: Cv, projects: Project[]): CvScores {
  let completeness = 0;
  let experience = 0;
  let education = 0;
  let skills = 0;
  let presentation = 0;
  let contact = 0;

  // ── Contact completeness (0-100) ──
  const contactFields = [
    cv.personalInfo?.fullName,
    cv.personalInfo?.email,
    cv.personalInfo?.phone,
    cv.personalInfo?.location,
    cv.personalInfo?.website,
    cv.personalInfo?.linkedin,
    cv.personalInfo?.github,
  ];
  const filledContacts = contactFields.filter(Boolean).length;
  contact = Math.round((filledContacts / contactFields.length) * 100);

  // ── Experience score (0-100) ──
  const expSection = cv.sections.find((s) => s.type === "experience");
  const expItems = expSection?.content?.items || [];
  if (expItems.length > 0) {
    let itemScore = 0;
    for (const item of expItems) {
      let s = 20; // base for existing
      if (item.title) s += 10;
      if (item.company) s += 10;
      if (item.description && item.description.length > 30) s += 20;
      if (item.highlights?.filter((h: string) => h?.trim()).length >= 2)
        s += 20;
      if (item.startDate) s += 10;
      if (item.endDate || item.current) s += 10;
      itemScore += Math.min(s, 100);
    }
    experience = Math.round(
      Math.min(itemScore / expItems.length, 100) *
        (expItems.length >= 3 ? 1 : expItems.length >= 2 ? 0.85 : 0.7),
    );
  }

  // ── Education score (0-100) ──
  const eduSection = cv.sections.find((s) => s.type === "education");
  const eduItems = eduSection?.content?.items || [];
  if (eduItems.length > 0) {
    let itemScore = 0;
    for (const item of eduItems) {
      let s = 30;
      if (item.degree || item.title) s += 20;
      if (item.institution) s += 20;
      if (item.description) s += 15;
      if (item.startDate || item.endDate) s += 15;
      itemScore += Math.min(s, 100);
    }
    education = Math.round(itemScore / eduItems.length);
  }

  // ── Skills score (0-100) ──
  const skillSection = cv.sections.find((s) => s.type === "skills");
  const skillContent = skillSection?.content;
  let totalSkills = 0;
  let hasCats = false;
  if (skillContent && skillContent.categories?.length > 0) {
    hasCats = true;
    for (const cat of skillContent.categories) {
      totalSkills += (cat.skills || []).length;
    }
  } else if (skillContent?.skills) {
    totalSkills = skillContent.skills.length;
  }
  if (totalSkills > 0) {
    skills = Math.min(
      Math.round(
        (totalSkills >= 10 ? 70 : (totalSkills / 10) * 70) +
          (hasCats ? 30 : 15),
      ),
      100,
    );
  }

  // ── Presentation (0-100) ──
  let pScore = 0;
  if (cv.summary && cv.summary.length > 50) pScore += 25;
  else if (cv.summary) pScore += 10;
  if (cv.personalInfo?.fullName) pScore += 15;
  const visibleSections = cv.sections.filter((s) => s.visible).length;
  pScore += Math.min(visibleSections * 10, 30);
  if (projects.length > 0) pScore += 15;
  if (cv.theme?.primaryColor) pScore += 5;
  if (cv.targetRole) pScore += 10;
  presentation = Math.min(pScore, 100);

  // ── Completeness (0-100) ──
  let cScore = 0;
  if (cv.personalInfo?.fullName) cScore += 10;
  if (cv.personalInfo?.email) cScore += 8;
  if (cv.summary) cScore += 12;
  if (expItems.length > 0) cScore += 20;
  if (eduItems.length > 0) cScore += 15;
  if (totalSkills > 0) cScore += 15;
  if (projects.length > 0) cScore += 10;
  const certSection = cv.sections.find((s) => s.type === "certifications");
  if (certSection?.content?.items?.length > 0) cScore += 10;
  completeness = Math.min(cScore, 100);

  // ── Overall ──
  const overall = Math.round(
    completeness * 0.2 +
      experience * 0.25 +
      education * 0.15 +
      skills * 0.15 +
      presentation * 0.15 +
      contact * 0.1,
  );

  return {
    overall,
    completeness,
    experience,
    education,
    skills,
    presentation,
    contact,
    dimensions: [
      { label: "Complete", value: completeness },
      { label: "Experience", value: experience },
      { label: "Education", value: education },
      { label: "Skills", value: skills },
      { label: "Presence", value: presentation },
      { label: "Contact", value: contact },
    ],
    breakdown: [
      { label: "Completeness", value: completeness, color: "#22d3ee" },
      { label: "Experience", value: experience, color: "#a78bfa" },
      { label: "Education", value: education, color: "#c084fc" },
      { label: "Skills", value: skills, color: "#34d399" },
      { label: "Presentation", value: presentation, color: "#fbbf24" },
      { label: "Contact Info", value: contact, color: "#f472b6" },
    ],
  };
}

/* ═══════════════════════════════════════════════════════════
   AI Suggestion Engine (client-side heuristic)
   ═══════════════════════════════════════════════════════════ */

interface Suggestion {
  id: string;
  severity: "high" | "medium" | "low";
  category: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

function generateSuggestions(cv: Cv, projects: Project[]): Suggestion[] {
  const s: Suggestion[] = [];
  let id = 0;

  // ─── Contact ───
  if (!cv.personalInfo?.email) {
    s.push({
      id: `s${id++}`,
      severity: "high",
      category: "Contact",
      title: "Add an email address",
      description:
        "Recruiters need a direct way to reach you. Adding an email is critical for getting callbacks.",
      icon: Mail,
    });
  }
  if (!cv.personalInfo?.linkedin) {
    s.push({
      id: `s${id++}`,
      severity: "medium",
      category: "Contact",
      title: "Add your LinkedIn profile",
      description:
        "92% of recruiters use LinkedIn. Adding your profile link significantly increases your visibility.",
      icon: Linkedin,
    });
  }
  if (!cv.personalInfo?.phone) {
    s.push({
      id: `s${id++}`,
      severity: "medium",
      category: "Contact",
      title: "Add a phone number",
      description:
        "Many recruiters prefer an initial phone screening. Include a phone number for faster response.",
      icon: Phone,
    });
  }
  if (!cv.personalInfo?.github && !cv.personalInfo?.website) {
    s.push({
      id: `s${id++}`,
      severity: "low",
      category: "Contact",
      title: "Add a portfolio or GitHub link",
      description:
        "Technical hiring managers often review portfolios. Link your GitHub or personal website to showcase your work.",
      icon: Globe,
    });
  }

  // ─── Summary ───
  if (!cv.summary) {
    s.push({
      id: `s${id++}`,
      severity: "high",
      category: "Content",
      title: "Write a professional summary",
      description:
        "A compelling 2-3 sentence summary at the top of your CV captures attention in the first 6 seconds recruiters spend scanning.",
      icon: FileText,
    });
  } else if (cv.summary.length < 80) {
    s.push({
      id: `s${id++}`,
      severity: "medium",
      category: "Content",
      title: "Expand your professional summary",
      description:
        "Your summary is quite short. Aim for 2-3 impactful sentences highlighting your key strengths and career objectives.",
      icon: FileText,
    });
  }

  // ─── Experience ───
  const expSection = cv.sections.find((s) => s.type === "experience");
  const expItems = expSection?.content?.items || [];
  if (expItems.length === 0) {
    s.push({
      id: `s${id++}`,
      severity: "high",
      category: "Experience",
      title: "Add work experience",
      description:
        "Work experience is the most important section for recruiters. Add at least 2-3 relevant positions.",
      icon: Briefcase,
    });
  } else {
    const missingHighlights = expItems.filter(
      (item: any) =>
        !item.highlights ||
        item.highlights.filter((h: string) => h?.trim()).length < 2,
    );
    if (missingHighlights.length > 0) {
      s.push({
        id: `s${id++}`,
        severity: "medium",
        category: "Experience",
        title: `Add bullet points to ${missingHighlights.length} role(s)`,
        description:
          "Quantified bullet points (e.g., 'Increased revenue by 25%') make your achievements concrete and memorable.",
        icon: TrendingUp,
      });
    }
    const missingDesc = expItems.filter(
      (item: any) => !item.description || item.description.length < 30,
    );
    if (missingDesc.length > 0) {
      s.push({
        id: `s${id++}`,
        severity: "low",
        category: "Experience",
        title: `Add descriptions to ${missingDesc.length} role(s)`,
        description:
          "Brief role descriptions provide context about your responsibilities and the scope of your work.",
        icon: Briefcase,
      });
    }
  }

  // ─── Education ───
  const eduSection = cv.sections.find((s) => s.type === "education");
  if (!eduSection?.content?.items?.length) {
    s.push({
      id: `s${id++}`,
      severity: "medium",
      category: "Education",
      title: "Add your education",
      description:
        "Including your educational background adds credibility, especially for early-career professionals.",
      icon: GraduationCap,
    });
  }

  // ─── Skills ───
  const skillSection = cv.sections.find((s) => s.type === "skills");
  const skillContent = skillSection?.content;
  let totalSkills = 0;
  if (skillContent && skillContent.categories?.length > 0) {
    for (const cat of skillContent.categories) {
      totalSkills += (cat.skills || []).length;
    }
  } else if (skillContent?.skills) {
    totalSkills = skillContent.skills.length;
  }
  if (totalSkills === 0) {
    s.push({
      id: `s${id++}`,
      severity: "high",
      category: "Skills",
      title: "Add your technical skills",
      description:
        "ATS systems scan for keywords from job descriptions. List your skills to pass automated filters.",
      icon: Target,
    });
  } else if (totalSkills < 5) {
    s.push({
      id: `s${id++}`,
      severity: "low",
      category: "Skills",
      title: "Add more skills",
      description: `You have ${totalSkills} skills listed. Aim for 8-15 relevant skills to improve ATS matching rates.`,
      icon: Target,
    });
  }
  if (totalSkills > 0 && !skillContent?.categories?.length) {
    s.push({
      id: `s${id++}`,
      severity: "low",
      category: "Skills",
      title: "Categorize your skills",
      description:
        "Grouping skills into categories (e.g., Languages, Frameworks, Tools) makes them easier to scan.",
      icon: Layers,
    });
  }

  // ─── Projects ───
  if (projects.length === 0) {
    s.push({
      id: `s${id++}`,
      severity: "low",
      category: "Portfolio",
      title: "Add portfolio projects",
      description:
        "Showcasing real projects demonstrates practical skills. Add 2-3 projects with descriptions and tech stacks.",
      icon: Code2,
    });
  } else {
    const noDesc = projects.filter((p) => !p.description);
    if (noDesc.length > 0) {
      s.push({
        id: `s${id++}`,
        severity: "low",
        category: "Portfolio",
        title: `Add descriptions to ${noDesc.length} project(s)`,
        description:
          "Project descriptions help reviewers understand the scope and impact of your work.",
        icon: FolderOpen,
      });
    }
  }

  // ─── Target Role ───
  if (!cv.targetRole) {
    s.push({
      id: `s${id++}`,
      severity: "low",
      category: "Strategy",
      title: "Set a target role",
      description:
        "Defining a target role helps tailor your CV and signals clear career direction to recruiters.",
      icon: Target,
    });
  }

  return s;
}

const severityConfig = {
  high: {
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    text: "text-red-400",
    badge: "bg-red-500/20 text-red-300",
    label: "High Priority",
  },
  medium: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-400",
    badge: "bg-amber-500/20 text-amber-300",
    label: "Recommended",
  },
  low: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    text: "text-blue-400",
    badge: "bg-blue-500/20 text-blue-300",
    label: "Nice to Have",
  },
};

/* ═══════════════════════════════════════════════════════════
   Analytics & Suggestions Panels
   ═══════════════════════════════════════════════════════════ */

function AnalyticsPanel({
  scores,
  suggestions,
}: {
  scores: CvScores;
  suggestions: Suggestion[];
}) {
  const [showAll, setShowAll] = useState(false);
  const highCount = suggestions.filter((s) => s.severity === "high").length;
  const medCount = suggestions.filter((s) => s.severity === "medium").length;
  const displaySuggestions = showAll ? suggestions : suggestions.slice(0, 4);

  const scoreLabel =
    scores.overall >= 80
      ? "Excellent"
      : scores.overall >= 60
        ? "Good"
        : scores.overall >= 40
          ? "Needs Work"
          : "Weak";

  return (
    <div className="space-y-8">
      {/* ── Score Overview ── */}
      <GlassCard className="p-6 sm:p-8" neonBorder="cyan">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-lg shadow-cyan-500/30">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Recruiter Compatibility Score
            </h3>
            <p className="text-xs text-white/70">
              AI-powered analysis of your CV strength
            </p>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-[auto_1fr]">
          {/* Main radial score */}
          <div className="flex flex-col items-center gap-2">
            <RadialScore
              score={scores.overall}
              size={150}
              strokeWidth={10}
              label="Overall Score"
              sublabel={scoreLabel}
            />
            <div className="mt-2 flex gap-3">
              {highCount > 0 && (
                <span className="flex items-center gap-1 text-[10px] text-red-400">
                  <AlertTriangle className="h-3 w-3" /> {highCount} critical
                </span>
              )}
              {medCount > 0 && (
                <span className="flex items-center gap-1 text-[10px] text-amber-400">
                  <Info className="h-3 w-3" /> {medCount} tips
                </span>
              )}
            </div>
          </div>

          {/* Breakdown bars */}
          <div className="space-y-3">
            {scores.breakdown.map((item) => (
              <HorizontalBar
                key={item.label}
                label={item.label}
                value={item.value}
                color={item.color}
              />
            ))}
          </div>
        </div>
      </GlassCard>

      {/* ── Radar Chart ── */}
      <div className="grid gap-6 sm:grid-cols-2">
        <GlassCard className="p-6" neonBorder="purple">
          <div className="mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-purple-400" />
            <h4 className="text-sm font-semibold text-white/90">
              Multi-Dimension Analysis
            </h4>
          </div>
          <RadarChart dimensions={scores.dimensions} size={220} />
        </GlassCard>

        {/* Mini score grid */}
        <GlassCard className="p-6" neonBorder="cyan">
          <div className="mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4 text-cyan-400" />
            <h4 className="text-sm font-semibold text-white/90">
              Quick Metrics
            </h4>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <RadialScore
              score={scores.completeness}
              size={72}
              strokeWidth={5}
              label="Complete"
            />
            <RadialScore
              score={scores.experience}
              size={72}
              strokeWidth={5}
              label="Experience"
            />
            <RadialScore
              score={scores.skills}
              size={72}
              strokeWidth={5}
              label="Skills"
            />
          </div>
        </GlassCard>
      </div>

      {/* ── AI Suggestions ── */}
      {suggestions.length > 0 && (
        <GlassCard className="p-6 sm:p-8" neonBorder="pink">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-400 to-purple-600 shadow-lg shadow-pink-500/30">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  AI-Driven Suggestions
                </h3>
                <p className="text-xs text-white/70">
                  {suggestions.length} improvement
                  {suggestions.length !== 1 ? "s" : ""} detected
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {(["high", "medium", "low"] as const).map((sev) => {
                const count = suggestions.filter(
                  (s) => s.severity === sev,
                ).length;
                if (count === 0) return null;
                return (
                  <span
                    key={sev}
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${severityConfig[sev].badge}`}
                  >
                    {count}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            {displaySuggestions.map((sug) => {
              const cfg = severityConfig[sug.severity];
              return (
                <div
                  key={sug.id}
                  className={`rounded-xl border p-4 transition-all duration-300 hover:bg-white/[0.02] ${cfg.border} ${cfg.bg}`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cfg.bg} ${cfg.text}`}
                    >
                      <sug.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-white">
                          {sug.title}
                        </h4>
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${cfg.badge}`}
                        >
                          {cfg.label}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-white/80">
                        {sug.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {suggestions.length > 4 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-4 flex items-center gap-1.5 text-xs font-medium text-cyan-400 transition hover:text-cyan-300"
            >
              {showAll ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" /> Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" /> Show all{" "}
                  {suggestions.length} suggestions
                </>
              )}
            </button>
          )}
        </GlassCard>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Quick Stats Bar
   ═══════════════════════════════════════════════════════════ */

function QuickStats({
  cv,
  projects,
  scores,
}: {
  cv: Cv;
  projects: Project[];
  scores: CvScores;
}) {
  const expCount =
    cv.sections.find((s) => s.type === "experience")?.content?.items?.length ||
    0;
  const skillContent = cv.sections.find((s) => s.type === "skills")?.content;
  let skillCount = 0;
  if (skillContent && skillContent.categories?.length > 0) {
    for (const cat of skillContent.categories) {
      skillCount += (cat.skills || []).length;
    }
  } else if (skillContent?.skills) {
    skillCount = skillContent.skills.length;
  }

  const stats = [
    {
      icon: Briefcase,
      label: "Positions",
      value: expCount,
      color: "text-cyan-400",
    },
    {
      icon: Hash,
      label: "Skills",
      value: skillCount,
      color: "text-emerald-400",
    },
    {
      icon: Code2,
      label: "Projects",
      value: projects.length,
      color: "text-purple-400",
    },
    {
      icon: TrendingUp,
      label: "Score",
      value: `${scores.overall}%`,
      color: "text-cyan-400",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <GlassCard
            key={stat.label}
            className="flex items-center gap-3 p-4"
            neonBorder="none"
          >
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
            <div>
              <p className="text-lg font-black text-white">{stat.value}</p>
              <p className="text-[10px] font-medium uppercase tracking-wider text-white/70">
                {stat.label}
              </p>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════════ */

export default function PublicCvPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [cv, setCv] = useState<Cv | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const loadCv = async () => {
      try {
        const res = await cvApi.getPublic(slug);
        setCv(res.data);
        if (res.data._id) {
          try {
            const projRes = await projectsApi.getByCv(res.data._id);
            setProjects(projRes.data);
          } catch {
            /* no projects */
          }
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    loadCv();
  }, [slug]);

  // Compute scores & suggestions
  const scores = useMemo(
    () => (cv ? computeScores(cv, projects) : null),
    [cv, projects],
  );
  const suggestions = useMemo(
    () => (cv ? generateSuggestions(cv, projects) : []),
    [cv, projects],
  );

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030014]">
        <div className="text-center">
          <div className="relative mx-auto mb-6 h-16 w-16">
            <div className="absolute inset-0 animate-ping rounded-full bg-cyan-500/20" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/10">
              <Sparkles className="h-7 w-7 text-cyan-400" />
            </div>
          </div>
          <p className="text-sm font-medium text-white/70">
            Loading portfolio...
          </p>
        </div>
      </div>
    );
  }

  /* ── Not Found ── */
  if (notFound || !cv) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#030014]">
        <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
          <FileText className="h-10 w-10 text-white/50" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-white">CV Not Found</h1>
        <p className="text-white/75">
          This CV does not exist or is not publicly available.
        </p>
      </div>
    );
  }

  const primaryColor = cv.theme?.primaryColor || "#06b6d4";
  const visibleSections = cv.sections
    .filter((s) => s.visible)
    .sort((a, b) => a.order - b.order);
  const visibleProjects = projects.filter((p) => p.isVisible);
  const initials = cv.personalInfo?.fullName
    ? cv.personalInfo.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "CV";
  const displayName = cv.personalInfo?.fullName || cv.title;

  const navSections = visibleSections.map((s, i) => ({
    id: `section-${i}`,
    label: s.title,
  }));

  const contactItems = [
    {
      icon: Mail,
      value: cv.personalInfo?.email,
      href: cv.personalInfo?.email
        ? `mailto:${cv.personalInfo.email}`
        : undefined,
    },
    {
      icon: Phone,
      value: cv.personalInfo?.phone,
      href: cv.personalInfo?.phone ? `tel:${cv.personalInfo.phone}` : undefined,
    },
    { icon: MapPin, value: cv.personalInfo?.location },
    {
      icon: Globe,
      value: cv.personalInfo?.website ? "Website" : undefined,
      href: cv.personalInfo?.website,
    },
    {
      icon: Github,
      value: cv.personalInfo?.github ? "GitHub" : undefined,
      href: cv.personalInfo?.github,
    },
    {
      icon: Linkedin,
      value: cv.personalInfo?.linkedin ? "LinkedIn" : undefined,
      href: cv.personalInfo?.linkedin,
    },
  ].filter((c) => c.value);

  return (
    <div className="relative min-h-screen bg-[#030014] text-white selection:bg-cyan-500/30">
      {/* Three.js Background */}
      <NeonBackground />

      {/* Reading progress */}
      <ReadingProgress />

      {/* Gradient overlays */}
      <div className="pointer-events-none fixed inset-0 z-[1] bg-gradient-to-b from-[#030014]/60 via-transparent to-[#030014]/80" />
      <div
        className="pointer-events-none fixed inset-0 z-[1] opacity-30"
        style={{
          background: `radial-gradient(ellipse 60% 40% at 50% 0%, ${primaryColor}15, transparent)`,
        }}
      />

      {/* Sticky Top Navigation */}
      <TopNav
        name={displayName}
        initials={initials}
        primaryColor={primaryColor}
        sections={navSections}
        hasProjects={visibleProjects.length > 0}
        hasAnalytics={!!scores}
      />

      {/* Scroll Controls */}
      <ScrollControls />

      {/* ══════════════ Content ══════════════ */}
      <div className="relative z-10">
        {/* ── Hero / Header ── */}
        <header className="relative overflow-hidden pb-8 pt-24 sm:pb-16 sm:pt-36">
          <div className="mx-auto max-w-4xl px-6">
            <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left sm:gap-8">
              {/* Avatar */}
              <div className="group relative mb-6 sm:mb-0">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 opacity-60 blur-md transition group-hover:opacity-80" />
                <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-2 border-white/10 bg-[#0a0a2e] sm:h-32 sm:w-32">
                  <span
                    className="text-3xl font-black tracking-wider sm:text-4xl"
                    style={{ color: primaryColor }}
                  >
                    {initials}
                  </span>
                </div>
                <div className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-[#030014] bg-emerald-400 shadow-lg shadow-emerald-500/40" />
              </div>

              <div className="flex-1 min-w-0">
                <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
                    {displayName}
                  </span>
                </h1>

                {cv.targetRole && (
                  <p className="mt-3 text-lg font-medium text-cyan-300/80">
                    {cv.targetRole}
                    {cv.targetCompany && (
                      <span className="text-white/70">
                        {" "}
                        @ {cv.targetCompany}
                      </span>
                    )}
                  </p>
                )}

                {cv.summary && (
                  <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
                    {cv.summary}
                  </p>
                )}

                {/* Contact pills */}
                {contactItems.length > 0 && (
                  <div className="mt-6 flex flex-wrap justify-center gap-2 sm:justify-start">
                    {contactItems.map((item, i) => {
                      const Comp = item.href ? "a" : "span";
                      const linkProps = item.href
                        ? {
                            href: item.href,
                            target: "_blank" as const,
                            rel: "noopener noreferrer",
                          }
                        : {};
                      return (
                        <Comp
                          key={i}
                          {...linkProps}
                          className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 backdrop-blur-sm transition hover:border-cyan-500/30 hover:bg-cyan-500/5 hover:text-cyan-300 ${item.href ? "cursor-pointer" : ""}`}
                        >
                          <item.icon className="h-3.5 w-3.5" />
                          {item.value}
                        </Comp>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* ── Quick Stats Bar ── */}
        {scores && (
          <div className="py-6">
            <QuickStats cv={cv} projects={projects} scores={scores} />
          </div>
        )}

        {/* ── Divider ── */}
        <div className="mx-auto max-w-4xl px-6">
          <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
        </div>

        {/* ── CV Sections ── */}
        <main className="mx-auto max-w-4xl px-6 py-16 space-y-20">
          {visibleSections.map((section, idx) => {
            const meta = sectionMeta[section.type] || {
              icon: FileText,
              color: "cyan",
              neon: "cyan" as const,
            };
            return (
              <section key={idx} id={`section-${idx}`} className="scroll-mt-24">
                <SectionTitle
                  icon={meta.icon}
                  title={section.title}
                  color={meta.color}
                />
                <RenderSection section={section} />
              </section>
            );
          })}

          {/* ── Projects ── */}
          {visibleProjects.length > 0 && (
            <section id="projects" className="scroll-mt-24">
              <SectionTitle icon={Code2} title="Projects" color="purple" />
              <div className="grid gap-6 sm:grid-cols-2">
                {visibleProjects.map((project) => (
                  <ProjectCard key={project._id} project={project} />
                ))}
              </div>
            </section>
          )}

          {/* ── Analytics & AI Suggestions ── */}
          {scores && (
            <section id="analytics" className="scroll-mt-24">
              <SectionTitle
                icon={BarChart3}
                title="CV Analytics & AI Insights"
                color="cyan"
              />
              <AnalyticsPanel scores={scores} suggestions={suggestions} />
            </section>
          )}
        </main>

        {/* ── Footer ── */}
        <footer className="relative border-t border-white/5 py-12">
          <div className="mx-auto max-w-4xl px-6">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black"
                  style={{
                    backgroundColor: `${primaryColor}20`,
                    color: primaryColor,
                  }}
                >
                  {initials}
                </div>
                <span className="text-sm text-white/70">{displayName}</span>
              </div>
              <div className="flex items-center gap-4">
                {cv.personalInfo?.github && (
                  <a
                    href={cv.personalInfo.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/60 transition hover:text-white/90"
                  >
                    <Github className="h-4 w-4" />
                  </a>
                )}
                {cv.personalInfo?.linkedin && (
                  <a
                    href={cv.personalInfo.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/60 transition hover:text-white/90"
                  >
                    <Linkedin className="h-4 w-4" />
                  </a>
                )}
                {cv.personalInfo?.website && (
                  <a
                    href={cv.personalInfo.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/60 transition hover:text-white/90"
                  >
                    <Globe className="h-4 w-4" />
                  </a>
                )}
              </div>
              <p className="text-xs text-white/50">
                Built with <span className="text-cyan-500/80">GoCV</span>
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
