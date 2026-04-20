"use client";
import { useSocketStore } from "@/store";
import { useChatHandlers } from "./handlers/useChatHandlers";
import { usePresenceHandlers } from "./handlers/usePresenceHandlers";
import { useCallHandlers } from "./handlers/useCallHandlers";
import { useFriendHandlers } from "./handlers/useFriendHandlers";
import { useGroupHandlers } from "./handlers/useGroupHandlers";

export function useSocketEvents() {
  const socket = useSocketStore((s) => s.socket);

  // Kích hoạt các bộ lắng nghe theo từng module
  useChatHandlers(socket);
  usePresenceHandlers(socket);
  useCallHandlers(socket);
  useFriendHandlers(socket);
  useGroupHandlers(socket);

  // Bạn có thể thêm các module khác như Notificatio tại đây
}
