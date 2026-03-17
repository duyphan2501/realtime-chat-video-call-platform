"use client";
import { useCallback, useEffect } from "react";
import { io, type Socket } from "socket.io-client";
import { useSocketStore } from "@/store";

let _socket: Socket | null = null;

export function useSocketMain() {
  const { setConnected, setSocket } = useSocketStore();

  const connect = useCallback(
    (token: string) => {
      // Nếu đã có kết nối và đang hoạt động thì không tạo mới
      if (_socket?.connected) return _socket;

      const socketUrl =
        process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8000";

      _socket = io(socketUrl, {
        auth: { token },
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });

      // Lắng nghe sự kiện kết nối cơ bản
      _socket.on("connect", () => {
        setConnected(true);
        setSocket(_socket);
        console.log("🟢 Socket connected:", _socket?.id);
      });

      _socket.on("disconnect", (reason) => {
        setConnected(false);
        console.log("🔴 Socket disconnected:", reason);
      });

      _socket.on("connect_error", (err) => {
        console.error("🟠 Socket connection error:", err.message);
        setConnected(false);
      });

      return _socket;
    },
    [setConnected, setSocket],
  );

  const disconnect = useCallback(() => {
    if (_socket) {
      _socket.disconnect();
      _socket = null;
    }
    setConnected(false);
    setSocket(null);
  }, [setConnected, setSocket]);

  // Tự động dọn dẹp khi đóng trình duyệt hoặc logout hoàn toàn
  useEffect(() => {
    return () => {
      // Chỉ ngắt kết nối nếu thực sự cần thiết (tùy thuộc vào logic App)
      // Thường thì chỉ gọi disconnect khi Logout.
    };
  }, [disconnect]);

  return { connect, disconnect };
}

// Helper để lấy socket instance ở những nơi không phải React Component (ví dụ: API utils)
export const getSocket = () => _socket;
