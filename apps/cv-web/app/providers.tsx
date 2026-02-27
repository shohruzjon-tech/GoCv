"use client";

import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { useAuthStore, useThemeStore } from "@/lib/store";

export default function Providers({ children }: { children: React.ReactNode }) {
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);
  const loadTheme = useThemeStore((s) => s.loadTheme);

  useEffect(() => {
    loadFromStorage();
    loadTheme();
  }, [loadFromStorage, loadTheme]);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "rgba(15, 15, 35, 0.95)",
            color: "#e4e4e7",
            border: "1px solid rgba(255,255,255,0.06)",
            backdropFilter: "blur(12px)",
          },
        }}
      />
      {children}
    </>
  );
}
