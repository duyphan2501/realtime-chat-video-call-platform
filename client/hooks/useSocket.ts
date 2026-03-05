/* ═══════════════════════════════════════════════════════════
   hooks/useSocket.ts
   Khởi tạo Socket.io và lắng nghe tất cả sự kiện real-time.

   TODO — những chỗ cần bạn kiểm tra:
   ① NEXT_PUBLIC_SOCKET_URL trong .env.local
   ② Tên các event phải khớp với backend (server emit gì thì đây listen cái đó)
   ③ Shape data của từng event phải khớp (ví dụ: msg.conversation là string id)
   ═══════════════════════════════════════════════════════════ */
"use client";
import { useCallback } from "react";
import { io, type Socket } from "socket.io-client";
import { useSocketStore, useChatStore, useCallStore } from "@/store";

let _socket: Socket | null = null;

export function useSocket() {
  const { setConnected, setSocket } = useSocketStore();

  const init = useCallback((token: string) => {
    if (_socket?.connected) return _socket;

    // TODO ①: đổi URL nếu backend chạy cổng khác
    _socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000", {
      auth:          { token },
      transports:    ["websocket"],
      reconnection:  true,
      reconnectionAttempts: 5,
    });

    _socket.on("connect",    () => { setConnected(true);  setSocket(_socket!); });
    _socket.on("disconnect", () => { setConnected(false); });

    /* ── Messaging ── TODO ②: kiểm tra tên event ── */
    _socket.on("message:new",      (msg)             => useChatStore.getState().addMessage(msg));
    _socket.on("message:reaction", ({ messageId, reactions }) =>
      useChatStore.getState().updateReactions(messageId, reactions));
    _socket.on("message:deleted",  ({ messageId, forAll }) =>
      forAll && useChatStore.getState().markDeleted(messageId));
    _socket.on("message:seen",     ({ conversationId, messageId, seenBy }) =>
      useChatStore.getState().markSeen(conversationId, messageId, seenBy));

    /* ── Typing ── */
    _socket.on("typing:start", ({ conversationId, user }) =>
      useChatStore.getState().setTyping(conversationId, user));
    _socket.on("typing:stop",  ({ conversationId, userId }) =>
      useChatStore.getState().clearTyping(conversationId, userId));

    /* ── Presence ── */
    _socket.on("presence:online",  ({ userId }) => useChatStore.getState().setOnline(userId, true));
    _socket.on("presence:offline", ({ userId }) => useChatStore.getState().setOnline(userId, false));

    /* ── Friends ── */
    _socket.on("friend:request_received", ({ from }) =>
      useChatStore.getState().addFriendRequest(from));

    /* ── Group ── */
    _socket.on("group:created", (conv) => useChatStore.getState().addConversation(conv));

    /* ── Calls ── TODO ②: tên event gọi video phải khớp backend ── */
    const cs = useCallStore.getState();
    _socket.on("call:incoming",        (data)              => { cs.setIncoming(data); cs.setStatus("ringing"); });
    _socket.on("call:accepted",        ({ calleeSocketId })=> { cs.setPeer(calleeSocketId); cs.setStatus("connected"); });
    _socket.on("call:rejected",        ()                  => { cs.setStatus("idle"); cs.setIncoming(null); });
    _socket.on("call:ended",           ()                  => cs.setStatus("ended"));
    _socket.on("call:user_unavailable",()                  => cs.setStatus("idle"));

    return _socket;
  }, [setConnected, setSocket]);

  const disconnect = useCallback(() => {
    _socket?.disconnect();
    _socket = null;
    setConnected(false);
    setSocket(null);
  }, [setConnected, setSocket]);

  return { init, disconnect };
}

export const getSocket = () => _socket;
