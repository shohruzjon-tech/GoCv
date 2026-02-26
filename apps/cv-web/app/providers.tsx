"use client";

import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "@/lib/store";

export default function Providers({ children }: { children: React.ReactNode }) {
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <>
      <Toaster position="top-right" />
      {children}
    </>
  );
}
