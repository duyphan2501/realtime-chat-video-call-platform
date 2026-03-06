"use client";

import { useEffect, useState } from "react";
import { useAuthService } from "@/services";
import { SessionExpiredDialog } from "../SessionExpiredDialog";
import { usePathname } from "next/navigation";
import { useMyContext } from "@/context/MyContext";
import Loading from "../Loading";
import { useAuthStore } from "@/store";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { getMe } = useAuthService();
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const {isHydrated} = useMyContext()
  const user = useAuthStore(s => s.user)

  // Danh sách các route không cần check auth
  const isAuthRoute = pathname?.startsWith("/auth");
  useEffect(() => {
    const initAuth = async () => {
      if (isAuthRoute || !isHydrated || user) return;
      setIsLoading(true);
      try {
        await getMe();
      } catch (error) {
        console.error("Auth init failed", error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [pathname, isHydrated]);

  if (isLoading)
    return <Loading />

  return (
    <>
      {children}
      <SessionExpiredDialog isAuthRoute={isAuthRoute}/>
    </>
  );
}
