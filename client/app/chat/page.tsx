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
import { userApi, conversationApi } from "@/lib/api";
import { useSocket } from "@/hooks/useSocket";
import { useChatStore, useCallStore } from "@/store";
import { getSocket } from "@/hooks/useSocket";

import Sidebar, { type Tab } from "@/components/layout/Sidebar";
import ConversationList from "@/components/chat/ConversationList";
import ChatWindow from "@/components/chat/ChatWindow";
import ContactsPage from "@/components/contacts/ContactsPage";
import CreateGroupModal from "@/components/chat/CreateGroupModal";
import VideoCallModal from "@/components/call/VideoCallModal";

export default function ChatPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [friends,     setFriends]     = useState<User[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [tab,         setTab]         = useState<Tab>("chat");
  const [showCreate,  setShowCreate]  = useState(false);

  const { init: initSocket } = useSocket();
  const conversations  = useChatStore((s) => s.conversations);
  const setConvs       = useChatStore((s) => s.setConversations);
  const activeId       = useChatStore((s) => s.activeId);
  const setActiveId    = useChatStore((s) => s.setActiveId);
  const friendReqCount = useChatStore((s) => s.friendRequests.length);
  const setCallStatus  = useCallStore((s) => s.setStatus);
  const setCallType    = useCallStore((s) => s.setCallType);
  const setConvId      = useCallStore((s) => s.setConvId);

  /* ─── Bootstrap: load user + convs + friends + socket ─ */
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) { window.location.href = "/auth"; return; }

    (async () => {
      try {
        // TODO ①: getMe
        const meRes = await userApi.getMe();
        const me: User = meRes.user ?? meRes.data ?? meRes;
        setCurrentUser(me);

        // TODO ②: getAll conversations
        const convRes = await conversationApi.getAll();
        const convs: Conversation[] = convRes.conversations ?? convRes.data ?? [];
        setConvs(convs);

        // TODO ③: getFriends
        const friendsRes = await userApi.getFriends();
        setFriends(friendsRes.friends ?? friendsRes.data ?? []);

        // TODO ④: init socket
        initSocket(token);
      } catch {
        window.location.href = "/auth";
      } finally {
        setLoading(false);
      }
    })();
  }, [initSocket, setConvs]);

  /* ─── Handle start call ──────────────────────────────
     TODO ⑤: emit "call:invite" qua socket
             peerSocketId phải lấy từ presence/user info */
  const handleStartCall = useCallback((convId: string, type: "audio" | "video") => {
    const conv = conversations.find((c) => c._id === convId);
    if (!conv || !currentUser) return;

    setCallStatus("calling");
    setCallType(type);
    setConvId(convId);

    // TODO ⑤: cần peerSocketId của người kia — lấy từ socket presence
    // getSocket()?.emit("call:invite", { conversationId: convId, callType: type });
  }, [conversations, currentUser, setCallStatus, setCallType, setConvId]);

  /* ─── Open chat from contacts ──────────────────────── */
  const handleOpenChat = useCallback((userId: string) => {
    // Tìm private conversation đã tồn tại
    const existing = conversations.find(
      (c) => c.type === "private" &&
        c.participants.some((p) => (p.user as User)?._id === userId)
    );
    if (existing) {
      setActiveId(existing._id);
      setTab("chat");
    } else {
      // TODO: tạo private conversation mới qua API nếu backend hỗ trợ
      // conversationApi.createPrivate(userId).then(conv => { ... })
      alert("Hãy nhắn tin trực tiếp trong tab Chat");
    }
  }, [conversations, setActiveId]);

  const activeConv = conversations.find((c) => c._id === activeId);

  /* ─── Loading screen ─────────────────────────────── */
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: "var(--color-bg)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-3xl flex items-center justify-center"
            style={{ background: "var(--color-brand)" }}>
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v7a2 2 0 01-2 2H9l-4 3v-3H4a2 2 0 01-2-2V5z"/>
            </svg>
          </div>
          <div className="flex gap-1.5">
            <span className="dot-1 w-2 h-2 rounded-full" style={{ background: "var(--color-brand)" }} />
            <span className="dot-2 w-2 h-2 rounded-full" style={{ background: "var(--color-brand)" }} />
            <span className="dot-3 w-2 h-2 rounded-full" style={{ background: "var(--color-brand)" }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        activeTab={tab}
        onTabChange={setTab}
        currentUser={currentUser}
        friendReqCount={friendReqCount}
      />

      {/* Chat tab */}
      {tab === "chat" && (
        <>
          <ConversationList
            conversations={conversations}
            activeId={activeId}
            currentUser={currentUser}
            onSelect={setActiveId}
            onCreateGroup={() => setShowCreate(true)}
          />
          <div className="flex flex-1 overflow-hidden" style={{ background: "var(--color-bg)" }}>
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
                    <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20"
                      style={{ color: "var(--color-brand)" }}>
                      <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v7a2 2 0 01-2 2H9l-4 3v-3H4a2 2 0 01-2-2V5z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-lg mb-1" style={{ color: "var(--color-ink)" }}>
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
        </>
      )}

      {/* Contacts tab */}
      {tab === "contacts" && currentUser && (
        <ContactsPage
          currentUser={currentUser}
          friends={friends}
          onOpenChat={handleOpenChat}
        />
      )}

      {/* Other tabs placeholder */}
      {(tab === "cloud" || tab === "files" || tab === "tasks") && (
        <div className="flex flex-1 items-center justify-center" style={{ background: "var(--color-bg)" }}>
          <div className="text-center">
            <p className="text-4xl mb-3">🚧</p>
            <p className="font-semibold" style={{ color: "var(--color-ink)" }}>Đang phát triển</p>
            <p className="text-sm mt-1" style={{ color: "var(--color-ink-4)" }}>Tính năng sắp ra mắt</p>
          </div>
        </div>
      )}

      {/* Overlays */}
      {showCreate && currentUser && (
        <CreateGroupModal
          friends={friends}
          onClose={() => setShowCreate(false)}
          onCreate={(id) => { setActiveId(id); setTab("chat"); }}
        />
      )}

      <VideoCallModal currentUser={currentUser!} />
    </div>
  );
}
