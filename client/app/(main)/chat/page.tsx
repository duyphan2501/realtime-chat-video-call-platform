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
import { useEffect, useState, useCallback } from "react";
import type { User, Conversation } from "@/types";

import ConversationList from "@/components/chat/ConversationList";
import ChatWindow from "@/components/chat/ChatWindow";
import ContactsPage from "@/components/contacts/ContactsPage";
import CreateGroupModal from "@/components/chat/CreateGroupModal";
import { useAuthStore, useCallStore, useConversationStore, useFriendStore } from "@/store";

export default function ChatPage() {
  const [friends, setFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const currentUser = useAuthStore(s => s.user)

  const conversations = useConversationStore((s) => s.conversations);
  const setConvs = useConversationStore((s) => s.setConversations);
  const activeId = useConversationStore((s) => s.activeId);
  const setActiveId = useConversationStore((s) => s.setActiveId);
  const friendReqCount = useFriendStore((s) => s.friendRequests.length);
  const setCallStatus = useCallStore((s) => s.setStatus);
  const setCallType = useCallStore((s) => s.setCallType);
  const setConvId = useCallStore((s) => s.setConvId);

  const handleOpenChat = () => {};
  const handleStartCall = () => {};

  const activeConv = conversations.find((c) => c._id === activeId);

  if (loading) {
    return (
      <div
        className="flex h-screen items-center justify-center"
        style={{ background: "var(--color-bg)" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-14 h-14 rounded-3xl flex items-center justify-center"
            style={{ background: "var(--color-brand)" }}
          >
            <svg
              className="w-7 h-7 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v7a2 2 0 01-2 2H9l-4 3v-3H4a2 2 0 01-2-2V5z" />
            </svg>
          </div>
          <div className="flex gap-1.5">
            <span
              className="dot-1 w-2 h-2 rounded-full"
              style={{ background: "var(--color-brand)" }}
            />
            <span
              className="dot-2 w-2 h-2 rounded-full"
              style={{ background: "var(--color-brand)" }}
            />
            <span
              className="dot-3 w-2 h-2 rounded-full"
              style={{ background: "var(--color-brand)" }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      
      <ConversationList
        conversations={conversations}
        activeId={activeId}
        currentUser={currentUser}
        onCreateGroup={() => setShowCreate(true)}
      />
      <div
        className="flex flex-1 overflow-hidden"
      >
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
                  style={{ color: "var(--color-ink)" }}
                >
                  Chào mừng đến ZaloChat
                </p>
                <p className="text-sm" style={{ color: "var(--color-ink-4)" }}>
                  Chọn một cuộc trò chuyện để bắt đầu nhắn tin
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Overlays */}
      {showCreate && currentUser && (
        <CreateGroupModal
          friends={friends}
          onClose={() => setShowCreate(false)}
          onCreate={(id) => {
            setActiveId(id);
          }}
        />
      )}

    </div>
  );
}
