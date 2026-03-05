"use client";
import { useRef, useCallback, useEffect } from "react";
import { useSocketStore } from "@/store";

/**
 * Hook xử lý trạng thái "đang soạn thảo" (Typing)
 * @param conversationId ID của cuộc hội thoại hiện tại
 */
export function useTyping(conversationId: string | null) {
  const timer = useRef<NodeJS.Timeout | null>(null);
  const isActive = useRef(false);
  
  // Lấy socket từ store để đảm bảo tính reactive
  const socket = useSocketStore((s) => s.socket);

  const stopTyping = useCallback(() => {
    // 1. Xóa bộ đếm thời gian hiện tại
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    
    // 2. Chỉ gửi "typing:stop" nếu trước đó đang ở trạng thái active
    if (isActive.current && socket && conversationId) {
      socket.emit("typing:stop", { conversationId });
      isActive.current = false;
    }
  }, [conversationId, socket]);

  const startTyping = useCallback(() => {
    if (!socket || !conversationId) return;

    // 1. Nếu bắt đầu gõ (đang không active), gửi tín hiệu "typing:start"
    if (!isActive.current) {
      isActive.current = true;
      socket.emit("typing:start", { conversationId });
    }

    // 2. Refresh lại bộ đếm 2 giây
    if (timer.current) clearTimeout(timer.current);

    // 3. Sau 2 giây không gọi lại hàm này, coi như người dùng đã ngừng gõ
    timer.current = setTimeout(() => {
      stopTyping();
    }, 2000);
  }, [conversationId, socket, stopTyping]);

  // Cleanup: Nếu user chuyển sang chat với người khác hoặc đóng tab, 
  // phải báo cho bên kia biết là mình đã ngừng gõ.
  useEffect(() => {
    return () => {
      stopTyping();
    };
  }, [conversationId, stopTyping]);

  return { startTyping, stopTyping };
}
