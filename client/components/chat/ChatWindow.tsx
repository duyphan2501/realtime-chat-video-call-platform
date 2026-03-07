/* ═══════════════════════════════════════════════════════════
   components/chat/ChatWindow.tsx

   TODO — backend:
   ① Load messages: conversationApi.getMessages()
   ② Send: conversationApi.sendMessage() + emit socket
   ③ Mark seen: emit socket "message:seen"
   ④ Load more (infinite scroll): pagination từ API
   ⑤ WebRTC call: startCall từ useWebRTC
   ═══════════════════════════════════════════════════════════ */
"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import type { Conversation, Message, User } from "@/types";
import {
  useConversationStore,
  useMessageStore,
  usePresenceStore,
} from "@/store";
import { conversationApi } from "@/lib/api";
import { getSocket } from "@/hooks";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import RightPanel from "./RightPanel";

interface Props {
  conversation: Conversation;
  currentUser: User;
  onStartCall: (convId: string, type: "audio" | "video") => void;
}

export default function ChatWindow({
  conversation: conv,
  currentUser,
  onStartCall,
}: Props) {
  const [showInfo, setShowInfo] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const messages = useMessageStore((s) => s.messages[conv._id] || []);
  const typingUsers = usePresenceStore((s) => s.typingUsers[conv._id] || []);
  const setMessages = useMessageStore((s) => s.setMessages);
  const addMessage = useMessageStore((s) => s.addMessage);

  /* ── Load initial messages ─────────────────────
     TODO ①: conversationApi.getMessages() → lưu vào store */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await conversationApi.getMessages(conv._id, 1, 30);
        if (!alive) return;
        // TODO ①: kiểm tra key response — "messages" hay "data"?
        const msgs: Message[] = res.messages ?? res.data ?? [];
        setMessages(conv._id, msgs);
        setHasMore(msgs.length === 30);
        setPage(1);
      } catch {}
    })();
    return () => {
      alive = false;
    };
  }, [conv._id, setMessages]);

  /* ── Join socket room ──────────────────────────
     TODO ③: socket emit "room:join" phải khớp backend */
  useEffect(() => {
    getSocket()?.emit("room:join", conv._id);
    return () => {
      getSocket()?.emit("room:leave", conv._id);
    };
  }, [conv._id]);

  /* ── Auto scroll to bottom ───────────────────── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  /* ── Mark seen ─────────────────────────────────
     TODO ③: emit socket khi mở conversation */
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.sender._id === currentUser._id) return;
    // TODO ③: event name "message:seen"
    getSocket()?.emit("message:seen", {
      conversationId: conv._id,
      messageId: last._id,
    });
  }, [conv._id, messages, currentUser._id]);

  /* ── Infinite scroll ───────────────────────────
     TODO ④: load thêm trang khi scroll lên đầu */
  const handleScroll = useCallback(async () => {
    const el = listRef.current;
    if (!el || loadingMore || !hasMore) return;
    if (el.scrollTop > 100) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await conversationApi.getMessages(conv._id, nextPage, 30);
      const msgs: Message[] = res.messages ?? res.data ?? [];
      if (msgs.length === 0) {
        setHasMore(false);
        return;
      }
      msgs.forEach((msg) => {
        addMessage(msg)
      }) 
      setPage(nextPage);
      setHasMore(msgs.length === 30);
    } catch {
    } finally {
      setLoadingMore(false);
    }
  }, [conv._id, hasMore, loadingMore, page, addMessage]);

  /* ── Send message ──────────────────────────────
     TODO ②: conversationApi.sendMessage() */
  const handleSend = useCallback(
    async (content: string, files: File[], replyTo?: string) => {
      try {
        const res = await conversationApi.sendMessage(
          conv._id,
          { content, replyTo },
          files,
        );
        // NOTE: socket "message:new" sẽ trigger addMessage trong store tự động
        // Chỉ add thủ công nếu backend không emit lại cho sender
        // useChatStore.getState().addMessage(res.message ?? res);
      } catch (err: any) {
        alert(err.message);
      }
    },
    [conv._id],
  );

  /* ── Header info ─────────────────────────────── */
  const isGroup = conv.type === "group";
  const other = conv.participants.find(
    (p) => (p.user as User)?._id !== currentUser._id,
  );
  const headerName = isGroup ? conv.name : (other?.user as User)?.name;
  const headerAvatar = isGroup ? conv.avatar : (other?.user as User)?.avatar;
  const memberCount = conv.participants.length;

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{
            background: "var(--color-surface)",
            borderBottom: "1px solid var(--color-s3)",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={
                  headerAvatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(headerName || "G")}&background=e3e8f0&color=0068FF&bold=true&size=40`
                }
                className="w-10 h-10 rounded-full object-cover"
                alt={headerName}
              />
              {!isGroup && (
                <span
                  className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white"
                  style={{ background: "var(--color-online)" }}
                />
              )}
            </div>
            <div>
              <p
                className="font-semibold text-sm"
                style={{ color: "var(--color-ink)" }}
              >
                {headerName}
              </p>
              <p className="text-xs" style={{ color: "var(--color-online)" }}>
                {isGroup ? `${memberCount} thành viên` : "Đang hoạt động"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* TODO ⑤: gọi onStartCall → useWebRTC.startCall */}
            {!isGroup && (
              <>
                <HeaderBtn
                  title="Gọi thoại"
                  onClick={() => onStartCall(conv._id, "audio")}
                >
                  <PhoneIcon className="w-5 h-5" />
                </HeaderBtn>
                <HeaderBtn
                  title="Gọi video"
                  onClick={() => onStartCall(conv._id, "video")}
                >
                  <VideoIcon className="w-5 h-5" />
                </HeaderBtn>
              </>
            )}
            <HeaderBtn title="Tìm kiếm" onClick={() => {}}>
              <SearchIcon className="w-5 h-5" />
            </HeaderBtn>
            <HeaderBtn
              title="Thông tin"
              onClick={() => setShowInfo((v) => !v)}
              active={showInfo}
            >
              <InfoIcon className="w-5 h-5" />
            </HeaderBtn>
          </div>
        </div>

        {/* ── Messages ── */}
        <div
          ref={listRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5"
          style={{ background: "var(--color-bg)" }}
        >
          {loadingMore && (
            <div className="flex justify-center py-2">
              <div
                className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                style={{
                  borderColor: "var(--color-brand)",
                  borderTopColor: "transparent",
                }}
              />
            </div>
          )}

          {messages.map((msg, i) => {
            const isMe = msg.sender._id === currentUser._id;
            const prev = messages[i - 1];
            const isSameSender = prev && prev.sender._id === msg.sender._id;
            const showDate = !prev || !sameDay(prev.createdAt, msg.createdAt);

            return (
              <div key={msg._id}>
                {showDate && <DateDivider iso={msg.createdAt} />}
                <MessageBubble
                  message={msg}
                  isMe={isMe}
                  showAvatar={!isSameSender}
                  convId={conv._id}
                  isGroup={isGroup}
                />
              </div>
            );
          })}

          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                <img
                  src={typingUsers[0].avatar || ""}
                  className="w-full h-full object-cover"
                  alt=""
                />
              </div>
              <div
                className="flex items-center gap-1 px-4 py-3 rounded-2xl"
                style={{ background: "var(--color-surface)" }}
              >
                <span
                  className="dot-1 w-1.5 h-1.5 rounded-full inline-block"
                  style={{ background: "var(--color-ink-4)" }}
                />
                <span
                  className="dot-2 w-1.5 h-1.5 rounded-full inline-block"
                  style={{ background: "var(--color-ink-4)" }}
                />
                <span
                  className="dot-3 w-1.5 h-1.5 rounded-full inline-block"
                  style={{ background: "var(--color-ink-4)" }}
                />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── Input ── */}
        <ChatInput convId={conv._id} onSend={handleSend} />
      </div>

      {/* ── Right panel ── */}
      {showInfo && (
        <RightPanel
          conversation={conv}
          currentUser={currentUser}
          onClose={() => setShowInfo(false)}
        />
      )}
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────── */
function sameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function DateDivider({ iso }: { iso: string }) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const isYesterday =
    d.toDateString() === new Date(now.getTime() - 86400000).toDateString();
  const label = isToday
    ? "Hôm nay"
    : isYesterday
      ? "Hôm qua"
      : d.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });

  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px" style={{ background: "var(--color-s4)" }} />
      <span
        className="text-[11px] font-medium px-2"
        style={{ color: "var(--color-ink-4)" }}
      >
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: "var(--color-s4)" }} />
    </div>
  );
}

function HeaderBtn({
  children,
  title,
  onClick,
  active = false,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
      style={{
        background: active ? "var(--color-brand-light)" : "transparent",
        color: active ? "var(--color-brand)" : "var(--color-ink-3)",
      }}
      onMouseEnter={(e) => {
        if (!active)
          (e.currentTarget as HTMLElement).style.background = "var(--color-s2)";
      }}
      onMouseLeave={(e) => {
        if (!active)
          (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      {children}
    </button>
  );
}

/* ── Icons ───────────────────────────────────────── */
const PhoneIcon = ({ className }: { className: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
    />
  </svg>
);
const VideoIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm12.553 1.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
  </svg>
);
const SearchIcon = ({ className }: { className: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <circle cx="11" cy="11" r="8" />
    <path strokeLinecap="round" d="m21 21-4.35-4.35" />
  </svg>
);
const InfoIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
      clipRule="evenodd"
    />
  </svg>
);
