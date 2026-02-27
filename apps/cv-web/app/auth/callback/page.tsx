"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { authApi } from "@/lib/api";
import toast from "react-hot-toast";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      localStorage.setItem("token", token);
      authApi
        .getProfile()
        .then((res) => {
          setAuth(res.data, token);
          toast.success("Logged in successfully!");
          router.push("/dashboard");
        })
        .catch(() => {
          toast.error("Authentication failed");
          router.push("/login");
        });
    } else {
      router.push("/login");
    }
  }, [searchParams, router, setAuth]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#08081a]">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 mx-auto animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        <p className="text-zinc-400">Authenticating...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#08081a]">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 mx-auto animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            <p className="text-zinc-400">Loading...</p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
