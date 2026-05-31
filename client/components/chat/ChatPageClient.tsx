"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import ConversationList from "@/components/chat/ConversationList";
import ChatWindow from "@/components/chat/ChatWindow";
import CreateGroupModal from "@/components/chat/CreateGroupModal";
import { useAuthStore, useConversationStore } from "@/store";
import { useWebRTC } from "@/hooks";
import { getOtherId } from "@/utils/chat.utils";
import { useSearchParams } from "next/navigation";

export default function ChatPageClient() {
  const [showCreate, setShowCreate] = useState(false);
  const currentUser = useAuthStore((s) => s.user);

  const searchParams = useSearchParams();
  const convIdParam = searchParams.get("conv");

  const setActiveId = useConversationStore((s) => s.setActiveId);
  const activeId = useConversationStore((s) => s.activeId);
  const conversations = useConversationStore((s) => s.conversations);

  const pendingConvId = useRef<string | null>(convIdParam);

  useEffect(() => {
    if (!pendingConvId.current) return;

    const id = pendingConvId.current;
    if (!conversations.has(id)) return;

    setActiveId(id);
    pendingConvId.current = null;

    window.history.replaceState(null, "", window.location.pathname);
  }, [conversations, setActiveId]);

  const activeConv = activeId ? conversations.get(activeId) : null;

  const { startCall } = useWebRTC();
  const handleStartCall = useCallback(
    async (type: "audio" | "video") => {
      if (!activeConv || !currentUser) return;
      const targetId = getOtherId(activeConv, currentUser);
      if (!targetId) return;
      await startCall(targetId, type);
    },
    [activeConv, currentUser, startCall],
  );

  return (
    <div className="flex h-screen overflow-hidden">
      <ConversationList
        conversations={Array.from(conversations.values())}
        activeId={activeId}
        currentUser={currentUser}
        onCreateGroup={() => setShowCreate(true)}
      />
      <div className="flex flex-1 overflow-hidden">
        {activeConv && currentUser ? (
          <ChatWindow
            conversation={activeConv}
            currentUser={currentUser}
            onStartCall={handleStartCall}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-center p-8">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center bg-dark-secondary">
                <svg
                  className="w-10 h-10 text-brand"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v7a2 2 0 01-2 2H9l-4 3v-3H4a2 2 0 01-2-2V5z" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-lg mb-1 pb-2.5 text-ink-4">
                  Welcome to Connect
                </p>
                <p className="text-sm text-ink-4">
                  Select a conversation to start chatting
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {showCreate && currentUser && (
        <CreateGroupModal onClose={() => setShowCreate(false)} />
      )}
    </div>
  );
}
