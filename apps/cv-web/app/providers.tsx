"use client";

import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuthStore } from "@/lib/store";
import { useNotificationSocket } from "@/hooks/use-socket";
import NotificationToastContainer from "@/components/layout/notification-toast";

function SocketConnector() {
  useNotificationSocket();
  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <ThemeProvider>
      <SocketConnector />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "var(--t-elevated)",
            color: "var(--t-content)",
            border: "1px solid var(--t-edge)",
            backdropFilter: "blur(12px)",
          },
        }}
      />
      <NotificationToastContainer />
      {children}
    </ThemeProvider>
  );
}
