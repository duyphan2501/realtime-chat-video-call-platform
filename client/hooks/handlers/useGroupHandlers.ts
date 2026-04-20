"use client";
import { useConversationStore, useFriendStore } from "@/store";
import { useAuthStore } from "@/store";
import { useEffect } from "react";

export function useGroupHandlers(socket: any) {
  const { user } = useAuthStore();
  const { updateConversation, addConversation, removeConversation } =
    useConversationStore();
  const { removeFriend } = useFriendStore();

  useEffect(() => {
    if (!socket) return;
    socket?.on("group:memberAdded", (data: any) => {
      console.log("group:memberAdded", data);
      // Update conversation participants
      updateConversation(data.conversation._id, data.conversation);
    });

    socket?.on("group:memberRemoved", (data: any) => {
      console.log("group:memberRemoved", data);
      // Update conversation participants
      updateConversation(data.conversation._id, data.conversation);
      removeFriend(data.friendId);
    });

    socket?.on("group:removedFromGroup", (data: any) => {
      console.log("group:removedFromGroup", data);
      // Remove conversation from user's list
      removeConversation(data.conversationId);
    });

    socket?.on("group:memberLeft", (data: any) => {
      console.log("group:memberLeft", data);
      // Update conversation participants
      updateConversation(data.conversation._id, data.conversation);
    });

    socket?.on("group:memberPromoted", (data: any) => {
      console.log("group:memberPromoted", data);
      // Update conversation participants
      updateConversation(data.conversation._id, data.conversation);
    });

    socket?.on("group:adminRemoved", (data: any) => {
      console.log("group:adminRemoved", data);
      // Update conversation participants
      updateConversation(data.conversation._id, data.conversation);
    });

    socket?.on("group:updated", (data: any) => {
      console.log("group:updated", data);
      // Update conversation with only name and avatar to preserve lastMessage
      updateConversation(data._id, {
        name: data.name,
        avatar: data.avatar,
        participants: data.participants,
      });
    });

    socket?.on("group:disbanded", (data: any) => {
      console.log("group:disbanded", data);
      // Remove conversation from list
      removeConversation(data.conversationId);
    });

    socket?.on("group:addedToGroup", (data: any) => {
      console.log("group:addedToGroup", data);
      // Add conversation to user's list
      addConversation(data);
    });

    socket?.on("group:leftGroup", (data: any) => {
      console.log("group:leftGroup", data);
      // Remove conversation from user's list
      removeConversation(data.conversationId);
    });
    return () => {
      socket.off("group:memberAdded");
      socket.off("group:memberRemoved");
      socket.off("group:memberLeft");
      socket.off("group:memberPromoted");
      socket.off("group:adminRemoved");
      socket.off("group:updated");
      socket.off("group:disbanded");
      socket.off("group:addedToGroup");
      socket.off("group:leftGroup");
    };
  }, [socket]);
}
