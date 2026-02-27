"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Login is now handled via the landing page modal.
// This page redirects for backwards compatibility.
export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-page">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 mx-auto animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        <p className="text-content-2">Redirecting...</p>
      </div>
    </div>
  );
}
