"use client";

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
} from "lucide-react";

const ThreeBackground = dynamic(() => import("@/components/three-background"), {
  ssr: false,
});

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#08081a] text-white">
      <ThreeBackground />

      {/* ──── Navbar ──── */}
      <header className="fixed top-0 z-50 w-full">
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
              className="text-sm font-medium text-zinc-400 transition hover:text-white"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-zinc-400 transition hover:text-white"
            >
              How It Works
            </a>
            <a
              href="#testimonials"
              className="text-sm font-medium text-zinc-400 transition hover:text-white"
            >
              Testimonials
            </a>
            <a
              href="#pricing"
              className="text-sm font-medium text-zinc-400 transition hover:text-white"
            >
              Pricing
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden rounded-xl px-5 py-2.5 text-sm font-medium text-zinc-300 transition hover:text-white sm:inline-flex"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 hover:shadow-indigo-500/30"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ──── Hero ──── */}
        <section className="relative flex min-h-screen items-center justify-center px-6 pt-20">
          {/* Radial glow behind hero */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="h-[600px] w-[600px] rounded-full bg-indigo-600/8 blur-[120px]" />
          </div>

          <div className="relative mx-auto max-w-5xl text-center">
            {/* Badge */}
            <div className="animate-fade-up mb-8 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-5 py-2 text-sm font-medium text-indigo-300">
              <Sparkles className="h-4 w-4" />
              Powered by GPT-5 Artificial Intelligence
              <ChevronRight className="h-3.5 w-3.5" />
            </div>

            {/* Headline */}
            <h1 className="animate-fade-up delay-100 mb-8 text-5xl font-extrabold leading-[1.1] tracking-tight sm:text-7xl lg:text-8xl">
              Your Career,{" "}
              <span className="text-gradient">Beautifully Crafted</span>
              <br />
              by AI
            </h1>

            {/* Subheading */}
            <p className="animate-fade-up delay-200 mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-zinc-400 sm:text-xl">
              Create stunning, ATS-optimized resumes in minutes — not hours. Our
              AI understands your experience and crafts the perfect narrative to
              land your dream job.
            </p>

            {/* CTAs */}
            <div className="animate-fade-up delay-300 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/login"
                className="group inline-flex h-14 items-center gap-3 rounded-2xl bg-indigo-600 px-10 text-base font-semibold text-white shadow-xl shadow-indigo-600/25 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/30 hover:scale-[1.02]"
              >
                <Sparkles className="h-5 w-5" />
                Start Building — Free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex h-14 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-8 text-base font-medium text-zinc-300 backdrop-blur transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
              >
                See How It Works
              </a>
            </div>

            {/* Social proof */}
            <div className="animate-fade-up delay-500 mt-16 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
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
                    className={`h-10 w-10 rounded-full ${bg} ring-2 ring-[#08081a] flex items-center justify-center text-xs font-bold`}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <div className="text-sm text-zinc-400">
                <span className="font-semibold text-white">2,500+</span>{" "}
                professionals already building with GoCV
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-amber-400 text-amber-400"
                  />
                ))}
                <span className="ml-2 text-sm text-zinc-400">4.9/5</span>
              </div>
            </div>
          </div>
        </section>

        {/* ──── Logos / Trust Bar ──── */}
        <section className="border-y border-white/5 bg-white/[0.02] py-12">
          <div className="mx-auto max-w-7xl px-6">
            <p className="mb-8 text-center text-sm font-medium uppercase tracking-widest text-zinc-600">
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
                  className="text-xl font-bold tracking-tight text-zinc-400"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ──── Features Grid ──── */}
        <section id="features" className="py-32">
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
              <p className="text-lg text-zinc-400">
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
                    <h3 className="mb-2 text-lg font-semibold text-white">
                      {feat.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-zinc-400">
                      {feat.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ──── How It Works ──── */}
        <section id="how-it-works" className="relative py-32">
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
              <p className="text-lg text-zinc-400">
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
                  className="group relative rounded-3xl border border-white/5 bg-white/[0.02] p-10 transition-all hover:border-white/10 hover:bg-white/[0.04]"
                >
                  <div
                    className={`mb-6 inline-flex bg-gradient-to-r ${item.gradient} bg-clip-text text-5xl font-black text-transparent`}
                  >
                    {item.step}
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="leading-relaxed text-zinc-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ──── Stats ──── */}
        <section className="border-y border-white/5 bg-white/[0.02] py-20">
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
                <p className="text-sm text-zinc-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ──── Testimonials ──── */}
        <section id="testimonials" className="py-32">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mx-auto mb-20 max-w-2xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-amber-400">
                <Star className="h-3.5 w-3.5" />
                Testimonials
              </div>
              <h2 className="mb-5 text-4xl font-bold tracking-tight sm:text-5xl">
                Loved by <span className="text-gradient">Professionals</span>
              </h2>
              <p className="text-lg text-zinc-400">
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
                  className="rounded-3xl border border-white/5 bg-white/[0.02] p-8 transition-all hover:border-white/10"
                >
                  <div className="mb-4 flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                  <p className="mb-6 leading-relaxed text-zinc-300">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div>
                    <p className="font-semibold text-white">{t.name}</p>
                    <p className="text-sm text-zinc-500">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ──── Pricing ──── */}
        <section id="pricing" className="relative py-32">
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
              <p className="text-lg text-zinc-400">
                No credit card required. Upgrade only when you need more.
              </p>
            </div>

            <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
              {/* Free */}
              <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-8 transition-all hover:border-white/10">
                <h3 className="mb-2 text-lg font-semibold text-white">Free</h3>
                <p className="mb-6 text-sm text-zinc-500">
                  Perfect for getting started
                </p>
                <div className="mb-8">
                  <span className="text-4xl font-bold text-white">$0</span>
                  <span className="text-zinc-500">/month</span>
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
                      className="flex items-center gap-3 text-sm text-zinc-300"
                    >
                      <Check className="h-4 w-4 flex-shrink-0 text-emerald-400" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className="block w-full rounded-xl border border-white/10 bg-white/5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Get Started
                </Link>
              </div>

              {/* Pro */}
              <div className="relative rounded-3xl border border-indigo-500/30 bg-gradient-to-b from-indigo-500/10 to-transparent p-8 shadow-lg shadow-indigo-600/5">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-xs font-bold uppercase tracking-wider text-white">
                  Popular
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">Pro</h3>
                <p className="mb-6 text-sm text-zinc-500">
                  For serious job seekers
                </p>
                <div className="mb-8">
                  <span className="text-4xl font-bold text-white">$9</span>
                  <span className="text-zinc-500">/month</span>
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
                      className="flex items-center gap-3 text-sm text-zinc-300"
                    >
                      <Check className="h-4 w-4 flex-shrink-0 text-indigo-400" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className="block w-full rounded-xl bg-indigo-600 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500"
                >
                  Start Free Trial
                </Link>
              </div>

              {/* Enterprise */}
              <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-8 transition-all hover:border-white/10">
                <h3 className="mb-2 text-lg font-semibold text-white">
                  Enterprise
                </h3>
                <p className="mb-6 text-sm text-zinc-500">
                  For teams & organizations
                </p>
                <div className="mb-8">
                  <span className="text-4xl font-bold text-white">Custom</span>
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
                      className="flex items-center gap-3 text-sm text-zinc-300"
                    >
                      <Check className="h-4 w-4 flex-shrink-0 text-purple-400" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className="block w-full rounded-xl border border-white/10 bg-white/5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Contact Sales
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ──── Final CTA ──── */}
        <section className="py-32">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <div className="rounded-[2rem] border border-indigo-500/20 bg-gradient-to-b from-indigo-600/10 to-purple-600/5 px-8 py-20 sm:px-16">
              <h2 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl">
                Ready to Build Your{" "}
                <span className="text-gradient">Perfect CV</span>?
              </h2>
              <p className="mx-auto mb-10 max-w-xl text-lg text-zinc-400">
                Join thousands of professionals who&apos;ve already landed their
                dream jobs. Start free — no credit card required.
              </p>
              <Link
                href="/login"
                className="group inline-flex h-14 items-center gap-3 rounded-2xl bg-indigo-600 px-10 text-base font-semibold text-white shadow-xl shadow-indigo-600/25 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/30 hover:scale-[1.02]"
              >
                <Sparkles className="h-5 w-5" />
                Get Started for Free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ──── Footer ──── */}
      <footer className="border-t border-white/5 bg-white/[0.02] py-16">
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
              <p className="mt-4 text-sm leading-relaxed text-zinc-500">
                AI-powered resume builder that helps professionals stand out and
                land their dream jobs.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">
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
                      className="text-sm text-zinc-500 transition hover:text-white"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">
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
                      className="text-sm text-zinc-500 transition hover:text-white"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">
                Legal
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/privacy-policy"
                    className="text-sm text-zinc-500 transition hover:text-white"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms-of-service"
                    className="text-sm text-zinc-500 transition hover:text-white"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 text-sm text-zinc-600 sm:flex-row">
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
