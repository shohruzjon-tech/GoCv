"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import NextImage from "next/image";
import dynamic from "next/dynamic";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
  AnimatePresence,
} from "framer-motion";
import {
  FileText,
  Sparkles,
  Globe,
  Download,
  Zap,
  Shield,
  Palette,
  MessageSquare,
  ArrowRight,
  Star,
  Check,
  ChevronRight,
  Layers,
  Users,
  TrendingUp,
  X,
  Upload,
  FolderOpen,
  Code2,
  ExternalLink,
  Eye,
  Link2,
  Wand2,
  Image,
  Cpu,
  Menu,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

import { siteSettingsApi } from "@/lib/api";

const ThreeBackground = dynamic(() => import("@/components/three-background"), {
  ssr: false,
});

// ─── Framer Motion helpers ───

function FadeInWhenVisible({
  children,
  className,
  delay = 0,
  direction = "up",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const dirs = {
    up: { y: 50, x: 0 },
    down: { y: -50, x: 0 },
    left: { x: 60, y: 0 },
    right: { x: -60, y: 0 },
  };
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...dirs[direction] }}
      animate={
        isInView
          ? { opacity: 1, x: 0, y: 0 }
          : { opacity: 0, ...dirs[direction] }
      }
      transition={{
        duration: 0.7,
        delay,
        ease: [0.25, 0.4, 0.25, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function ParallaxSection({
  children,
  speed = 0.2,
  className,
}: {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [80 * speed, -80 * speed]);
  const smoothY = useSpring(y, { stiffness: 100, damping: 30, mass: 0.5 });
  return (
    <motion.div ref={ref} style={{ y: smoothY }} className={className}>
      {children}
    </motion.div>
  );
}

function NeonGlow({
  color = "indigo",
  className = "",
}: {
  color?: string;
  className?: string;
}) {
  const colors: Record<string, string> = {
    indigo: "bg-indigo-500/15",
    purple: "bg-purple-500/15",
    cyan: "bg-cyan-500/15",
    pink: "bg-pink-500/15",
    emerald: "bg-emerald-500/15",
  };
  return (
    <div
      className={`pointer-events-none absolute rounded-full blur-[120px] ${colors[color] || colors.indigo} ${className}`}
    />
  );
}

// ─── Main Page ───

export default function Home() {
  const [showLogin, setShowLogin] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [wizardMode, setWizardMode] = useState<"generate" | "polish">(
    "generate",
  );
  const [inputText, setInputText] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [creatorInfo, setCreatorInfo] = useState<any>(null);

  const { scrollYProgress } = useScroll();
  const headerBlur = useTransform(scrollYProgress, [0, 0.05], [0, 20]);
  const headerBg = useTransform(
    scrollYProgress,
    [0, 0.05],
    ["rgba(8,8,26,0)", "rgba(8,8,26,0.85)"],
  );

  useEffect(() => {
    siteSettingsApi
      .getCreatorInfo()
      .then((res) => {
        if (res.data?.name) setCreatorInfo(res.data);
      })
      .catch(() => {});
  }, []);

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/api/auth/google`;
  };

  const handleSmartSubmit = () => {
    const payload: Record<string, string> = {
      sourceType: wizardMode === "polish" ? "upload" : "prompt",
      wizardMode,
    };
    if (wizardMode === "generate") {
      payload.sourceText = inputText;
    }
    if (wizardMode === "polish" && uploadedFile) {
      payload.sourceFileName = uploadedFile.name;
      const reader = new FileReader();
      reader.onload = () => {
        payload.fileBase64 = reader.result as string;
        localStorage.setItem("pending_cv_wizard", JSON.stringify(payload));
        const token = localStorage.getItem("token");
        if (token) {
          window.location.href =
            wizardMode === "polish"
              ? "/dashboard/cv/generate/polish"
              : "/dashboard/cv/generate/ai";
        } else {
          setShowLogin(true);
        }
      };
      reader.readAsDataURL(uploadedFile);
      return;
    }
    localStorage.setItem("pending_cv_wizard", JSON.stringify(payload));
    const token = localStorage.getItem("token");
    if (token) {
      window.location.href =
        wizardMode === "polish"
          ? "/dashboard/cv/generate/polish"
          : "/dashboard/cv/generate/ai";
    } else {
      setShowLogin(true);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setUploadedFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setUploadedFile(file);
  };

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowLogin(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Showcase", href: "#live-cv" },
    { label: "Pricing", href: "#pricing" },
    ...(creatorInfo ? [{ label: "Creator", href: "#creator" }] : []),
  ];

  return (
    <div className="relative z-10 min-h-screen overflow-x-hidden text-content">
      <ThreeBackground />

      {/* ═══ Login Modal ═══ */}
      <AnimatePresence>
        {showLogin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
              onClick={() => setShowLogin(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md mx-4"
            >
              <div className="rounded-3xl border border-indigo-500/20 bg-[#0c0c24]/95 p-8 shadow-2xl shadow-indigo-600/10 backdrop-blur-xl">
                <button
                  onClick={() => setShowLogin(false)}
                  className="absolute right-4 top-4 rounded-xl p-2 text-content-3 transition hover:bg-white/5 hover:text-content"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="mb-8 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/20 ring-1 ring-indigo-500/30 shadow-lg shadow-indigo-600/20">
                    <Sparkles className="h-7 w-7 text-indigo-400" />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-content">
                    Welcome to Go
                    <span className="neon-text-gradient">CV</span>
                  </h2>
                  <p className="mt-2 text-sm text-content-2">
                    Sign in to create your professional CV
                  </p>
                </div>

                <button
                  onClick={handleGoogleLogin}
                  className="group flex w-full items-center justify-center gap-3 rounded-2xl border border-edge bg-white/5 px-6 py-3.5 text-base font-medium text-content transition-all hover:bg-white/10"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continue with Google
                  <ArrowRight className="h-4 w-4 text-content-3 transition-transform group-hover:translate-x-0.5" />
                </button>

                <div className="my-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-edge" />
                  <span className="text-xs font-medium text-content-4">or</span>
                  <div className="h-px flex-1 bg-edge" />
                </div>

                <div className="flex gap-3">
                  <Link
                    href="/login"
                    onClick={() => setShowLogin(false)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-edge bg-white/5 px-4 py-3 text-sm font-medium text-content transition-all hover:bg-white/10"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={() => setShowLogin(false)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-500"
                  >
                    Create Account
                  </Link>
                </div>

                <p className="mt-6 text-center text-xs text-content-4">
                  By signing in, you agree to our{" "}
                  <Link
                    href="/terms-of-service"
                    className="text-indigo-400 hover:text-indigo-300"
                  >
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy-policy"
                    className="text-indigo-400 hover:text-indigo-300"
                  >
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Navbar — fixed on desktop, static on mobile ═══ */}
      <motion.header
        className={`top-0 z-50 w-full transition-colors duration-300 md:fixed ${scrolled ? "md:border-b md:border-edge/50" : ""}`}
        style={{
          backdropFilter:
            headerBlur.get() > 0 ? `blur(${headerBlur}px)` : undefined,
          WebkitBackdropFilter:
            headerBlur.get() > 0 ? `blur(${headerBlur}px)` : undefined,
          backgroundColor: headerBg,
        }}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:h-20 md:px-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <NextImage
              src="/gocv_logo.png"
              alt="GoCV"
              width={120}
              height={36}
              className="h-8 w-auto object-contain  transition group-hover:opacity-80 md:h-10"
              priority
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-7 md:flex">
            {navLinks.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="relative text-sm font-medium text-content-3 transition hover:text-content after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:bg-indigo-500 after:transition-all hover:after:w-full"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowLogin(true)}
              className="hidden rounded-xl px-5 py-2.5 text-sm font-medium text-content-3 transition hover:text-content sm:inline-flex"
            >
              Sign In
            </button>
            <button
              onClick={() => setShowLogin(true)}
              className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500 hover:shadow-indigo-500/30"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </button>
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden rounded-xl p-2 text-content-2 hover:bg-white/5"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Mobile slide-down menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
              className="overflow-hidden border-b border-edge/50 bg-[#0a0a1e]/95 backdrop-blur-xl md:hidden"
            >
              <nav className="flex flex-col gap-1 px-5 py-4">
                {navLinks.map((l) => (
                  <a
                    key={l.label}
                    href={l.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl px-4 py-3 text-sm font-medium text-content-2 transition hover:bg-white/5 hover:text-content"
                  >
                    {l.label}
                  </a>
                ))}
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => {
                      setShowLogin(true);
                      setMobileMenuOpen(false);
                    }}
                    className="flex-1 rounded-xl border border-edge px-4 py-3 text-sm font-medium text-content-2 transition hover:bg-white/5"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setShowLogin(true);
                      setMobileMenuOpen(false);
                    }}
                    className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25"
                  >
                    Get Started
                  </button>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <main>
        {/* ═══════════════════════════════════════════
            HERO — Futuristic with neon accents
        ═══════════════════════════════════════════ */}
        <section className="relative flex min-h-[100svh] items-center justify-center px-5 pt-16 pb-12 md:px-6 md:pt-20 overflow-hidden">
          {/* Neon glow overlays */}
          <NeonGlow
            color="indigo"
            className="h-[500px] w-[500px] -top-20 left-1/2 -translate-x-1/2 md:h-[700px] md:w-[700px]"
          />
          <NeonGlow
            color="purple"
            className="h-[300px] w-[300px] bottom-20 -left-20 md:h-[400px] md:w-[400px]"
          />
          <NeonGlow
            color="cyan"
            className="h-[200px] w-[200px] top-1/3 -right-10 md:h-[300px] md:w-[300px]"
          />

          {/* Hero radial overlay — extended bottom to prevent hard edge */}
          <div className="hero-overlay pointer-events-none absolute -inset-x-0 -top-0 -bottom-20 z-[1]" />

          <div className="relative z-[2] mx-auto max-w-5xl text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-xs font-semibold text-indigo-300 shadow-lg shadow-indigo-600/10 sm:mb-8 sm:px-5 sm:text-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-400" />
              </span>
              <span className="hidden sm:inline">
                Powered by GPT-5 Artificial Intelligence
              </span>
              <span className="sm:hidden">AI-Powered CV Builder</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.7,
                delay: 0.15,
                ease: [0.25, 0.4, 0.25, 1],
              }}
              className="mb-6 text-4xl font-extrabold leading-[1.08] tracking-tight text-content sm:text-5xl lg:text-7xl"
            >
              Your Career,{" "}
              <span className="neon-text-gradient">Beautifully Crafted</span>
              <br className="hidden sm:block" />
              <span className="sm:hidden"> </span>by AI
            </motion.h1>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.7,
                delay: 0.3,
                ease: [0.25, 0.4, 0.25, 1],
              }}
              className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-content-2 sm:mb-12 sm:text-lg md:text-xl"
            >
              Describe yourself or upload an existing CV — our AI crafts a
              stunning, ATS-optimized resume and shareable landing page in
              minutes.
            </motion.p>

            {/* ═══ Generate / Polish Section — NEON STYLED ═══ */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.45,
                ease: [0.25, 0.4, 0.25, 1],
              }}
              className="mx-auto max-w-2xl text-left"
            >
              <div className="neon-card relative rounded-[28px] border border-indigo-500/30 bg-[#0c0c24]/80 p-3 shadow-2xl shadow-indigo-600/10 backdrop-blur-2xl sm:p-4">
                {/* Neon border glow */}
                <div className="pointer-events-none absolute -inset-[1px] rounded-[28px] bg-gradient-to-b from-indigo-500/20 via-purple-500/10 to-cyan-500/5 opacity-60" />
                <div className="pointer-events-none absolute -inset-[1px] rounded-[28px] neon-border-glow" />

                {/* Mode Router */}
                <div className="relative mb-3 flex gap-1.5 rounded-2xl bg-black/40 p-1 ring-1 ring-white/5 sm:gap-2 sm:p-1.5">
                  <button
                    onClick={() => setWizardMode("generate")}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-all sm:px-5 sm:py-3.5 sm:text-base ${
                      wizardMode === "generate"
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/40 neon-btn-glow"
                        : "text-content-3 hover:text-content hover:bg-white/5"
                    }`}
                  >
                    <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="hidden sm:inline">Generate with AI</span>
                    <span className="sm:hidden">AI Generate</span>
                  </button>
                  <button
                    onClick={() => setWizardMode("polish")}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-all sm:px-5 sm:py-3.5 sm:text-base ${
                      wizardMode === "polish"
                        ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/40 neon-btn-glow-green"
                        : "text-content-3 hover:text-content hover:bg-white/5"
                    }`}
                  >
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="hidden sm:inline">Polish my CV</span>
                    <span className="sm:hidden">Polish CV</span>
                  </button>
                </div>

                {/* Input Area */}
                <div className="relative px-1 pb-1 sm:px-2 sm:pb-2">
                  <AnimatePresence mode="wait">
                    {wizardMode === "generate" ? (
                      <motion.div
                        key="generate"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <textarea
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          placeholder="I'm a senior software engineer with 5 years of experience in React, Node.js, and cloud technologies. I've led teams of 8+ engineers and shipped products used by millions..."
                          rows={4}
                          className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 p-4 text-[15px] leading-relaxed text-content placeholder:text-content-4 focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition sm:text-base"
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="polish"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragOver(true);
                          }}
                          onDragLeave={() => setIsDragOver(false)}
                          onDrop={handleFileDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed py-8 transition-all sm:py-10 ${
                            isDragOver
                              ? "border-indigo-500 bg-indigo-500/10"
                              : uploadedFile
                                ? "border-emerald-500/50 bg-emerald-500/5"
                                : "border-white/10 bg-white/5 hover:border-indigo-500/30 hover:bg-indigo-500/5"
                          }`}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                          {uploadedFile ? (
                            <>
                              <FileText className="mb-2 h-8 w-8 text-emerald-400" />
                              <p className="text-sm font-medium text-content">
                                {uploadedFile.name}
                              </p>
                              <p className="mt-1 text-xs text-content-3">
                                Click to replace
                              </p>
                            </>
                          ) : (
                            <>
                              <Upload className="mb-2 h-8 w-8 text-content-4" />
                              <p className="text-sm font-medium text-content-2">
                                Drop your CV here or{" "}
                                <span className="text-indigo-400">browse</span>
                              </p>
                              <p className="mt-1 text-xs text-content-4">
                                PDF, DOC, DOCX up to 10MB
                              </p>
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                    onClick={handleSmartSubmit}
                    disabled={
                      wizardMode === "polish"
                        ? !uploadedFile
                        : !inputText.trim()
                    }
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className={`mt-3 group flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-[15px] font-bold text-white shadow-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed sm:text-base ${
                      wizardMode === "polish"
                        ? "bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-600/30 hover:shadow-emerald-500/40 neon-btn-glow-green"
                        : "bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 shadow-indigo-600/30 hover:shadow-indigo-500/40 neon-btn-glow"
                    }`}
                  >
                    {wizardMode === "polish" ? (
                      <>
                        <FileText className="h-5 w-5" />
                        Polish My CV
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        Generate My CV
                      </>
                    )}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.7 }}
              className="mt-10 flex flex-col items-center gap-4 sm:mt-14 sm:flex-row sm:justify-center sm:gap-8"
            >
              <div className="flex -space-x-3">
                {[
                  "bg-indigo-500",
                  "bg-purple-500",
                  "bg-pink-500",
                  "bg-amber-500",
                  "bg-emerald-500",
                ].map((bg, i) => (
                  <div
                    key={i}
                    className={`h-9 w-9 rounded-full ${bg} ring-2 ring-[#08081a] flex items-center justify-center text-xs font-bold text-white sm:h-10 sm:w-10`}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <div className="text-sm text-content-2 sm:text-base">
                <span className="font-bold text-content">2,500+</span>{" "}
                professionals already building
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-amber-400 text-amber-400"
                  />
                ))}
                <span className="ml-2 text-sm font-semibold text-content-2">
                  4.9/5
                </span>
              </div>
            </motion.div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2"
          >
            <span className="text-[10px] uppercase tracking-[0.2em] text-content-4">
              Scroll
            </span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{
                repeat: Infinity,
                duration: 1.5,
                ease: "easeInOut",
              }}
              className="h-6 w-3.5 rounded-full border border-content-4/50 flex items-start justify-center p-1"
            >
              <div className="h-1.5 w-1 rounded-full bg-indigo-400" />
            </motion.div>
          </motion.div>
        </section>

        {/* ═══ Trust Bar ═══ */}
        <ParallaxSection speed={0.1}>
          <section className="border-y border-edge/50 bg-surface/60 backdrop-blur-md py-10 md:py-12">
            <div className="mx-auto max-w-7xl px-5 md:px-6">
              <p className="mb-6 text-center text-xs font-medium uppercase tracking-[0.2em] text-content-4 md:mb-8 md:text-sm">
                Trusted by professionals at
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 opacity-30 md:gap-x-12 md:gap-y-6">
                {[
                  "Google",
                  "Microsoft",
                  "Amazon",
                  "Meta",
                  "Apple",
                  "Netflix",
                ].map((name) => (
                  <span
                    key={name}
                    className="text-lg font-bold tracking-tight text-content-2 md:text-xl"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </ParallaxSection>

        {/* ═══ Features Grid ═══ */}
        <section
          id="features"
          className="relative py-20 md:py-32 overflow-hidden"
        >
          <NeonGlow
            color="purple"
            className="h-[500px] w-[500px] top-0 -right-40"
          />
          <NeonGlow
            color="indigo"
            className="h-[400px] w-[400px] bottom-0 -left-40"
          />

          <div className="relative mx-auto max-w-7xl px-5 md:px-6">
            <FadeInWhenVisible className="mx-auto mb-14 max-w-2xl text-center md:mb-20">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-400">
                <Layers className="h-3.5 w-3.5" />
                Features
              </div>
              <h2 className="mb-5 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Everything You Need to{" "}
                <span className="neon-text-gradient">Stand Out</span>
              </h2>
              <p className="text-base text-content-2 md:text-lg">
                From AI-powered content generation to stunning designs,
                we&apos;ve built every tool you need.
              </p>
            </FadeInWhenVisible>

            <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Sparkles,
                  color: "indigo",
                  title: "AI Content Generation",
                  desc: "GPT-5 analyzes your experience and generates optimized, professional content tailored to your industry and role.",
                },
                {
                  icon: Globe,
                  color: "purple",
                  title: "Shareable Online Page",
                  desc: "Get a custom gocv.live URL that serves as your professional landing page — share it anywhere.",
                },
                {
                  icon: Download,
                  color: "pink",
                  title: "PDF Export",
                  desc: "Download pixel-perfect PDFs optimized for ATS systems, ready to submit with any application.",
                },
                {
                  icon: Palette,
                  color: "amber",
                  title: "Beautiful Themes",
                  desc: "Choose from professionally designed layouts with customizable colors, fonts, and spacing.",
                },
                {
                  icon: MessageSquare,
                  color: "emerald",
                  title: "AI Chat Assistant",
                  desc: "Chat with our AI to refine sections, get suggestions, or completely rewrite your CV in real-time.",
                },
                {
                  icon: Shield,
                  color: "cyan",
                  title: "ATS-Optimized",
                  desc: "Every CV is built with Applicant Tracking Systems in mind, ensuring your resume passes screening.",
                },
              ].map((feat, i) => {
                const iconColorMap: Record<string, string> = {
                  indigo:
                    "bg-indigo-500/10 text-indigo-400 ring-indigo-500/20 shadow-indigo-500/10",
                  purple:
                    "bg-purple-500/10 text-purple-400 ring-purple-500/20 shadow-purple-500/10",
                  pink: "bg-pink-500/10 text-pink-400 ring-pink-500/20 shadow-pink-500/10",
                  amber:
                    "bg-amber-500/10 text-amber-400 ring-amber-500/20 shadow-amber-500/10",
                  emerald:
                    "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20 shadow-emerald-500/10",
                  cyan: "bg-cyan-500/10 text-cyan-400 ring-cyan-500/20 shadow-cyan-500/10",
                };
                const borderGlow: Record<string, string> = {
                  indigo:
                    "hover:border-indigo-500/30 hover:shadow-indigo-500/5",
                  purple:
                    "hover:border-purple-500/30 hover:shadow-purple-500/5",
                  pink: "hover:border-pink-500/30 hover:shadow-pink-500/5",
                  amber: "hover:border-amber-500/30 hover:shadow-amber-500/5",
                  emerald:
                    "hover:border-emerald-500/30 hover:shadow-emerald-500/5",
                  cyan: "hover:border-cyan-500/30 hover:shadow-cyan-500/5",
                };

                return (
                  <FadeInWhenVisible key={feat.title} delay={i * 0.08}>
                    <motion.div
                      whileHover={{ y: -4, scale: 1.01 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                      }}
                      className={`group relative rounded-2xl border border-edge bg-[#0c0c24]/60 p-6 backdrop-blur-sm transition-all shadow-xl shadow-transparent md:rounded-3xl md:p-8 ${borderGlow[feat.color]}`}
                    >
                      <div
                        className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ring-1 shadow-lg ${iconColorMap[feat.color]}`}
                      >
                        <feat.icon className="h-5 w-5" />
                      </div>
                      <h3 className="mb-2 text-lg font-semibold text-content">
                        {feat.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-content-2">
                        {feat.desc}
                      </p>
                    </motion.div>
                  </FadeInWhenVisible>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══ How It Works ═══ */}
        <section
          id="how-it-works"
          className="relative py-20 md:py-32 overflow-hidden"
        >
          <NeonGlow
            color="cyan"
            className="h-[500px] w-[500px] top-1/4 left-1/2 -translate-x-1/2"
          />

          <div className="relative mx-auto max-w-7xl px-5 md:px-6">
            <FadeInWhenVisible className="mx-auto mb-14 max-w-2xl text-center md:mb-20">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-purple-400">
                <Zap className="h-3.5 w-3.5" />
                How It Works
              </div>
              <h2 className="mb-5 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                From Zero to{" "}
                <span className="neon-text-gradient">Dream CV</span> in 3 Steps
              </h2>
              <p className="text-base text-content-2 md:text-lg">
                No more staring at blank pages. Let AI do the heavy lifting.
              </p>
            </FadeInWhenVisible>

            <div className="grid gap-6 md:grid-cols-3 md:gap-8">
              {[
                {
                  step: "01",
                  title: "Tell Us About You",
                  desc: "Describe your experience, skills, and career goals in plain language — or paste your LinkedIn profile.",
                  gradient: "from-indigo-600 to-indigo-400",
                },
                {
                  step: "02",
                  title: "AI Crafts Your CV",
                  desc: "GPT-5 generates optimized content, suggests improvements, and creates a beautifully designed resume.",
                  gradient: "from-purple-600 to-purple-400",
                },
                {
                  step: "03",
                  title: "Share & Download",
                  desc: "Get your shareable link instantly, download as PDF, or continue refining with the AI chat assistant.",
                  gradient: "from-pink-600 to-pink-400",
                },
              ].map((item, i) => (
                <FadeInWhenVisible key={item.step} delay={i * 0.15}>
                  <motion.div
                    whileHover={{ y: -6 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                    }}
                    className="group relative rounded-2xl border border-edge bg-[#0c0c24]/60 p-8 backdrop-blur-sm transition-all hover:border-indigo-500/20 md:rounded-3xl md:p-10"
                  >
                    <div
                      className={`mb-6 inline-flex bg-gradient-to-r ${item.gradient} bg-clip-text text-5xl font-black text-transparent`}
                    >
                      {item.step}
                    </div>
                    <h3 className="mb-3 text-xl font-semibold text-content">
                      {item.title}
                    </h3>
                    <p className="leading-relaxed text-content-2">
                      {item.desc}
                    </p>
                  </motion.div>
                </FadeInWhenVisible>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ Live CV & Projects Showcase ═══ */}
        <section
          id="live-cv"
          className="relative py-20 md:py-32 overflow-hidden"
        >
          <NeonGlow
            color="purple"
            className="h-[600px] w-[800px] -top-40 left-1/2 -translate-x-1/2"
          />

          <div className="relative mx-auto max-w-7xl px-5 md:px-6">
            <FadeInWhenVisible className="mx-auto mb-14 max-w-2xl text-center md:mb-20">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-cyan-400">
                <Globe className="h-3.5 w-3.5" />
                Your Online Presence
              </div>
              <h2 className="mb-5 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                A Live CV Webpage &{" "}
                <span className="neon-text-gradient">Project Portfolio</span>
              </h2>
              <p className="text-base text-content-2 md:text-lg">
                Get your own professional URL and showcase your best projects —
                all in one beautiful, shareable page.
              </p>
            </FadeInWhenVisible>

            <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
              {/* Live CV Card */}
              <FadeInWhenVisible delay={0.1} direction="left">
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}
                  className="group relative rounded-2xl border border-edge bg-[#0c0c24]/60 p-1 backdrop-blur-sm transition-all hover:border-indigo-500/30 md:rounded-3xl"
                >
                  <div className="rounded-t-[18px] border-b border-edge bg-black/30 px-4 py-3 md:rounded-t-[20px]">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
                        <div className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
                      </div>
                      <div className="mx-auto flex items-center gap-2 rounded-lg bg-black/40 px-4 py-1.5 text-xs text-content-3 ring-1 ring-white/5">
                        <Globe className="h-3 w-3 text-emerald-400" />
                        <span>
                          gocv.live/
                          <span className="font-semibold text-indigo-400">
                            your-name
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 sm:p-8">
                    <div className="mb-6 flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-lg font-bold text-white shadow-lg shadow-indigo-600/30">
                        JD
                      </div>
                      <div>
                        <div className="h-4 w-32 rounded bg-content/20 mb-2" />
                        <div className="h-3 w-48 rounded bg-content/10" />
                      </div>
                    </div>
                    <div className="space-y-2 mb-5">
                      <div className="h-2.5 w-full rounded bg-content/8" />
                      <div className="h-2.5 w-5/6 rounded bg-content/8" />
                      <div className="h-2.5 w-4/6 rounded bg-content/8" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {["React", "Node.js", "TypeScript", "AWS"].map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-400 ring-1 ring-indigo-500/20"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="px-5 pb-6 sm:px-8 sm:pb-8">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 ring-1 ring-indigo-500/20 shadow-lg shadow-indigo-500/10">
                        <Link2 className="h-5 w-5 text-indigo-400" />
                      </div>
                      <h3 className="text-lg font-bold text-content md:text-xl">
                        Your Own Live URL
                      </h3>
                    </div>
                    <p className="mb-4 text-sm leading-relaxed text-content-2">
                      Every CV gets a personal{" "}
                      <span className="font-semibold text-indigo-400">
                        gocv.live/your-name
                      </span>{" "}
                      page with a stunning neon-themed design, interactive 3D
                      background, and mobile-responsive layout.
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs text-content-3">
                      <span className="flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5 text-emerald-400" />
                        Public & shareable
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Download className="h-3.5 w-3.5 text-purple-400" />
                        PDF included
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Shield className="h-3.5 w-3.5 text-cyan-400" />
                        ATS-optimized
                      </span>
                    </div>
                  </div>
                </motion.div>
              </FadeInWhenVisible>

              {/* Projects Portfolio Card */}
              <FadeInWhenVisible delay={0.2} direction="right">
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}
                  className="group relative rounded-2xl border border-edge bg-[#0c0c24]/60 p-1 backdrop-blur-sm transition-all hover:border-purple-500/30 md:rounded-3xl"
                >
                  <div className="rounded-t-[18px] border-b border-edge bg-black/30 px-5 py-3 flex items-center justify-between md:rounded-t-[20px] md:px-6 md:py-4">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-purple-400" />
                      <span className="text-sm font-semibold text-content">
                        Project Portfolio
                      </span>
                    </div>
                    <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-400 ring-1 ring-purple-500/20">
                      4 Projects
                    </span>
                  </div>
                  <div className="p-4 grid gap-3 grid-cols-2 sm:p-6 sm:gap-4">
                    {[
                      {
                        name: "E-Commerce App",
                        tech: "Next.js · Stripe",
                        color: "indigo",
                        featured: true,
                      },
                      {
                        name: "AI Chat Bot",
                        tech: "Python · GPT-5",
                        color: "purple",
                        featured: false,
                      },
                      {
                        name: "Analytics Dash",
                        tech: "React · D3.js",
                        color: "emerald",
                        featured: false,
                      },
                      {
                        name: "Mobile Fitness",
                        tech: "React Native",
                        color: "pink",
                        featured: true,
                      },
                    ].map((proj) => {
                      const cardColors: Record<string, string> = {
                        indigo:
                          "from-indigo-500/15 to-indigo-600/5 border-indigo-500/15",
                        purple:
                          "from-purple-500/15 to-purple-600/5 border-purple-500/15",
                        emerald:
                          "from-emerald-500/15 to-emerald-600/5 border-emerald-500/15",
                        pink: "from-pink-500/15 to-pink-600/5 border-pink-500/15",
                      };
                      return (
                        <div
                          key={proj.name}
                          className={`rounded-xl border bg-gradient-to-b p-3 transition-all md:rounded-2xl md:p-4 ${cardColors[proj.color]}`}
                        >
                          <div className="mb-3 flex h-12 items-center justify-center rounded-xl bg-black/30 md:h-16">
                            <Code2 className="h-5 w-5 text-content-4 md:h-6 md:w-6" />
                          </div>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-semibold text-content truncate sm:text-sm">
                              {proj.name}
                            </p>
                            {proj.featured && (
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-content-3 sm:text-xs">
                            {proj.tech}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="px-5 pb-6 sm:px-8 sm:pb-8">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 ring-1 ring-purple-500/20 shadow-lg shadow-purple-500/10">
                        <FolderOpen className="h-5 w-5 text-purple-400" />
                      </div>
                      <h3 className="text-lg font-bold text-content md:text-xl">
                        Showcase Your Projects
                      </h3>
                    </div>
                    <p className="mb-4 text-sm leading-relaxed text-content-2">
                      Add unlimited projects with images, tech stacks, live
                      demos & source links. Toggle visibility —{" "}
                      <span className="font-semibold text-purple-400">
                        you control what employers see
                      </span>
                      .
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs text-content-3">
                      <span className="flex items-center gap-1.5">
                        <Wand2 className="h-3.5 w-3.5 text-purple-400" />
                        AI descriptions
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Image className="h-3.5 w-3.5 text-pink-400" />
                        Image galleries
                      </span>
                      <span className="flex items-center gap-1.5">
                        <ExternalLink className="h-3.5 w-3.5 text-indigo-400" />
                        Live demos
                      </span>
                    </div>
                  </div>
                </motion.div>
              </FadeInWhenVisible>
            </div>

            {/* Feature pills */}
            <FadeInWhenVisible delay={0.3} className="mt-10 md:mt-14">
              <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
                {[
                  {
                    icon: Globe,
                    text: "Custom gocv.live URL",
                    color: "text-cyan-400 bg-cyan-500/10 ring-cyan-500/20",
                  },
                  {
                    icon: FolderOpen,
                    text: "Unlimited projects",
                    color:
                      "text-purple-400 bg-purple-500/10 ring-purple-500/20",
                  },
                  {
                    icon: Eye,
                    text: "Visibility controls",
                    color:
                      "text-emerald-400 bg-emerald-500/10 ring-emerald-500/20",
                  },
                  {
                    icon: Wand2,
                    text: "AI descriptions",
                    color: "text-pink-400 bg-pink-500/10 ring-pink-500/20",
                  },
                  {
                    icon: Cpu,
                    text: "3D interactive page",
                    color: "text-amber-400 bg-amber-500/10 ring-amber-500/20",
                  },
                  {
                    icon: Download,
                    text: "PDF export",
                    color: "text-sky-400 bg-sky-500/10 ring-sky-500/20",
                  },
                ].map((pill) => (
                  <div
                    key={pill.text}
                    className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-medium ring-1 md:px-4 md:py-2 md:text-xs ${pill.color}`}
                  >
                    <pill.icon className="h-3 w-3 md:h-3.5 md:w-3.5" />
                    {pill.text}
                  </div>
                ))}
              </div>
            </FadeInWhenVisible>

            {/* CTA */}
            <FadeInWhenVisible
              delay={0.4}
              className="mt-10 text-center md:mt-12"
            >
              <motion.button
                onClick={() => setShowLogin(true)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="group inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-indigo-600/20 transition-all hover:shadow-indigo-500/30 neon-btn-glow md:px-8 md:py-4"
              >
                <Sparkles className="h-5 w-5" />
                Create Your Live CV & Portfolio
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </motion.button>
            </FadeInWhenVisible>
          </div>
        </section>

        {/* ═══ Stats ═══ */}
        <ParallaxSection speed={0.15}>
          <section className="border-y border-edge/50 bg-surface/60 backdrop-blur-md py-14 md:py-20">
            <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-5 md:grid-cols-4 md:gap-8 md:px-6">
              {[
                { value: "50K+", label: "CVs Created", icon: FileText },
                { value: "2.5K+", label: "Active Users", icon: Users },
                { value: "95%", label: "Success Rate", icon: TrendingUp },
                { value: "4.9★", label: "User Rating", icon: Star },
              ].map((stat, i) => (
                <FadeInWhenVisible key={stat.label} delay={i * 0.1}>
                  <div className="text-center">
                    <div className="mb-2 flex items-center justify-center">
                      <stat.icon className="mr-2 h-4 w-4 text-indigo-400 md:h-5 md:w-5" />
                      <span className="text-2xl font-bold neon-text-gradient sm:text-3xl md:text-4xl">
                        {stat.value}
                      </span>
                    </div>
                    <p className="text-xs text-content-3 md:text-sm">
                      {stat.label}
                    </p>
                  </div>
                </FadeInWhenVisible>
              ))}
            </div>
          </section>
        </ParallaxSection>

        {/* ═══ Testimonials ═══ */}
        <section
          id="testimonials"
          className="relative py-20 md:py-32 overflow-hidden"
        >
          <NeonGlow
            color="pink"
            className="h-[400px] w-[400px] top-20 -left-40"
          />

          <div className="relative mx-auto max-w-7xl px-5 md:px-6">
            <FadeInWhenVisible className="mx-auto mb-14 max-w-2xl text-center md:mb-20">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-amber-400">
                <Star className="h-3.5 w-3.5" />
                Testimonials
              </div>
              <h2 className="mb-5 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Loved by{" "}
                <span className="neon-text-gradient">Professionals</span>
              </h2>
              <p className="text-base text-content-2 md:text-lg">
                Hear from people who landed their dream jobs with GoCV.
              </p>
            </FadeInWhenVisible>

            <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
              {[
                {
                  name: "Sarah Chen",
                  role: "Software Engineer at Google",
                  text: "GoCV completely transformed my job search. The AI understood exactly what tech recruiters look for and crafted content that got me interviews at FAANG companies.",
                },
                {
                  name: "Marcus Williams",
                  role: "Product Manager at Stripe",
                  text: "I went from an outdated resume to a stunning, ATS-optimized CV in under 10 minutes. The shareable link feature is brilliant — I put it right in my LinkedIn bio.",
                },
                {
                  name: "Elena Rodriguez",
                  role: "UX Designer at Figma",
                  text: "As a designer, I'm picky about aesthetics. GoCV's templates are genuinely beautiful, and the AI chat helped me articulate my design process perfectly.",
                },
              ].map((t, i) => (
                <FadeInWhenVisible key={t.name} delay={i * 0.1}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                    }}
                    className="rounded-2xl border border-edge bg-[#0c0c24]/60 p-6 backdrop-blur-sm transition-all hover:border-amber-500/20 md:rounded-3xl md:p-8"
                  >
                    <div className="mb-4 flex gap-1">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star
                          key={j}
                          className="h-4 w-4 fill-amber-400 text-amber-400"
                        />
                      ))}
                    </div>
                    <p className="mb-6 text-sm leading-relaxed text-content-2 md:text-base">
                      &ldquo;{t.text}&rdquo;
                    </p>
                    <div>
                      <p className="font-semibold text-content">{t.name}</p>
                      <p className="text-xs text-content-3 md:text-sm">
                        {t.role}
                      </p>
                    </div>
                  </motion.div>
                </FadeInWhenVisible>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ Pricing ═══ */}
        <section
          id="pricing"
          className="relative py-20 md:py-32 overflow-hidden"
        >
          <NeonGlow
            color="emerald"
            className="h-[500px] w-[500px] top-1/3 left-1/2 -translate-x-1/2"
          />

          <div className="relative mx-auto max-w-7xl px-5 md:px-6">
            <FadeInWhenVisible className="mx-auto mb-14 max-w-2xl text-center md:mb-20">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                <Zap className="h-3.5 w-3.5" />
                Pricing
              </div>
              <h2 className="mb-5 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Start <span className="neon-text-gradient">Free</span>, Scale
                When Ready
              </h2>
              <p className="text-base text-content-2 md:text-lg">
                No credit card required. Upgrade only when you need more.
              </p>
            </FadeInWhenVisible>

            <div className="mx-auto grid max-w-5xl gap-4 sm:gap-6 md:grid-cols-3 md:gap-8">
              {/* Free */}
              <FadeInWhenVisible delay={0}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}
                  className="rounded-2xl border border-edge bg-[#0c0c24]/60 p-6 backdrop-blur-sm transition-all hover:border-edge md:rounded-3xl md:p-8"
                >
                  <h3 className="mb-2 text-lg font-semibold text-content">
                    Free
                  </h3>
                  <p className="mb-6 text-sm text-content-3">
                    Perfect for getting started
                  </p>
                  <div className="mb-8">
                    <span className="text-4xl font-bold text-content">$0</span>
                    <span className="text-content-3">/month</span>
                  </div>
                  <ul className="mb-8 space-y-3">
                    {[
                      "1 AI-generated CV",
                      "Basic templates",
                      "Shareable link",
                      "PDF download",
                    ].map((f) => (
                      <li
                        key={f}
                        className="flex items-center gap-3 text-sm text-content-2"
                      >
                        <Check className="h-4 w-4 flex-shrink-0 text-emerald-400" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => setShowLogin(true)}
                    className="block w-full rounded-xl border border-edge bg-white/5 py-3 text-center text-sm font-semibold text-content transition hover:bg-white/10"
                  >
                    Get Started
                  </button>
                </motion.div>
              </FadeInWhenVisible>

              {/* Pro */}
              <FadeInWhenVisible delay={0.1}>
                <motion.div
                  whileHover={{ y: -6 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}
                  className="relative rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-indigo-500/10 to-[#0c0c24]/80 p-6 shadow-lg shadow-indigo-600/10 backdrop-blur-sm md:rounded-3xl md:p-8"
                >
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-indigo-600/30">
                    Popular
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-content">
                    Pro
                  </h3>
                  <p className="mb-6 text-sm text-content-3">
                    For serious job seekers
                  </p>
                  <div className="mb-8">
                    <span className="text-4xl font-bold text-content">$9</span>
                    <span className="text-content-3">/month</span>
                  </div>
                  <ul className="mb-8 space-y-3">
                    {[
                      "Unlimited CVs",
                      "Premium templates",
                      "AI chat assistant",
                      "Custom domains",
                      "Priority support",
                      "Analytics dashboard",
                    ].map((f) => (
                      <li
                        key={f}
                        className="flex items-center gap-3 text-sm text-content-2"
                      >
                        <Check className="h-4 w-4 flex-shrink-0 text-indigo-400" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => setShowLogin(true)}
                    className="block w-full rounded-xl bg-indigo-600 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500 neon-btn-glow"
                  >
                    Start Free Trial
                  </button>
                </motion.div>
              </FadeInWhenVisible>

              {/* Enterprise */}
              <FadeInWhenVisible delay={0.2}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}
                  className="rounded-2xl border border-edge bg-[#0c0c24]/60 p-6 backdrop-blur-sm transition-all hover:border-edge md:rounded-3xl md:p-8"
                >
                  <h3 className="mb-2 text-lg font-semibold text-content">
                    Enterprise
                  </h3>
                  <p className="mb-6 text-sm text-content-3">
                    For teams & organizations
                  </p>
                  <div className="mb-8">
                    <span className="text-4xl font-bold text-content">
                      Custom
                    </span>
                  </div>
                  <ul className="mb-8 space-y-3">
                    {[
                      "Everything in Pro",
                      "Team management",
                      "SSO & SAML",
                      "Custom branding",
                      "API access",
                      "Dedicated support",
                    ].map((f) => (
                      <li
                        key={f}
                        className="flex items-center gap-3 text-sm text-content-2"
                      >
                        <Check className="h-4 w-4 flex-shrink-0 text-purple-400" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => setShowLogin(true)}
                    className="block w-full rounded-xl border border-edge bg-white/5 py-3 text-center text-sm font-semibold text-content transition hover:bg-white/10"
                  >
                    Contact Sales
                  </button>
                </motion.div>
              </FadeInWhenVisible>
            </div>
          </div>
        </section>

        {/* ═══ About Creator ═══ */}
        {creatorInfo && (
          <section
            id="creator"
            className="relative py-20 md:py-32 overflow-hidden"
          >
            <NeonGlow
              color="pink"
              className="h-[400px] w-[400px] top-1/2 -translate-y-1/2 -right-40"
            />

            <div className="relative mx-auto max-w-4xl px-5 md:px-6">
              <FadeInWhenVisible className="mx-auto mb-12 max-w-2xl text-center md:mb-16">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-pink-500/20 bg-pink-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-pink-400">
                  <Star className="h-3.5 w-3.5" />
                  Meet the Creator
                </div>
                <h2 className="mb-5 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                  Built by a{" "}
                  <span className="neon-text-gradient">Developer</span>, for
                  Developers
                </h2>
              </FadeInWhenVisible>

              <FadeInWhenVisible>
                <div className="rounded-2xl border border-edge bg-[#0c0c24]/60 p-6 backdrop-blur-sm sm:p-8 md:rounded-3xl md:p-10">
                  <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
                    <div className="flex-shrink-0">
                      {creatorInfo.avatar ? (
                        <img
                          src={creatorInfo.avatar}
                          alt={creatorInfo.name}
                          className="h-24 w-24 rounded-2xl object-cover ring-2 ring-edge shadow-lg md:h-28 md:w-28 md:rounded-3xl"
                        />
                      ) : (
                        <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-2xl font-bold text-white shadow-lg md:h-28 md:w-28 md:rounded-3xl md:text-3xl">
                          {creatorInfo.name
                            ?.split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="text-xl font-bold text-content md:text-2xl">
                        {creatorInfo.name}
                      </h3>
                      {creatorInfo.title && (
                        <p className="mt-1 text-sm font-medium text-indigo-400">
                          {creatorInfo.title}
                        </p>
                      )}
                      {creatorInfo.location && (
                        <p className="mt-1 text-sm text-content-3">
                          📍 {creatorInfo.location}
                        </p>
                      )}
                      {creatorInfo.bio && (
                        <p className="mt-4 text-sm leading-relaxed text-content-2 md:text-base">
                          {creatorInfo.bio}
                        </p>
                      )}
                      {creatorInfo.skills?.length > 0 && (
                        <div className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">
                          {creatorInfo.skills.map(
                            (skill: string, i: number) => (
                              <span
                                key={i}
                                className="rounded-lg bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-400 ring-1 ring-indigo-500/20"
                              >
                                {skill}
                              </span>
                            ),
                          )}
                        </div>
                      )}
                      <div className="mt-6 flex flex-wrap justify-center gap-2 sm:justify-start sm:gap-3">
                        {creatorInfo.email && (
                          <a
                            href={`mailto:${creatorInfo.email}`}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-edge bg-white/5 px-3 py-2 text-sm font-medium text-content-2 transition hover:bg-white/10 md:px-4"
                          >
                            ✉️ Email
                          </a>
                        )}
                        {creatorInfo.linkedin && (
                          <a
                            href={creatorInfo.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-edge bg-white/5 px-3 py-2 text-sm font-medium text-content-2 transition hover:bg-white/10 md:px-4"
                          >
                            💼 LinkedIn
                          </a>
                        )}
                        {creatorInfo.github && (
                          <a
                            href={creatorInfo.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-edge bg-white/5 px-3 py-2 text-sm font-medium text-content-2 transition hover:bg-white/10 md:px-4"
                          >
                            🐙 GitHub
                          </a>
                        )}
                        {creatorInfo.website && (
                          <a
                            href={creatorInfo.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-edge bg-white/5 px-3 py-2 text-sm font-medium text-content-2 transition hover:bg-white/10 md:px-4"
                          >
                            🌐 Website
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </FadeInWhenVisible>
            </div>
          </section>
        )}

        {/* ═══ Final CTA ═══ */}
        <section className="py-20 md:py-32">
          <div className="mx-auto max-w-4xl px-5 text-center md:px-6">
            <FadeInWhenVisible>
              <div className="relative rounded-[2rem] border border-indigo-500/20 bg-gradient-to-b from-indigo-600/10 to-purple-600/5 px-6 py-16 overflow-hidden sm:px-12 md:px-16 md:py-20">
                <NeonGlow
                  color="indigo"
                  className="h-[400px] w-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                />
                <div className="relative">
                  <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                    Ready to Build Your{" "}
                    <span className="neon-text-gradient">Perfect CV</span>?
                  </h2>
                  <p className="mx-auto mb-8 max-w-xl text-base text-content-2 md:mb-10 md:text-lg">
                    Join thousands of professionals who&apos;ve already landed
                    their dream jobs. Start free — no credit card required.
                  </p>
                  <motion.button
                    onClick={() => setShowLogin(true)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className="group inline-flex h-12 items-center gap-3 rounded-2xl bg-indigo-600 px-8 text-base font-semibold text-white shadow-xl shadow-indigo-600/25 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/30 neon-btn-glow md:h-14 md:px-10"
                  >
                    <Sparkles className="h-5 w-5" />
                    Get Started for Free
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </motion.button>
                </div>
              </div>
            </FadeInWhenVisible>
          </div>
        </section>
      </main>

      {/* ═══ Footer ═══ */}
      <footer className="border-t border-edge/50 bg-[#060614]/80 backdrop-blur-md py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-5 md:px-6">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4 md:gap-12">
            <div className="sm:col-span-2 md:col-span-1">
              <Link href="/" className="mb-4 flex items-center gap-2.5">
                <NextImage
                  src="/gocv_logo.png"
                  alt="GoCV"
                  width={120}
                  height={36}
                  className="h-8 w-auto object-contain md:h-10"
                />
              </Link>
              <p className="mt-4 text-sm leading-relaxed text-content-3">
                AI-powered resume builder that helps professionals stand out and
                land their dream jobs.
              </p>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-content-2 md:mb-4">
                Product
              </h4>
              <ul className="space-y-2 md:space-y-3">
                {[
                  { label: "Features", href: "#features" },
                  { label: "Pricing", href: "#pricing" },
                  { label: "Templates", href: "#" },
                  { label: "AI Assistant", href: "#" },
                ].map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-sm text-content-3 transition hover:text-content"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-content-2 md:mb-4">
                Company
              </h4>
              <ul className="space-y-2 md:space-y-3">
                {[
                  { label: "About", href: "#" },
                  { label: "Blog", href: "#" },
                  { label: "Careers", href: "#" },
                  { label: "Contact", href: "#" },
                ].map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-sm text-content-3 transition hover:text-content"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-content-2 md:mb-4">
                Legal
              </h4>
              <ul className="space-y-2 md:space-y-3">
                <li>
                  <Link
                    href="/privacy-policy"
                    className="text-sm text-content-3 transition hover:text-content"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms-of-service"
                    className="text-sm text-content-3 transition hover:text-content"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-edge/50 pt-6 text-sm text-content-4 sm:flex-row md:mt-12 md:pt-8">
            <span>© {new Date().getFullYear()} GoCV. All rights reserved.</span>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
              All systems operational
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
