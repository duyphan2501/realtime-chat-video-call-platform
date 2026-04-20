/* ═══════════════════════════════════════════════════════════
   app/chat/page.tsx — main page after login

   TODO — backend integration checklist:
   ① userApi.getMe()              → load currentUser
   ② conversationApi.getAll()     → load chat list
   ③ userApi.getFriends()         → load friends list
   ④ useSocket().init(token)      → connect socket
   ⑤ WebRTC: emit "call:invite"   → when starting a call
   ═══════════════════════════════════════════════════════════ */
"use client";
import {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
  Suspense,
} from "react";
import type { User, Conversation } from "@/types";

import ConversationList from "@/components/chat/ConversationList";
import ChatWindow from "@/components/chat/ChatWindow";
import ContactsPage from "@/components/contacts/ContactsPage";
import CreateGroupModal from "@/components/chat/CreateGroupModal";
import {
  useAuthStore,
  useCallStore,
  useConversationStore,
  useFriendStore,
  useSocketStore,
} from "@/store";
import { useWebRTC } from "@/hooks";
import { getOtherId } from "@/utils/chat.utils";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function ChatPage() {
  const [showCreate, setShowCreate] = useState(false);
  const currentUser = useAuthStore((s) => s.user);

  const searchParams = useSearchParams();
  const convIdParam = searchParams.get("conv");

  const setActiveId = useConversationStore((s) => s.setActiveId);
  const activeId = useConversationStore((s) => s.activeId);
  const conversations = useConversationStore((s) => s.conversations);

  // Giữ id cần activate dù URL đã bị xóa
  const pendingConvId = useRef<string | null>(convIdParam);

  useEffect(() => {
    if (!pendingConvId.current) return;

    const id = pendingConvId.current;

    // Chờ đến khi conversations thực sự có entry này
    if (!conversations.has(id)) return;

    setActiveId(id);
    pendingConvId.current = null; // đã xử lý xong, clear đi

    window.history.replaceState(null, "", window.location.pathname);
  }, [convIdParam, conversations, setActiveId]);

  // Lấy hội thoại đang hoạt động (kể cả khi URL vừa bị xóa)
  const activeConv = activeId ? conversations.get(activeId) : null;

  const { startCall, acceptCall, endCall } = useWebRTC();
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
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          Loading chat...
        </div>
      }
    >
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}

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
            /* Empty state */
            <div className="flex flex-1 items-center justify-center">
              <div className="flex flex-col items-center gap-4 text-center p-8">
                <div
                  className="w-20 h-20 rounded-3xl flex items-center justify-center"
                  style={{ background: "var(--color-dark-secondary)" }}
                >
                  <svg
                    className="w-10 h-10"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    style={{ color: "var(--color-brand)" }}
                  >
                    <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v7a2 2 0 01-2 2H9l-4 3v-3H4a2 2 0 01-2-2V5z" />
                  </svg>
                </div>
                <div>
                  <p
                    className="font-bold text-lg mb-1"
                    style={{ color: "var(--color-ink-4)", paddingBottom: 10 }}
                  >
                    Welcome to Connect
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: "var(--color-ink-4)" }}
                  >
                    Select a conversation to start chatting
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Overlays */}
        {showCreate && currentUser && (
          <CreateGroupModal onClose={() => setShowCreate(false)} />
        )}
      </div>
    </Suspense>
  );
}
