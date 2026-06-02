"use client";

import IncomingCallPopup from "@/components/call/IcomingCallPopup";
import VideoCall from "@/components/call/VideoCall";
import Sidebar from "@/components/layout/Sidebar";
import AuthProvider from "@/components/providers/AuthProvider";
import { WebRTCProvider } from "@/hooks";

export default function MainAppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <WebRTCProvider>
        <div className="flex h-dvh w-dvw max-w-full overflow-hidden">
          <Sidebar />
          <main className="min-w-0 flex-1 overflow-hidden">{children}</main>
          <IncomingCallPopup />
          <VideoCall />
        </div>
      </WebRTCProvider>
    </AuthProvider>
  );
}
