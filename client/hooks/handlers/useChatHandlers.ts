import { useEffect } from "react";
import { useMessageStore, useConversationStore } from "@/store";
import type { Socket } from "socket.io-client";

export function useChatHandlers(socket: Socket | null) {
  useEffect(() => {
    if (!socket) return;

    const msgStore = useMessageStore.getState();
    const conv = useConversationStore.getState();

    socket.on("message:new", (msg) => {
      msgStore.addMessage(msg);
      conv.bumpConversation(msg);
    });

    socket.on("message:reaction", ({ conversationId, messageId, reactions }) => {
      msgStore.updateReactions(conversationId, messageId, reactions);
    });

    socket.on("message:deleted", ({ conversationId, messageId, forAll }) => {
      if (forAll) msgStore.markDeleted(conversationId, messageId);
    });

    socket.on("message:seen", ({ conversationId, messageId, seenBy }) => {
      msgStore.markSeen(conversationId, messageId, seenBy);
    });

    socket.on("group:created", (newConv) => {
      conv.addConversation(newConv);
    });

    return () => {
      socket.off("message:new");
      socket.off("message:reaction");
      socket.off("message:deleted");
      socket.off("message:seen");
      socket.off("group:created");
    };
  }, [socket]);
}
