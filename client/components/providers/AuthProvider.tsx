"use client";

import { useEffect, useState } from "react";
import { useAuthService } from "@/services";
import { SessionExpiredDialog } from "../SessionExpiredDialog";
import { usePathname } from "next/navigation";
import { useMyContext } from "@/context/MyContext";
import Loading from "../loadings/Loading";
import { useAuthStore } from "@/store";
import { useSocketEvents, useSocketMain } from "@/hooks";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { getMe } = useAuthService();
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const { isHydrated } = useMyContext();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.accessToken);
  const { connect, disconnect } = useSocketMain();
  const setSesstionExpired = useAuthStore((s) => s.setSessionExpired);

  // List of routes that don't need auth check
  const isAuthRoute = pathname?.startsWith("/auth");
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (isAuthRoute || !isHydrated || user) return;
        setIsLoading(true);
        await getMe();
      } catch (error) {
        console.error("Auth init failed", error);
        setSesstionExpired(true);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [pathname, isHydrated]);

  useEffect(() => {
    if (token && user) {
      connect(token);
    }
    return () => {
      disconnect();
    };
  }, [token, user, connect, disconnect]);

  useSocketEvents();

  if (isLoading) return <Loading />;

  return (
    <>
      {children}
      <SessionExpiredDialog isAuthRoute={isAuthRoute} />
    </>
  );
}
