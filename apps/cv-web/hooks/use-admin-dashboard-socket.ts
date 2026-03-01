"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/lib/store";
import type {
  LiveSnapshot,
  JoiningDynamics,
  RegistrationStats,
  RequestDynamics,
} from "@/types";

const WS_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface AdminDashboardSocketState {
  connected: boolean;
  liveStats: LiveSnapshot | null;
  joiningDynamics: JoiningDynamics | null;
  registrationStats: RegistrationStats | null;
  requestDynamics: RequestDynamics | null;
  onlineAdmins: number;
}

export function useAdminDashboardSocket(): AdminDashboardSocketState {
  const socketRef = useRef<Socket | null>(null);
  const token = useAuthStore((s) => s.token);

  const [connected, setConnected] = useState(false);
  const [liveStats, setLiveStats] = useState<LiveSnapshot | null>(null);
  const [joiningDynamics, setJoiningDynamics] =
    useState<JoiningDynamics | null>(null);
  const [registrationStats, setRegistrationStats] =
    useState<RegistrationStats | null>(null);
  const [requestDynamics, setRequestDynamics] =
    useState<RequestDynamics | null>(null);
  const [onlineAdmins, setOnlineAdmins] = useState(0);

  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setConnected(false);
      return;
    }

    const socket = io(`${WS_URL}/admin-dashboard`, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
    });

    socket.on("connect", () => {
      console.log("[WS] Admin dashboard connected");
      setConnected(true);
    });

    socket.on("disconnect", (reason) => {
      console.log("[WS] Admin dashboard disconnected:", reason);
      setConnected(false);
    });

    socket.on("live-stats", (data: LiveSnapshot) => {
      setLiveStats(data);
    });

    socket.on("joining-dynamics", (data: JoiningDynamics) => {
      setJoiningDynamics(data);
    });

    socket.on("registration-stats", (data: RegistrationStats) => {
      setRegistrationStats(data);
    });

    socket.on("request-dynamics", (data: RequestDynamics) => {
      setRequestDynamics(data);
    });

    socket.on("admin-count", (count: number) => {
      setOnlineAdmins(count);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  return {
    connected,
    liveStats,
    joiningDynamics,
    registrationStats,
    requestDynamics,
    onlineAdmins,
  };
}
