'use client'
import IncomingCallPopup from "@/components/call/IcomingCallPopup";
import VideoCall from "@/components/call/VideoCall";
import Sidebar from "@/components/layout/Sidebar";
import AuthProvider from "@/components/providers/AuthProvider";


export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <AuthProvider>
      <div className="flex">
        <Sidebar />
        <main className="flex-1">{children}</main>
        <IncomingCallPopup />
        <VideoCall/>
      </div>
    </AuthProvider>
  );
}
