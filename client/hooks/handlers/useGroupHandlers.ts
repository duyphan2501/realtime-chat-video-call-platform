import { useEffect } from "react";
import type { Socket } from "socket.io-client";

import { useConversationStore, useFriendStore } from "@/store";
import type { Conversation, Message } from "@/types";

type GroupEventPayload = {
  conversation: Conversation;
  systemMessage?: Message;
};

type RemovedFromGroupPayload = {
  conversationId: string;
  friendId?: string;
};

type GroupMemberRemovedPayload = GroupEventPayload & {
  removedUserId: string;
  friendId?: string;
};

type GroupRolePayload = GroupEventPayload & {
  userId: string;
  role?: string;
};

type GroupDisbandedPayload = {
  conversationId: string;
};

export function useGroupHandlers(socket: Socket | null) {
  useEffect(() => {
    if (!socket) return;

    const onMemberAdded = (data: GroupEventPayload) => {
      useConversationStore
        .getState()
        .updateConversation(data.conversation._id, data.conversation);
    };

    const onMemberRemoved = (data: GroupMemberRemovedPayload) => {
      useConversationStore
        .getState()
        .updateConversation(data.conversation._id, data.conversation);
      if (data.friendId) useFriendStore.getState().removeFriend(data.friendId);
    };

    const onRemovedFromGroup = (data: RemovedFromGroupPayload) => {
      useConversationStore.getState().removeConversation(data.conversationId);
    };

    const onMemberLeft = (data: GroupEventPayload) => {
      useConversationStore
        .getState()
        .updateConversation(data.conversation._id, data.conversation);
    };

    const onMemberPromoted = (data: GroupRolePayload) => {
      useConversationStore
        .getState()
        .updateConversation(data.conversation._id, data.conversation);
    };

    const onAdminRemoved = (data: GroupEventPayload) => {
      useConversationStore
        .getState()
        .updateConversation(data.conversation._id, data.conversation);
    };

    const onGroupUpdated = (data: Conversation) => {
      useConversationStore.getState().updateConversation(data._id, {
        name: data.name,
        avatar: data.avatar,
        participants: data.participants,
      });
    };

    const onGroupDisbanded = (data: GroupDisbandedPayload) => {
      useConversationStore.getState().removeConversation(data.conversationId);
    };

    const onAddedToGroup = (data: Conversation) => {
      useConversationStore.getState().addConversation(data);
    };

    const onLeftGroup = (data: RemovedFromGroupPayload) => {
      useConversationStore.getState().removeConversation(data.conversationId);
    };

    socket.on("group:memberAdded", onMemberAdded);
    socket.on("group:memberRemoved", onMemberRemoved);
    socket.on("group:removedFromGroup", onRemovedFromGroup);
    socket.on("group:memberLeft", onMemberLeft);
    socket.on("group:memberPromoted", onMemberPromoted);
    socket.on("group:adminRemoved", onAdminRemoved);
    socket.on("group:updated", onGroupUpdated);
    socket.on("group:disbanded", onGroupDisbanded);
    socket.on("group:addedToGroup", onAddedToGroup);
    socket.on("group:leftGroup", onLeftGroup);

    return () => {
      socket.off("group:memberAdded", onMemberAdded);
      socket.off("group:memberRemoved", onMemberRemoved);
      socket.off("group:removedFromGroup", onRemovedFromGroup);
      socket.off("group:memberLeft", onMemberLeft);
      socket.off("group:memberPromoted", onMemberPromoted);
      socket.off("group:adminRemoved", onAdminRemoved);
      socket.off("group:updated", onGroupUpdated);
      socket.off("group:disbanded", onGroupDisbanded);
      socket.off("group:addedToGroup", onAddedToGroup);
      socket.off("group:leftGroup", onLeftGroup);
    };
  }, [socket]);
}
