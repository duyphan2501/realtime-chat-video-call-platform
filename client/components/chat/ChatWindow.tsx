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
import {
  fmtTime,
  getOtherId,
  getTypingText,
  sameDay,
} from "@/utils/chat.utils";
import { Info, Phone, Search, Video } from "lucide-react";
import IconBtn from "../IconBtn";
import { useConversationService, useMessageService } from "@/services";
import RightPanel from "./RightPanel";
import { getAvatar, getUserName } from "@/utils/user.utils";
import { useChatScroll } from "@/hooks/useChatScroll";

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
  const [error, setError] = useState<string | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

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

  const { containerRef, scrollToBottom, disableAutoScrollRef, isStickyRef } =
    useChatScroll([messages, conv._id]);

  // 2. Logic hiển thị nút Scroll to Bottom (Tối ưu performance)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => {
      // Khoảng cách > 300px thì mới hiện nút để tránh gây rối mắt
      const isFarFromBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight > 300;
      setShowScrollBtn(isFarFromBottom);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // 3. Reset trạng thái khi đổi hội thoại
  useEffect(() => {
    fetchMessages(conv._id);
    // Khi đổi chat, ép nhảy xuống đáy ngay lập tức không đợi render
    scrollToBottom("auto");
  }, [conv._id]);

  const handleScroll = useCallback(async () => {
    const el = containerRef.current;
    if (!el || !hasMore || isLoading) return;

    if (el.scrollTop < 80) {
      // Khóa auto scroll để giữ vị trí hiện tại
      disableAutoScrollRef.current = true;
      const prevHeight = el.scrollHeight;

      await fetchMessages(conv._id, true);

      // Tính toán lại vị trí để không bị "nhảy" màn hình sau khi prepend tin nhắn
      requestAnimationFrame(() => {
        if (el) {
          el.scrollTop = el.scrollHeight - prevHeight;
          // Mở khóa sau khi DOM đã ổn định
          setTimeout(() => (disableAutoScrollRef.current = false), 150);
        }
      });
    }
  }, [conv._id, hasMore, isLoading]);

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
      try {
        await sendMessage({
          conversationId: conv._id,
          content,
          files,
          tempId,
        });
      } catch (error: any) {
        setError(error.message || "Failed to send message");
      }
    },
    [conv._id],
  );

  /* ── Header info ─────────────────────────────── */
  const isGroup = conv.type === "group";
  const other = isGroup ? null : conv.otherUser;
  const headerName = isGroup ? conv.name || "Group Chat" : getUserName(other);
  const headerAvatar = isGroup ? conv.avatar : other?.avatar;
  const memberCount = conv.participants?.length || 0;

  const otherUserId = other?._id;
  const isOtherOnlineRaw = usePresenceStore((s) =>
    s.isOnline(otherUserId || ""),
  );
  const lastActive = usePresenceStore(
    (s) => s.onlineUsers[otherUserId || ""]?.lastActive,
  );
  const isOtherOnline = !isGroup && isOtherOnlineRaw;

  return (
    <div className="flex flex-1 overflow-hidden relative">
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={getAvatar({
                  name: headerName || "User",
                  avatar: headerAvatar,
                })}
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
                    : `Last active ${fmtTime(lastActive || other?.lastActive)}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {!isGroup && (
              <>
                {/* <IconBtn title="Gọi thoại" onClick={() => onStartCall("audio")}>
                  <Phone size={18} />
                </IconBtn> */}
                <IconBtn
                  title="Video Call"
                  onClick={() => onStartCall("video")}
                >
                  <Video />
                </IconBtn>
              </>
            )}
            {/* <IconBtn title="Tìm kiếm" onClick={() => {}}>
              <Search size={20} />
            </IconBtn> */}
            <IconBtn
              title="Information"
              onClick={() => setRightPanelOpen((v) => !v)}
            >
              <Info size={20} />
            </IconBtn>
          </div>
        </div>

        {/* ── Messages ── */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 scroll-smooth"
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

          {messages.filter(Boolean).map((msg, i, visibleMessages) => {
            const senderId = msg.sender?._id || "";
            const isMe = senderId === currentUser._id;
            const prev = visibleMessages[i - 1];
            const isSameSenderAsPrev =
              prev &&
              prev.type !== "system" &&
              prev?.sender?._id === senderId;
            const shouldShowAvatar = !isMe && !isSameSenderAsPrev;
            const showDate = !prev || !sameDay(prev.createdAt, msg.createdAt);
            const isLast = i === messages.length - 1;
            return (
              <div key={msg.tempId || msg._id}>
                {showDate && <DateDivider iso={msg.createdAt} />}
                <MessageBubble
                  message={msg}
                  isMe={isMe}
                  showAvatar={shouldShowAvatar}
                  convId={conv._id}
                  currentUserId={sender?._id || ""}
                  isLast={isLast}
                  isGroup={isGroup}
                  onStartCall={onStartCall}
                />
              </div>
            );
          })}

          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <div className="flex flex-col gap-1 mt-2 ml-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  {/* Chữ text nhỏ phía dưới */}
                  <span className="text-[11px] text-gray-200 ml-1 italic animate-pulse">
                    {getTypingText(typingUsers)}
                  </span>
                  {/* Bubble hiệu ứng 3 chấm */}
                  <div className="flex items-center gap-1">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {showScrollBtn && (
          <button
            onClick={() => scrollToBottom("smooth")}
            className="absolute bottom-24 right-8 bg-blue-600 hover:bg-blue-700 text-white w-10 h-10 flex items-center justify-center rounded-full shadow-lg transition-all animate-bounce cursor-pointer"
            title="Scoll to Bottom"
          >
            ↓
          </button>
        )}

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
