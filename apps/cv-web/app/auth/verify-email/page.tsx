"use client";

import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, ArrowRight, Mail, RotateCcw } from "lucide-react";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import toast from "react-hot-toast";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const email = searchParams.get("email") || "";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      router.replace("/auth/register");
    }
  }, [email, router]);

  // Countdown for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Start initial cooldown
  useEffect(() => {
    setResendCooldown(60);
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only accept digits
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are filled
    if (value && index === 5) {
      const fullCode = newCode.join("");
      if (fullCode.length === 6) {
        handleVerify(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (pasted.length === 0) return;

    const newCode = [...code];
    for (let i = 0; i < 6; i++) {
      newCode[i] = pasted[i] || "";
    }
    setCode(newCode);

    // Focus last filled input or next empty
    const lastIndex = Math.min(pasted.length, 5);
    inputRefs.current[lastIndex]?.focus();

    if (pasted.length === 6) {
      handleVerify(pasted);
    }
  };

  const handleVerify = useCallback(
    async (fullCode: string) => {
      if (loading) return;
      setLoading(true);
      try {
        const res = await authApi.verifyEmail(email, fullCode);
        const { access_token, user } = res.data;
        setAuth(user, access_token);
        toast.success("Email verified! Welcome to GoCV! 🎉");
        const pendingWizard = localStorage.getItem("pending_cv_wizard");
        if (pendingWizard) {
          router.push("/dashboard/cv/generate");
        } else {
          router.push("/dashboard");
        }
      } catch (err: any) {
        const data = err.response?.data;
        toast.error(data?.message || "Invalid verification code");
        // Clear code on failure
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } finally {
        setLoading(false);
      }
    },
    [email, loading, router, setAuth],
  );

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      await authApi.resendVerification(email);
      toast.success("New verification code sent!");
      setResendCooldown(60);
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      const data = err.response?.data;
      toast.error(data?.message || "Failed to resend code");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      toast.error("Please enter the full 6-digit code");
      return;
    }
    handleVerify(fullCode);
  };

  if (!email) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-4">
      <div className="w-full max-w-md animate-fade-up">
        <div className="rounded-3xl border border-edge bg-popover p-8 shadow-2xl shadow-black/10 backdrop-blur-xl">
          {/* Logo */}
          <div className="mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600/20 ring-1 ring-indigo-500/30">
                <FileText className="h-5 w-5 text-indigo-400" />
              </div>
              <span className="text-xl font-bold tracking-tight">
                Go<span className="text-gradient">CV</span>
              </span>
            </Link>

            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/10 ring-1 ring-indigo-500/20">
              <Mail className="h-7 w-7 text-indigo-400" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-content">
              Check your email
            </h1>
            <p className="mt-2 text-sm text-content-2">
              We sent a 6-digit verification code to
            </p>
            <p className="mt-1 text-sm font-semibold text-content">{email}</p>
          </div>

          {/* Code Input */}
          <form onSubmit={handleSubmit}>
            <div className="flex justify-center gap-2.5 mb-6">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="h-14 w-12 rounded-xl border border-field-edge bg-field text-center text-xl font-bold text-content outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:h-16 sm:w-14"
                  autoFocus={index === 0}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || code.join("").length !== 6}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  Verify Email
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Resend */}
          <div className="mt-6 text-center">
            <p className="text-sm text-content-3">
              Didn&apos;t receive the code?{" "}
              {resendCooldown > 0 ? (
                <span className="text-content-4">
                  Resend in {resendCooldown}s
                </span>
              ) : (
                <button
                  onClick={handleResend}
                  className="inline-flex items-center gap-1 font-semibold text-indigo-400 hover:text-indigo-300 transition"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Resend code
                </button>
              )}
            </p>
          </div>

          {/* Back links */}
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-content-4">
            <Link
              href="/auth/register"
              className="hover:text-content-2 transition"
            >
              Back to register
            </Link>
            <span>·</span>
            <Link href="/login" className="hover:text-content-2 transition">
              Sign in instead
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-page">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 mx-auto animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            <p className="text-content-2">Loading...</p>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
