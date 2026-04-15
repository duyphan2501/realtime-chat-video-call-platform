/* ═══════════════════════════════════════════════════════════
   app/chat/page.tsx — trang chính sau khi đăng nhập

   TODO — backend integration checklist:
   ① userApi.getMe()              → load currentUser
   ② conversationApi.getAll()     → load danh sách chat
   ③ userApi.getFriends()         → load danh sách bạn bè
   ④ useSocket().init(token)      → kết nối socket
   ⑤ WebRTC: emit "call:invite"   → khi bắt đầu gọi
   ═══════════════════════════════════════════════════════════ */
"use client";
import { useEffect, useState, useCallback, useRef } from "react";
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

export default function ChatPage() {
  const [showCreate, setShowCreate] = useState(false);
  const currentUser = useAuthStore((s) => s.user);

  const conversations = useConversationStore((s) => s.conversations);
  const activeId = useConversationStore((s) => s.activeId);
  const setActiveId = useConversationStore((s) => s.setActiveId);
  const socket = useSocketStore(s => s.socket)

  // 2. Lấy các hàm điều khiển từ Hook
  const { startCall, acceptCall, endCall } = useWebRTC();

  // 3. Lấy trạng thái từ Store
  const activeConv = conversations.get(activeId || "") || null;

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
                style={{ background: "var(--color-brand-light)" }}
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
                  Chào mừng đến DaloChat
                </p>
                <p className="text-sm" style={{ color: "var(--color-ink-4)" }}>
                  Chọn một cuộc trò chuyện để bắt đầu Chatset
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Overlays */}
      {showCreate && currentUser && (
        <CreateGroupModal
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}
