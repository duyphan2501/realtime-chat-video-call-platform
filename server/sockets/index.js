import { Server } from "socket.io";
import { socketAuth } from "../middlewares/auth.middleware.js";
import registerWebRTCHandlers from "./webrtc.handler.js";
import registerChatHandlers from "./chat.handler.js";
import UserModel from "../models/user.model.js";

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
      userSocketMap[userId] = socket.id;
      socket.join(`user_${userId}`);
      // Chỉ client vừa kết nối mới nhận danh sách tất cả người online
      socket.emit("presence:online_users", {
        userIds: Object.keys(userSocketMap),
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

    socket.on("disconnect", async () => {
      if (userId) {
        delete userSocketMap[userId];
        const now = new Date();
        // Thông báo cho mọi người user này đã offline
        io.emit("presence:offline", { userId, lastActive: now });
        try {
          await UserModel.findByIdAndUpdate(userId, { lastActive: now });
        } catch (err) {
          console.error("Error updating lastActive for user", userId);
        }
        console.log(
          `User disconnected. Socket ID: ${socket.id}, User ID: ${userId}`,
        );
      }
    });
  });
};
