"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { authApi } from "@/lib/api";
import toast from "react-hot-toast";

export default function AuthCallbackPage() {
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
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 mx-auto animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        <p className="text-zinc-600">Authenticating...</p>
      </div>
    </div>
  );
}
