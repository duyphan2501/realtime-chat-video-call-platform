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
import { useShallow } from "zustand/shallow";
import DateDivider from "../DateDivider";
import { sameDay } from "@/utils/chat.utils";
import { Info, Phone, Search, Video } from "lucide-react";
import IconBtn from "../IconBtn";

interface Props {
  conversation: Conversation;
  currentUser: User;
  onStartCall: (type: "audio" | "video") => Promise<void>;
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
  const messages = useMessageStore(
    useShallow((s) => s.messages[conv._id] || []),
  );

  // Trong Component:
  const typingUsers = usePresenceStore(
    useShallow((s) => s.typingUsers[conv._id] || []),
  );
  const setMessages = useMessageStore((s) => s.setMessages);
  const addMessage = useMessageStore((s) => s.addMessage);

  /* ── Load initial messages ─────────────────────
     TODO ①: conversationApi.getMessages() → lưu vào store */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (messages && messages.length > 0) return;
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

  // /* ── Join socket room ──────────────────────────
  //    TODO ③: socket emit "room:join" phải khớp backend */
  // useEffect(() => {
  //   getSocket()?.emit("room:join", conv._id);
  //   return () => {
  //     getSocket()?.emit("room:leave", conv._id);
  //   };
  // }, [conv._id]);

  // /* ── Auto scroll to bottom ───────────────────── */
  // useEffect(() => {
  //   bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  // }, [messages.length]);

  // /* ── Mark seen ─────────────────────────────────
  //    TODO ③: emit socket khi mở conversation */
  // useEffect(() => {
  //   const last = messages[messages.length - 1];
  //   if (!last || last.sender._id === currentUser._id) return;
  //   // TODO ③: event name "message:seen"
  //   getSocket()?.emit("message:seen", {
  //     conversationId: conv._id,
  //     messageId: last._id,
  //   });
  // }, [conv._id, messages, currentUser._id]);

  // /* ── Infinite scroll ───────────────────────────
  //    TODO ④: load thêm trang khi scroll lên đầu */
  const handleScroll = useCallback(async () => {
    // const el = listRef.current;
    // if (!el || loadingMore || !hasMore) return;
    // if (el.scrollTop > 100) return;
    // setLoadingMore(true);
    // try {
    //   const nextPage = page + 1;
    //   const res = await conversationApi.getMessages(conv._id, nextPage, 30);
    //   const msgs: Message[] = res.messages ?? res.data ?? [];
    //   if (msgs.length === 0) {
    //     setHasMore(false);
    //     return;
    //   }
    //   msgs.forEach((msg) => {
    //     addMessage(msg);
    //   });
    //   setPage(nextPage);
    //   setHasMore(msgs.length === 30);
    // } catch {
    // } finally {
    //   setLoadingMore(false);
    // }
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
        useMessageStore.getState().addMessage(res.message ?? res);
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
        <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-gray-800">
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
              <p className="font-semibold text-sm text-white">{headerName}</p>
              <p className="text-xs" style={{ color: "var(--color-online)" }}>
                {isGroup ? `${memberCount} members` : "Online"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* TODO ⑤: gọi onStartCall → useWebRTC.startCall */}
            {!isGroup && (
              <>
                <IconBtn
                  title="Gọi thoại"
                  onClick={() => onStartCall("audio")}
                >
                  <Phone size={18} />
                </IconBtn>
                <IconBtn
                  title="Gọi video"
                  onClick={() => onStartCall("video")}
                >
                  <Video />
                </IconBtn>
              </>
            )}
            <IconBtn title="Tìm kiếm" onClick={() => {}}>
              <Search size={20} />
            </IconBtn>
            <IconBtn title="Thông tin" onClick={() => setShowInfo((v) => !v)}>
              <Info size={20} />
            </IconBtn>
          </div>
        </div>

        {/* ── Messages ── */}
        <div
          ref={listRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5"
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
