"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  ArrowRight,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
} from "lucide-react";
import { authApi } from "@/lib/api";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/api/auth/google`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      await authApi.register(name, email, password);
      toast.success("Verification code sent to your email!");
      router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      const data = err.response?.data;
      toast.error(data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-4 py-12">
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
            <h1 className="text-2xl font-bold tracking-tight text-content">
              Create your account
            </h1>
            <p className="mt-2 text-sm text-content-2">
              Start building your professional CV today
            </p>
          </div>

          {/* Google Sign Up */}
          <button
            onClick={handleGoogleLogin}
            className="group flex w-full items-center justify-center gap-3 rounded-2xl border border-edge bg-card px-6 py-3.5 text-sm font-medium text-content transition-all hover:bg-card-hover"
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
          </button>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-edge" />
            <span className="text-xs font-medium text-content-4">
              or register with email
            </span>
            <div className="h-px flex-1 bg-edge" />
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-content-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-content-4" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full rounded-xl border border-field-edge bg-field py-3 pl-10 pr-4 text-sm text-content placeholder:text-content-4 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-content-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-content-4" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-field-edge bg-field py-3 pl-10 pr-4 text-sm text-content placeholder:text-content-4 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-content-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-content-4" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full rounded-xl border border-field-edge bg-field py-3 pl-10 pr-11 text-sm text-content placeholder:text-content-4 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-content-4 hover:text-content-2 transition"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-content-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-content-4" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full rounded-xl border border-field-edge bg-field py-3 pl-10 pr-4 text-sm text-content placeholder:text-content-4 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  required
                  minLength={8}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Login link */}
          <p className="mt-6 text-center text-sm text-content-3">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-indigo-400 hover:text-indigo-300 transition"
            >
              Sign in
            </Link>
          </p>

          <p className="mt-4 text-center text-xs text-content-4">
            By creating an account, you agree to our{" "}
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
  );
}
