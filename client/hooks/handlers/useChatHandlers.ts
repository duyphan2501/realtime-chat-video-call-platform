import { useEffect } from "react";
import { useMessageStore, useConversationStore, useAuthStore } from "@/store";
import type { Conversation, Message, Reaction } from "@/types";
import type { Socket } from "socket.io-client";

type MessageNewPayload = {
  newMessage?: Message;
  unreadCount?: number;
};

export function useChatHandlers(socket: Socket | null) {
  useEffect(() => {
    if (!socket) return;

    const onMessageNew = (data: MessageNewPayload) => {
      if (!data?.newMessage?._id) return;
      const { addMessage } = useMessageStore.getState();
      addMessage(data.newMessage);
      useConversationStore
        .getState()
        .bumpConversation(data.newMessage, data.unreadCount);

      const isMe =
        useAuthStore.getState().user?._id === data.newMessage.sender?._id;

      if (data.newMessage.type === "system" || isMe) return;
      if (!data.newMessage.sender?._id) return;
      socket.emit("message:received", {
        messageId: data.newMessage._id,
        senderId: data.newMessage.sender?._id,
        conversationId: data.newMessage.conversation,
        tempId: data.newMessage.tempId,
      });
    };

    const onMessageReaction = ({
      conversationId,
      messageId,
      reactions,
    }: {
      conversationId: string;
      messageId: string;
      reactions: Reaction[];
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
      userId,
      lastRead,
    }: {
      conversationId: string;
      userId: string;
      lastRead: Date;
    }) => {
      useConversationStore
        .getState()
        .updateSeen(conversationId, userId, lastRead);
    };

    const onNewConversation = (newConv: Conversation) => {
      useConversationStore.getState().addConversation(newConv);
    };

    const onConversationRemoved = ({
      conversationId,
    }: {
      conversationId: string;
    }) => {
      useConversationStore.getState().removeConversation(conversationId);
      useMessageStore.getState().clearCache(conversationId);
    };

    const onMessageReceived = ({
      messageId,
      conversationId,
      tempId,
    }: {
      messageId: string;
      conversationId: string;
      tempId: string;
    }) => {
      useMessageStore
        .getState()
        .markAsDelivered(messageId, conversationId, tempId);
    };

    socket.on("message:new", onMessageNew);
    socket.on("message:reaction", onMessageReaction);
    socket.on("message:deleted", onMessageDeleted);
    socket.on("message:seen", onMessageSeen);
    socket.on("message:received", onMessageReceived);
    socket.on("conversation:new", onNewConversation);
    socket.on("conversation:removed", onConversationRemoved);

    return () => {
      socket.off("message:new", onMessageNew);
      socket.off("message:reaction", onMessageReaction);
      socket.off("message:deleted", onMessageDeleted);
      socket.off("message:seen", onMessageSeen);
      socket.off("message:received", onMessageReceived);
      socket.off("conversation:new", onNewConversation);
      socket.off("conversation:removed", onConversationRemoved);
    };
  }, [socket]);
}
