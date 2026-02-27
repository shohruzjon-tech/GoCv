"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Shield } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminLoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.adminLogin(email, password);
      setAuth(res.data.user, res.data.access_token);
      toast.success("Welcome, Admin!");
      router.push("/admin");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#08081a] px-4">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2">
        <div className="h-[400px] w-[400px] rounded-full bg-orange-600/10 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 ring-1 ring-orange-500/20">
            <Shield className="h-7 w-7 text-orange-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Login</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Sign in to the admin panel
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-white/[0.06] bg-white/[0.03] p-8 backdrop-blur-xl"
        >
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-zinc-400">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              required
            />
          </div>
          <div className="mb-6">
            <label className="mb-1 block text-sm font-medium text-zinc-400">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-orange-600 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-600/25 transition hover:bg-orange-500 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
          <div className="mt-4 text-center">
            <Link
              href="/login"
              className="text-sm text-zinc-500 hover:text-zinc-300"
            >
              ← Back to user login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
