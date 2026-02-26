import Link from "next/link";
import { FileText, Sparkles, Globe, Download } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-blue-50 dark:from-zinc-950 dark:to-zinc-900">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white/60 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-bold">CV Builder</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Login
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              <Sparkles className="h-4 w-4" />
              Powered by GPT-5 AI
            </div>
            <h1 className="mb-6 text-5xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-6xl">
              Build Your Professional CV{" "}
              <span className="text-blue-600">with AI</span>
            </h1>
            <p className="mb-10 text-lg text-zinc-600 dark:text-zinc-400">
              Create stunning, professional resumes in minutes. Our AI-powered
              builder generates tailored content, beautiful layouts, and
              shareable landing pages for your career.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-blue-600 px-8 text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700"
              >
                <Sparkles className="h-5 w-5" />
                Start Building — It&apos;s Free
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
          <h2 className="mb-16 text-center text-3xl font-bold text-zinc-900 dark:text-white">
            Everything You Need
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <Sparkles className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-white">
                AI-Powered Generation
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Tell us about yourself and our GPT-5 AI will generate a
                professional, tailored CV with optimized content.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
                <Globe className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-white">
                Shareable Landing Page
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Get a unique public URL for your CV that you can share with
                employers, on LinkedIn, or anywhere online.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
                <Download className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-white">
                Download as PDF
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Export your CV as a beautifully formatted PDF, ready to submit
                with job applications.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 bg-white py-8 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-zinc-500 sm:px-6">
          © {new Date().getFullYear()} CV Builder. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
