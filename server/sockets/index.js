import { Server } from "socket.io";
import { socketAuth } from "../middlewares/auth.middleware.js";
import registerWebRTCHandlers from "./webrtc.handler.js";
import registerChatHandlers from "./chat.handler.js";

export const userSocketMap = {}; 
export let io;

export const initSocket = (server, clientUrl) => {
  io = new Server(server, {
    pingTimeout: 60000,
    cors: { origin: clientUrl, credentials: true },
    transports: ["websocket", "polling"],
  });
  io.use(socketAuth);

  io.on("connection", (socket) => {
    const userId = socket.userId;
    if (userId) {
      global.userSocketMap[userId] = socket.id;
      socket.join(`user_${userId}`);
      // Chỉ client vừa kết nối mới nhận danh sách tất cả người online
      socket.emit("presence:online_users", {
        userIds: Object.keys(global.userSocketMap),
      });

      // Các client khác nhận thông báo một người mới vừa online
      socket.broadcast.emit("presence:online", { userId });
      console.log(
        `Socket connected. User ID: ${userId}, Socket ID: ${socket.id}`,
      );
    }

    // Đăng ký các module logic
    registerChatHandlers(io, socket);
    registerWebRTCHandlers(io, socket);

    socket.on("disconnect", () => {
      if (userId) {
        delete global.userSocketMap[userId];

        // Thông báo cho mọi người user này đã offline
        io.emit("presence:offline", { userId });

        // Cập nhật last active (để hiện "truy cập 5 phút trước" chẳng hạn)
        io.emit("user_last_active_updates", {
          userId: userId,
          timestamp: Date.now(),
        });
        console.log(
          `User disconnected. Socket ID: ${socket.id}, User ID: ${userId}`,
        );
      }
    });
  });
};
