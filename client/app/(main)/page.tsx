import type { Metadata } from "next";
import { Suspense } from "react";

import ChatPageClient from "@/components/chat/ChatPageClient";
import { privatePageRobots } from "../seo";

export const metadata: Metadata = {
  title: "Chats",
  description:
    "Open your Connect inbox to send real-time messages and start audio or video calls.",
  robots: privatePageRobots,
};

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          Loading chat...
        </div>
      }
    >
      <ChatPageClient />
    </Suspense>
  );
}
