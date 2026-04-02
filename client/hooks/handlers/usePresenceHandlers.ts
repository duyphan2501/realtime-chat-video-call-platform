import { useEffect } from "react";
import { useConversationStore, usePresenceStore } from "@/store";
import type { Socket } from "socket.io-client";

import { TypingUser } from "@/types";

export function usePresenceHandlers(socket: Socket | null) {
  useEffect(() => {
    if (!socket) return;

    const onOnline = ({ userId }: { userId: string }) =>
      usePresenceStore.getState().setOnline(userId, true);

    const onOffline = ({
      userId,
      timestamp,
    }: {
      userId: string;
      timestamp: Date;
    }) => {
      usePresenceStore.getState().setOnline(userId, false, timestamp);
    };

    const onTypingStart = ({
      conversationId,
      userId,
    }: {
      conversationId: string;
      userId: string;
    }) => {
      const user = useConversationStore
        .getState()
        .getParticipantUser(conversationId, userId);
      if (user) usePresenceStore.getState().setTyping(conversationId, user);
    };

    const onTypingStop = ({
      conversationId,
      userId,
    }: {
      conversationId: string;
      userId: string;
    }) => usePresenceStore.getState().clearTyping(conversationId, userId);

    const onOnlineUsers = ({ userIds }: { userIds: string[] }) =>
      usePresenceStore.getState().setOnlineUsers(userIds);

    socket.on("presence:online", onOnline);
    socket.on("presence:offline", onOffline);
    socket.on("presence:online_users", onOnlineUsers);
    socket.on("typing:start", onTypingStart);
    socket.on("typing:stop", onTypingStop);

    return () => {
      socket.off("presence:online", onOnline);
      socket.off("presence:offline", onOffline);
      socket.off("presence:online_users", onOnlineUsers);
      socket.off("typing:start", onTypingStart);
      socket.off("typing:stop", onTypingStop);
    };
  }, [socket]);
}
