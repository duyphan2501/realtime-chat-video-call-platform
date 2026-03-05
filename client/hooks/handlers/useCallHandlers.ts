import { useEffect } from "react";
import { useCallStore } from "@/store";
import type { Socket } from "socket.io-client";

export function useCallHandlers(socket: Socket | null) {
  useEffect(() => {
    if (!socket) return;

    const call = useCallStore.getState();

    socket.on("call:incoming", (data) => {
      call.setIncoming(data);
      call.setStatus("ringing");
    });

    socket.on("call:rejected", () => {
      call.reset();
    });

    socket.on("call:ended", () => {
      call.setStatus("ended");
      // Delay 2 giây để UI hiển thị trạng thái "Cuộc gọi kết thúc" trước khi biến mất
      setTimeout(() => call.reset(), 2000);
    });

    // Các sự kiện hỗ trợ WebRTC (nếu cần xử lý global)
    socket.on("call:user_busy", () => {
      call.setStatus("idle");
      // Có thể thêm thông báo toast tại đây
    });

    return () => {
      socket.off("call:incoming");
      socket.off("call:rejected");
      socket.off("call:ended");
      socket.off("call:user_busy");
    };
  }, [socket]);
}
