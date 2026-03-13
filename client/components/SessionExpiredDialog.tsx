"use client";

import { useAuthStore } from "@/store";
import { LockKeyhole, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";

export function SessionExpiredDialog({ isAuthRoute = false }) {
  const { isSessionExpired, clearAuth, setSessionExpired } = useAuthStore();
  const router = useRouter();

  if (!isSessionExpired || isAuthRoute) return null;

  const handleRelogin = () => {
    clearAuth();
    setSessionExpired(false);
    router.push("/auth");
  };

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4 font-sans">
      {/* Container chính của Dialog */}
      <div className="w-full max-w-110 bg-[#181829] border border-gray rounded-2xl shadow-2xl p-8 flex flex-col items-center text-center">
        {/* Icon Lock Clock */}
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <div className="w-14 h-14 bg-primary/20 rounded-full flex items-center justify-center">
            <LockKeyhole size={30} className="text-primary" />
          </div>
        </div>

        {/* Text Content */}
        <h1 className="text-2xl font-bold text-slate-100 mb-3 tracking-tight">
          Session Expired
        </h1>
        <p className="text-[#9494b8] text-base leading-relaxed mb-8">
          Your session has expired for security reasons. Please log in again to
          continue using the platform and keep your data safe.
        </p>

        {/* Actions Button */}
        <div className="w-full space-y-3">
          <button
            onClick={handleRelogin}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn size={24} className="white" />
            Log In Now
          </button>
        </div>

        {/* Footer Note */}
        <div className="mt-8 pt-6 border-t border-gray w-full">
          <p className="text-xs text-[#9494b8]/60 uppercase tracking-widest font-semibold">
            Secure Session Management
          </p>
        </div>
      </div>
    </div>
  );
}
