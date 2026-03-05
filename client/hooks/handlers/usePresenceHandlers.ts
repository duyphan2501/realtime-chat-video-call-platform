import { useEffect } from "react";
import { usePresenceStore } from "@/store";
import type { Socket } from "socket.io-client";

export function usePresenceHandlers(socket: Socket | null) {
  useEffect(() => {
    if (!socket) return;

    const presence = usePresenceStore.getState();

    socket.on("presence:online", ({ userId }) => presence.setOnline(userId, true));
    socket.on("presence:offline", ({ userId }) => presence.setOnline(userId, false));
    
    socket.on("typing:start", ({ conversationId, user }) => 
      presence.setTyping(conversationId, user)
    );
    
    socket.on("typing:stop", ({ conversationId, userId }) => 
      presence.clearTyping(conversationId, userId)
    );

    return () => {
      socket.off("presence:online");
      socket.off("presence:offline");
      socket.off("typing:start");
      socket.off("typing:stop");
    };
  }, [socket]);
}
