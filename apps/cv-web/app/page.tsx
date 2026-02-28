"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
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
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

import { siteSettingsApi } from "@/lib/api";

const ThreeBackground = dynamic(() => import("@/components/three-background"), {
  ssr: false,
});

export default function Home() {
  const [showLogin, setShowLogin] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [wizardMode, setWizardMode] = useState<"generate" | "polish">(
    "generate",
  );
  const [inputText, setInputText] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [creatorInfo, setCreatorInfo] = useState<any>(null);

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
          const y = window.scrollY;
          setScrolled(y > 20);
          setScrollY(y);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Section reveal on scroll
  useEffect(() => {
    const els = document.querySelectorAll(".section-reveal");
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        }),
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [creatorInfo]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowLogin(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="relative z-10 min-h-screen overflow-x-hidden text-content">
      <ThreeBackground />

      {/* ──── Login Modal ──── */}
      {showLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowLogin(false)}
          />
          <div className="relative w-full max-w-md mx-4 animate-fade-up">
            <div className="rounded-3xl border border-edge bg-popover p-8 shadow-2xl shadow-black/20 backdrop-blur-xl">
              <button
                onClick={() => setShowLogin(false)}
                className="absolute right-4 top-4 rounded-xl p-2 text-content-3 transition hover:bg-card-hover hover:text-content"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/20 ring-1 ring-indigo-500/30">
                  <FileText className="h-6 w-6 text-indigo-400" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-content">
                  Welcome to Go<span className="text-gradient">CV</span>
                </h2>
                <p className="mt-2 text-sm text-content-2">
                  Sign in to create your professional CV
                </p>
              </div>

              <button
                onClick={handleGoogleLogin}
                className="group flex w-full items-center justify-center gap-3 rounded-2xl border border-edge bg-card px-6 py-3.5 text-base font-medium text-content transition-all hover:border-edge hover:bg-card-hover"
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
                <ArrowRight className="h-4 w-4 text-content-3 transition-transform group-hover:translate-x-0.5 group-hover:text-content" />
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
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-edge bg-card px-4 py-3 text-sm font-medium text-content transition-all hover:bg-card-hover"
                >
                  Sign In with Email
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setShowLogin(false)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-500"
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
          </div>
        </div>
      )}

      {/* ──── Navbar ──── */}
      <header
        className={`fixed top-0 z-50 w-full transition-all duration-500 ${
          scrolled ? "bg-page/80 backdrop-blur-xl" : ""
        }`}
      >
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/20 ring-1 ring-indigo-500/30 transition group-hover:ring-indigo-400/50">
              <FileText className="h-4.5 w-4.5 text-indigo-400" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Go<span className="text-gradient">CV</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-sm font-medium text-content-2 transition hover:text-content"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-content-2 transition hover:text-content"
            >
              How It Works
            </a>
            <a
              href="#testimonials"
              className="text-sm font-medium text-content-2 transition hover:text-content"
            >
              Testimonials
            </a>
            <a
              href="#pricing"
              className="text-sm font-medium text-content-2 transition hover:text-content"
            >
              Pricing
            </a>
            {creatorInfo && (
              <a
                href="#creator"
                className="text-sm font-medium text-content-2 transition hover:text-content"
              >
                Creator
              </a>
            )}
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowLogin(true)}
              className="hidden rounded-xl px-5 py-2.5 text-sm font-medium text-content-2 transition hover:text-content sm:inline-flex"
            >
              Sign In
            </button>
            <button
              onClick={() => setShowLogin(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 hover:shadow-indigo-500/30"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* ──── Hero ──── */}
        <section className="relative flex min-h-screen items-center justify-center px-6 pt-20 overflow-hidden">
          {/* Radial overlay for text readability */}
          <div className="hero-overlay pointer-events-none absolute inset-0 z-[1]" />

          {/* Radial glow behind hero */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2"
            style={{
              transform: `translate(-50%, calc(-50% + ${scrollY * 0.4}px))`,
              willChange: "transform",
            }}
          >
            <div className="h-[600px] w-[600px] rounded-full bg-indigo-600/8 blur-[120px]" />
          </div>

          <div
            className="relative z-[2] mx-auto max-w-5xl text-center"
            style={{
              transform: `translateY(${scrollY * 0.12}px)`,
              willChange: "transform",
            }}
          >
            {/* Badge */}
            <div className="animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/25 bg-indigo-500/15 px-4 py-2 text-xs font-semibold text-indigo-300 sm:mb-8 sm:px-5 sm:text-sm">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">
                Powered by GPT-5 Artificial Intelligence
              </span>
              <span className="sm:hidden">Powered by AI</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </div>

            {/* Headline */}
            <h1 className="animate-fade-up delay-100 mb-6 text-4xl font-extrabold leading-[1.08] tracking-tight text-content sm:text-5xl lg:text-6xl">
              Your Career,{" "}
              <span className="text-gradient">Beautifully Crafted</span>
              <br />
              by AI
            </h1>

            {/* Subheading */}
            <p className="animate-fade-up delay-200 mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-content sm:text-xl">
              Describe yourself or upload an existing CV — our AI crafts a
              stunning, ATS-optimized resume in minutes.
            </p>

            {/* Smart Input */}
            <div className="animate-fade-up delay-300 mx-auto max-w-2xl text-left">
              <div className="relative rounded-[28px] border border-edge bg-elevated/90 p-3 shadow-2xl shadow-black/10 backdrop-blur-2xl sm:p-4 ring-1 ring-white/5">
                {/* Subtle glow behind the card */}
                <div className="pointer-events-none absolute -inset-px rounded-[28px] bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent" />

                {/* Top-Level Mode Router */}
                <div className="relative mb-3 flex gap-1.5 rounded-2xl bg-card p-1 sm:gap-2 sm:p-1.5">
                  <button
                    onClick={() => setWizardMode("generate")}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-all sm:px-5 sm:py-3.5 sm:text-base ${
                      wizardMode === "generate"
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30"
                        : "text-content-3 hover:text-content hover:bg-card-hover"
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
                        ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30"
                        : "text-content-3 hover:text-content hover:bg-card-hover"
                    }`}
                  >
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="hidden sm:inline">Polish my CV</span>
                    <span className="sm:hidden">Polish CV</span>
                  </button>
                </div>

                {/* Input Area */}
                <div className="relative px-1 pb-1 sm:px-2 sm:pb-2">
                  {wizardMode === "generate" && (
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="I'm a senior software engineer with 5 years of experience in React, Node.js, and cloud technologies. I've led teams of 8+ engineers and shipped products used by millions..."
                      rows={4}
                      className="w-full resize-none rounded-2xl border border-edge bg-field/80 p-4 text-[15px] leading-relaxed text-content placeholder:text-content-4 focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition sm:text-base"
                    />
                  )}

                  {wizardMode === "polish" && (
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
                            : "border-edge bg-field/80 hover:border-indigo-500/30 hover:bg-indigo-500/5"
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
                  )}

                  <button
                    onClick={handleSmartSubmit}
                    disabled={
                      wizardMode === "polish"
                        ? !uploadedFile
                        : !inputText.trim()
                    }
                    className={`mt-3 group flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-[15px] font-bold text-white shadow-xl transition-all hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 sm:py-4.5 sm:text-base ${
                      wizardMode === "polish"
                        ? "bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-600/25 hover:shadow-emerald-500/35"
                        : "bg-gradient-to-r from-indigo-600 to-indigo-500 shadow-indigo-600/30 hover:from-indigo-500 hover:to-indigo-400 hover:shadow-indigo-500/35"
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
                  </button>
                </div>
              </div>
            </div>

            {/* Social proof */}
            <div className="animate-fade-up delay-500 mt-12 flex flex-col items-center gap-5 sm:mt-16 sm:flex-row sm:justify-center sm:gap-8">
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
                    className={`h-9 w-9 rounded-full ${bg} ring-2 ring-page flex items-center justify-center text-xs font-bold text-white sm:h-10 sm:w-10`}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <div className="text-sm text-content-2 sm:text-base">
                <span className="font-bold text-content">2,500+</span>{" "}
                professionals already building with GoCV
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
            </div>
          </div>
        </section>

        {/* ──── Logos / Trust Bar ──── */}
        <section className="section-reveal border-y border-edge bg-surface/80 backdrop-blur-md py-12">
          <div className="mx-auto max-w-7xl px-6">
            <p className="mb-8 text-center text-sm font-medium uppercase tracking-widest text-content-4">
              Trusted by professionals at
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-40">
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
                  className="text-xl font-bold tracking-tight text-content-2"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ──── Features Grid ──── */}
        <section
          id="features"
          className="section-reveal py-32 bg-page/80 backdrop-blur-sm"
        >
          <div className="mx-auto max-w-7xl px-6">
            <div className="mx-auto mb-20 max-w-2xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-400">
                <Layers className="h-3.5 w-3.5" />
                Features
              </div>
              <h2 className="mb-5 text-4xl font-bold tracking-tight sm:text-5xl">
                Everything You Need to{" "}
                <span className="text-gradient">Stand Out</span>
              </h2>
              <p className="text-lg text-content-2">
                From AI-powered content generation to stunning designs,
                we&apos;ve built every tool you need to create the perfect
                resume.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                  color: "sky",
                  title: "ATS-Optimized",
                  desc: "Every CV is built with Applicant Tracking Systems in mind, ensuring your resume passes automated screening.",
                },
              ].map((feat) => {
                const colorMap: Record<string, string> = {
                  indigo:
                    "from-indigo-500/20 to-indigo-600/5 text-indigo-400 border-indigo-500/10",
                  purple:
                    "from-purple-500/20 to-purple-600/5 text-purple-400 border-purple-500/10",
                  pink: "from-pink-500/20 to-pink-600/5 text-pink-400 border-pink-500/10",
                  amber:
                    "from-amber-500/20 to-amber-600/5 text-amber-400 border-amber-500/10",
                  emerald:
                    "from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/10",
                  sky: "from-sky-500/20 to-sky-600/5 text-sky-400 border-sky-500/10",
                };
                const cls = colorMap[feat.color] ?? "";
                const iconColorMap: Record<string, string> = {
                  indigo: "bg-indigo-500/10 text-indigo-400 ring-indigo-500/20",
                  purple: "bg-purple-500/10 text-purple-400 ring-purple-500/20",
                  pink: "bg-pink-500/10 text-pink-400 ring-pink-500/20",
                  amber: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
                  emerald:
                    "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
                  sky: "bg-sky-500/10 text-sky-400 ring-sky-500/20",
                };
                const iconCls = iconColorMap[feat.color] ?? "";

                return (
                  <div
                    key={feat.title}
                    className={`group relative rounded-3xl border bg-gradient-to-b p-8 transition-all hover:scale-[1.02] hover:shadow-lg ${cls}`}
                  >
                    <div
                      className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ${iconCls}`}
                    >
                      <feat.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-content">
                      {feat.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-content-2">
                      {feat.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ──── How It Works ──── */}
        <section
          id="how-it-works"
          className="section-reveal relative py-32 bg-page/70 backdrop-blur-sm"
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-indigo-600/[0.03] to-transparent" />
          <div className="relative mx-auto max-w-7xl px-6">
            <div className="mx-auto mb-20 max-w-2xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-purple-400">
                <Zap className="h-3.5 w-3.5" />
                How It Works
              </div>
              <h2 className="mb-5 text-4xl font-bold tracking-tight sm:text-5xl">
                From Zero to <span className="text-gradient">Dream CV</span> in
                3 Steps
              </h2>
              <p className="text-lg text-content-2">
                No more staring at blank pages. Let AI do the heavy lifting
                while you focus on what matters.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
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
              ].map((item) => (
                <div
                  key={item.step}
                  className="group relative rounded-3xl border border-edge bg-card p-10 transition-all hover:border-edge hover:bg-card-hover"
                >
                  <div
                    className={`mb-6 inline-flex bg-gradient-to-r ${item.gradient} bg-clip-text text-5xl font-black text-transparent`}
                  >
                    {item.step}
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-content">
                    {item.title}
                  </h3>
                  <p className="leading-relaxed text-content-2">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ──── Stats ──── */}
        <section className="section-reveal border-y border-edge bg-surface/80 backdrop-blur-md py-20">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 md:grid-cols-4">
            {[
              { value: "50K+", label: "CVs Created", icon: FileText },
              { value: "2.5K+", label: "Active Users", icon: Users },
              { value: "95%", label: "Success Rate", icon: TrendingUp },
              { value: "4.9★", label: "User Rating", icon: Star },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="mb-2 flex items-center justify-center">
                  <stat.icon className="mr-2 h-5 w-5 text-indigo-400" />
                  <span className="text-3xl font-bold text-gradient sm:text-4xl">
                    {stat.value}
                  </span>
                </div>
                <p className="text-sm text-content-3">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ──── Testimonials ──── */}
        <section
          id="testimonials"
          className="section-reveal py-32 bg-page/80 backdrop-blur-sm"
        >
          <div className="mx-auto max-w-7xl px-6">
            <div className="mx-auto mb-20 max-w-2xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-amber-400">
                <Star className="h-3.5 w-3.5" />
                Testimonials
              </div>
              <h2 className="mb-5 text-4xl font-bold tracking-tight sm:text-5xl">
                Loved by <span className="text-gradient">Professionals</span>
              </h2>
              <p className="text-lg text-content-2">
                Don&apos;t take our word for it — hear from people who landed
                their dream jobs with GoCV.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
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
              ].map((t) => (
                <div
                  key={t.name}
                  className="rounded-3xl border border-edge bg-card p-8 transition-all hover:border-edge"
                >
                  <div className="mb-4 flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                  <p className="mb-6 leading-relaxed text-content-2">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div>
                    <p className="font-semibold text-content">{t.name}</p>
                    <p className="text-sm text-content-3">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ──── Pricing ──── */}
        <section
          id="pricing"
          className="section-reveal relative py-32 bg-page/70 backdrop-blur-sm"
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-purple-600/[0.03] to-transparent" />
          <div className="relative mx-auto max-w-7xl px-6">
            <div className="mx-auto mb-20 max-w-2xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                <Zap className="h-3.5 w-3.5" />
                Pricing
              </div>
              <h2 className="mb-5 text-4xl font-bold tracking-tight sm:text-5xl">
                Start <span className="text-gradient">Free</span>, Scale When
                Ready
              </h2>
              <p className="text-lg text-content-2">
                No credit card required. Upgrade only when you need more.
              </p>
            </div>

            <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
              {/* Free */}
              <div className="rounded-3xl border border-edge bg-card p-8 transition-all hover:border-edge">
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
                  className="block w-full rounded-xl border border-edge bg-card py-3 text-center text-sm font-semibold text-content transition hover:bg-card-hover"
                >
                  Get Started
                </button>
              </div>

              {/* Pro */}
              <div className="relative rounded-3xl border border-indigo-500/30 bg-gradient-to-b from-indigo-500/10 to-transparent p-8 shadow-lg shadow-indigo-600/5">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-xs font-bold uppercase tracking-wider text-white">
                  Popular
                </div>
                <h3 className="mb-2 text-lg font-semibold text-content">Pro</h3>
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
                  className="block w-full rounded-xl bg-indigo-600 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500"
                >
                  Start Free Trial
                </button>
              </div>

              {/* Enterprise */}
              <div className="rounded-3xl border border-edge bg-card p-8 transition-all hover:border-edge">
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
                  className="block w-full rounded-xl border border-edge bg-card py-3 text-center text-sm font-semibold text-content transition hover:bg-card-hover"
                >
                  Contact Sales
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ──── About Creator ──── */}
        {creatorInfo && (
          <section
            id="creator"
            className="section-reveal py-32 bg-page/80 backdrop-blur-sm"
          >
            <div className="mx-auto max-w-4xl px-6">
              <div className="mx-auto mb-16 max-w-2xl text-center">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-pink-500/20 bg-pink-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-pink-400">
                  <Star className="h-3.5 w-3.5" />
                  Meet the Creator
                </div>
                <h2 className="mb-5 text-4xl font-bold tracking-tight sm:text-5xl">
                  Built by a <span className="text-gradient">Developer</span>,
                  for Developers
                </h2>
              </div>

              <div className="rounded-3xl border border-edge bg-card p-8 sm:p-10">
                <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {creatorInfo.avatar ? (
                      <img
                        src={creatorInfo.avatar}
                        alt={creatorInfo.name}
                        className="h-28 w-28 rounded-3xl object-cover ring-2 ring-edge shadow-lg"
                      />
                    ) : (
                      <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-600 text-3xl font-bold text-white shadow-lg">
                        {creatorInfo.name
                          ?.split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-2xl font-bold text-content">
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
                      <p className="mt-4 leading-relaxed text-content-2">
                        {creatorInfo.bio}
                      </p>
                    )}

                    {/* Skills */}
                    {creatorInfo.skills?.length > 0 && (
                      <div className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">
                        {creatorInfo.skills.map((skill: string, i: number) => (
                          <span
                            key={i}
                            className="rounded-lg bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-400 ring-1 ring-indigo-500/20"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Social Links */}
                    <div className="mt-6 flex flex-wrap justify-center gap-3 sm:justify-start">
                      {creatorInfo.email && (
                        <a
                          href={`mailto:${creatorInfo.email}`}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-edge bg-card px-4 py-2 text-sm font-medium text-content-2 transition hover:bg-card-hover hover:text-content"
                        >
                          ✉️ Email
                        </a>
                      )}
                      {creatorInfo.linkedin && (
                        <a
                          href={creatorInfo.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-edge bg-card px-4 py-2 text-sm font-medium text-content-2 transition hover:bg-card-hover hover:text-content"
                        >
                          💼 LinkedIn
                        </a>
                      )}
                      {creatorInfo.github && (
                        <a
                          href={creatorInfo.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-edge bg-card px-4 py-2 text-sm font-medium text-content-2 transition hover:bg-card-hover hover:text-content"
                        >
                          🐙 GitHub
                        </a>
                      )}
                      {creatorInfo.website && (
                        <a
                          href={creatorInfo.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-edge bg-card px-4 py-2 text-sm font-medium text-content-2 transition hover:bg-card-hover hover:text-content"
                        >
                          🌐 Website
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ──── Final CTA ──── */}
        <section className="section-reveal py-32 bg-page/70 backdrop-blur-sm">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <div className="rounded-[2rem] border border-indigo-500/20 bg-gradient-to-b from-indigo-600/10 to-purple-600/5 px-8 py-20 sm:px-16">
              <h2 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl">
                Ready to Build Your{" "}
                <span className="text-gradient">Perfect CV</span>?
              </h2>
              <p className="mx-auto mb-10 max-w-xl text-lg text-content-2">
                Join thousands of professionals who&apos;ve already landed their
                dream jobs. Start free — no credit card required.
              </p>
              <button
                onClick={() => setShowLogin(true)}
                className="group inline-flex h-14 items-center gap-3 rounded-2xl bg-indigo-600 px-10 text-base font-semibold text-white shadow-xl shadow-indigo-600/25 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/30 hover:scale-[1.02]"
              >
                <Sparkles className="h-5 w-5" />
                Get Started for Free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ──── Footer ──── */}
      <footer className="border-t border-edge bg-surface/80 backdrop-blur-md py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 md:grid-cols-4">
            {/* Brand */}
            <div className="md:col-span-1">
              <Link href="/" className="mb-4 flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/20 ring-1 ring-indigo-500/30">
                  <FileText className="h-4.5 w-4.5 text-indigo-400" />
                </div>
                <span className="text-xl font-bold tracking-tight">
                  Go<span className="text-gradient">CV</span>
                </span>
              </Link>
              <p className="mt-4 text-sm leading-relaxed text-content-3">
                AI-powered resume builder that helps professionals stand out and
                land their dream jobs.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-content-2">
                Product
              </h4>
              <ul className="space-y-3">
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

            {/* Company */}
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-content-2">
                Company
              </h4>
              <ul className="space-y-3">
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

            {/* Legal */}
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-content-2">
                Legal
              </h4>
              <ul className="space-y-3">
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

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-edge pt-8 text-sm text-content-4 sm:flex-row">
            <span>© {new Date().getFullYear()} GoCV. All rights reserved.</span>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              All systems operational
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
