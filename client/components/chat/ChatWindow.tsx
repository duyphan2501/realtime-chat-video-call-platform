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
  useAuthStore,
  useConversationStore,
  useMessageStore,
  usePresenceStore,
} from "@/store";
import { getSocket } from "@/hooks";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import { useShallow } from "zustand/shallow";
import DateDivider from "../DateDivider";
import { fmtTime, getOtherId, sameDay } from "@/utils/chat.utils";
import { Info, Phone, Search, Video } from "lucide-react";
import IconBtn from "../IconBtn";
import { useConversationService, useMessageService } from "@/services";
import RightPanel from "./RightPanel";

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
  const [isRightPanelOpen, setRightPanelOpen] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // "force" = mới mở conv → scroll instant, không check vị trí
  // "smooth" = vừa gửi / nhận tin khi đang ở cuối → scroll mượt
  // "none"   = user đang kéo lên đọc tin cũ → không scroll
  const scrollIntent = useRef<"force" | "smooth" | "none">("force");

  const messages = useMessageStore(
    useShallow((s) => s.messages[conv._id] || []),
  );
  const hasMore = useMessageStore((s) => s.meta[conv._id]?.hasMore || false);
  const { fetchMessages, isLoading, isSending, sendMessage } =
    useMessageService();

  const typingUsers = usePresenceStore(
    useShallow((s) => s.typingUsers[conv._id] || []),
  );
  const sender = useAuthStore((s) => s.user);

  /* ── Helpers ─────────────────────────────────── */
  const isAtBottom = () => {
    const el = messagesContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  };

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  };

  /* ── ResizeObserver + MutationObserver ───────────
     Thay vì dùng rAF hay setTimeout (không đáng tin
     với ảnh async), dùng ResizeObserver để scroll
     đúng lúc container/ảnh thực sự thay đổi kích thước.

     Flow:
     1. messages thay đổi → useEffect set scrollIntent
     2. Bubble/ảnh render → container cao lên
     3. ResizeObserver bắt được → gọi scrollToBottom
        với behavior từ scrollIntent                    */
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;

    const resizeObserver = new ResizeObserver(() => {
      const intent = scrollIntent.current;
      if (intent === "force") {
        scrollToBottom("auto");
      } else if (intent === "smooth") {
        scrollToBottom("smooth");
        // Reset về none sau khi scroll 1 lần để không
        // tiếp tục kéo xuống khi user đang kéo lên đọc tin cũ
        scrollIntent.current = "none";
      }
    });

    // Observe container (bubble text mới → container cao lên)
    resizeObserver.observe(el);

    // MutationObserver để observe ảnh được thêm vào sau
    // khi ảnh load xong → kích thước tăng → ResizeObserver bắt
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        m.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            node
              .querySelectorAll("img")
              .forEach((img) => resizeObserver.observe(img));
          }
        });
      });
    });
    mutationObserver.observe(el, { childList: true, subtree: true });

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  /* ── Reset intent khi đổi conversation ── */
  useEffect(() => {
    scrollIntent.current = "force";
  }, [conv._id]);

  /* ── Load messages ───────────────────────────── */
  useEffect(() => {
    fetchMessages(conv._id);
  }, [conv._id]);

  /* ── Join socket room ────────────────────────── */
  useEffect(() => {
    getSocket()?.emit("join_conversation", conv._id);
    return () => {
      getSocket()?.emit("leave_conversation", conv._id);
    };
  }, [conv._id]);

  /* ── Set scroll intent khi messages thay đổi ────
     Observer sẽ thực thi scroll, effect này chỉ
     quyết định intent (force / smooth / none)       */
  useEffect(() => {
    if (!messages.length) return;

    const lastMsg = messages[messages.length - 1];
    const isMine = lastMsg.sender._id === currentUser._id;

    if (scrollIntent.current === "force") {
      // Đang force (mới mở conv) → giữ nguyên, observer lo
    } else if (isMine) {
      scrollToBottom("smooth");
      scrollIntent.current = "none";
    } else if (isAtBottom()) {
      // Tin người khác, đang ở cuối → scroll xuống
      scrollIntent.current = "smooth";
    } else {
      // Tin người khác, đang kéo lên đọc → không làm gì
      scrollIntent.current = "none";
    }
  }, [messages]);
  const { markAsRead } = useConversationService();

  const handleMarkAsRead = () => {
    if (conv._id) {
      markAsRead(conv._id);
    }
  };

  useEffect(() => {
    handleMarkAsRead();
  }, [conv._id, messages, currentUser._id]);

  /* ── Mark seen ───────────────────────────────── */
  useEffect(() => {
    window.addEventListener("focus", handleMarkAsRead);
    return () => window.removeEventListener("focus", handleMarkAsRead);
  }, [conv._id]);

  /* ── Infinite scroll ─────────────────────────── */
  const handleScroll = useCallback(async () => {
    const el = messagesContainerRef.current;
    if (!el || !hasMore || isLoading) return;
    if (el.scrollTop < 80) {
      const prevHeight = el.scrollHeight;
      await fetchMessages(conv._id, true);
      // Giữ nguyên vị trí scroll sau khi prepend tin cũ
      el.scrollTop = el.scrollHeight - prevHeight;
    }
  }, [conv._id, hasMore, isLoading]);

  /* ── Send message ────────────────────────────── */
  const handleSend = useCallback(
    async (content: string, files: File[], replyTo?: string) => {
      const { addMessage } = useMessageStore.getState();
      const tempId = `temp-${Date.now()}`;
      const hasDocuments = files.some((f) => !f.type.startsWith("image/"));

      const optimisticMsg = {
        _id: tempId,
        conversation: conv._id,
        tempId,
        sender: sender,
        content,
        type: hasDocuments ? "file" : files.length > 0 ? "image" : "text",
        attachments: files.map((f) => ({
          url: URL.createObjectURL(f),
          name: f.name,
          type: f.type,
          size: f.size,
          format: f.name.split(".").pop() ?? "",
        })),
        status: "sending",
        isDelivered: false,
        replyTo,
        createdAt: new Date().toISOString(),
      };

      addMessage(optimisticMsg as any);
      scrollIntent.current = "smooth";

      await sendMessage({
        conversationId: conv._id,
        content,
        files,
        tempId,
      });
    },
    [conv._id],
  );

  /* ── Header info ─────────────────────────────── */
  const isGroup = conv.type === "group";
  const other = isGroup ? null : conv.otherUser;
  const headerName = isGroup ? conv.name : other?.name;
  const headerAvatar = isGroup ? conv.avatar : other?.avatar;
  const memberCount = conv.participants.length;

  const otherUserId = other?._id;
  const isOtherOnline =
    !isGroup && usePresenceStore((s) => s.isOnline(otherUserId || ""));

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
              {!isGroup && isOtherOnline && (
                <span
                  className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white"
                  style={{ background: "var(--color-online)" }}
                />
              )}
            </div>
            <div>
              <p className="font-semibold text-sm text-white">{headerName}</p>
              <p
                className="text-xs"
                style={{
                  color: isOtherOnline ? "var(--color-online)" : "gray",
                }}
              >
                {isGroup
                  ? `${memberCount} members`
                  : isOtherOnline
                    ? "Online"
                    : `Last active ${fmtTime(usePresenceStore.getState().getLastActive(otherUserId || "") || other?.lastActive)}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {!isGroup && (
              <>
                <IconBtn title="Gọi thoại" onClick={() => onStartCall("audio")}>
                  <Phone size={18} />
                </IconBtn>
                <IconBtn title="Gọi video" onClick={() => onStartCall("video")}>
                  <Video />
                </IconBtn>
              </>
            )}
            <IconBtn title="Tìm kiếm" onClick={() => {}}>
              <Search size={20} />
            </IconBtn>
            <IconBtn
              title="Thông tin"
              onClick={() => setRightPanelOpen((v) => !v)}
            >
              <Info size={20} />
            </IconBtn>
          </div>
        </div>

        {/* ── Messages ── */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5"
        >
          {isLoading && (
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
            const isSameSender = prev?.sender._id === msg.sender._id;
            const showDate = !prev || !sameDay(prev.createdAt, msg.createdAt);
            const isLast = i === messages.length - 1;
            return (
              <div key={msg.tempId || msg._id}>
                {showDate && <DateDivider iso={msg.createdAt} />}
                <MessageBubble
                  message={msg}
                  isMe={isMe}
                  showAvatar={!isSameSender}
                  convId={conv._id}
                  currentUserId={sender?._id || ""}
                  isLast={isLast}
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
        </div>

        {/* ── Input ── */}
        <ChatInput convId={conv._id} onSend={handleSend} />
      </div>

      {/* ── Right panel ── */}
      {isRightPanelOpen && (
        <RightPanel
          conversationId={conv._id}
          onClose={() => setRightPanelOpen(false)}
        />
      )}
    </div>
  );
}
