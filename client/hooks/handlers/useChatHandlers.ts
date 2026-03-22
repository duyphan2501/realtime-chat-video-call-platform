import { useEffect } from "react";
import { useMessageStore, useConversationStore } from "@/store";
import type { Socket } from "socket.io-client";

export function useChatHandlers(socket: Socket | null) {
  useEffect(() => {
    if (!socket) return;

    const onMessageNew = (msg: any) => {
      console.log("new message: ", msg);
      useMessageStore.getState().addMessage(msg);
      useConversationStore.getState().bumpConversation(msg);
    };

    const onMessageReaction = ({
      conversationId,
      messageId,
      reactions,
    }: {
      conversationId: string;
      messageId: string;
      reactions: any;
    }) => {
      useMessageStore
        .getState()
        .updateReactions(conversationId, messageId, reactions);
    };

    const onMessageDeleted = ({
      conversationId,
      messageId,
      forAll,
    }: {
      conversationId: string;
      messageId: string;
      forAll: boolean;
    }) => {
      if (forAll)
        useMessageStore.getState().markDeleted(conversationId, messageId);
    };

    const onMessageSeen = ({
      conversationId,
      messageId,
      seenBy,
    }: {
      conversationId: string;
      messageId: string;
      seenBy: any;
    }) => {
      useMessageStore.getState().markSeen(conversationId, messageId, seenBy);
    };

    const onGroupCreated = (newConv: any) => {
      useConversationStore.getState().addConversation(newConv);
    };

    socket.on("message:new", onMessageNew);
    socket.on("message:reaction", onMessageReaction);
    socket.on("message:deleted", onMessageDeleted);
    socket.on("message:seen", onMessageSeen);
    socket.on("group:created", onGroupCreated);

    return () => {
      socket.off("message:new", onMessageNew);
      socket.off("message:reaction", onMessageReaction);
      socket.off("message:deleted", onMessageDeleted);
      socket.off("message:seen", onMessageSeen);
      socket.off("group:created", onGroupCreated);
    };
  }, [socket]);
}
