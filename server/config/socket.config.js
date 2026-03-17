import express from "express";
import http from "http";
import { Server } from "socket.io";
import socketAuth from "../middlewares/auth.middleware.js";
import ENV from "../utils/env.util.js";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("tiny"));
app.use(
  cors({
    origin: ENV.CLIENT_URL,
    credentials: true,
  }),
);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ENV.CLIENT_URL,
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

io.use(socketAuth);

// userSocketMap dùng để tìm nhanh socketId từ userId
const userSocketMap = {};

io.on("connection", (socket) => {
  const userId = socket.userId;

  if (userId) {
    userSocketMap[userId] = socket.id;
    socket.join(`user_${userId}`);
    console.log(
      `Socket connected. User ID: ${userId}, Socket ID: ${socket.id}`,
    );

    // Chỉ client mới nhận full list
    socket.emit("presence:online_users", {
      userIds: Object.keys(userSocketMap),
    });

    // Các client khác chỉ nhận delta
    socket.broadcast.emit("presence:online", { userId });
  }

  // --- LOGIC CHAT ---
  socket.on("join_conversation", (conversationId) => {
    socket.join(`conversation_${conversationId}`);
  });

  socket.on("leave_conversation", (conversationId) => {
    socket.leave(`conversation_${conversationId}`);
  });

  // --- LOGIC WEBRTC SIGNALING (Dành cho Video Call) ---

  // 1. Gửi yêu cầu gọi (Offer)
  socket.on("call:request", ({ to, offer }) => {
    // Gửi đến room cá nhân của người nhận
    io.to(`user_${to}`).emit("call:incoming", {
      from: userId,
      offer,
    });
  });

  // 2. Chấp nhận cuộc gọi (Answer)
  socket.on("call:accepted", ({ to, answer }) => {
    io.to(`user_${to}`).emit("call:accepted", {
      from: userId,
      answer,
    });
  });

  // 3. Trao đổi ICE Candidates
  socket.on("webrtc:ice-candidate", ({ to, candidate }) => {
    io.to(`user_${to}`).emit("webrtc:ice-candidate", {
      from: userId,
      candidate,
    });
  });

  // 4. Kết thúc/Từ chối cuộc gọi
  socket.on("call:end", ({ to }) => {
    io.to(`user_${to}`).emit("call:end", { from: userId });
  });

  // --- DISCONNECT ---
  socket.on("disconnect", () => {
    if (userId && userSocketMap[userId]) {
      delete userSocketMap[userId];
      io.emit("presence:offline", { userId });
      console.log(
        `User disconnected. Socket ID: ${socket.id}, User ID: ${userId}`,
      );

      io.emit("user_last_active_updates", {
        userId: userId,
        timestamp: Date.now(),
      });
    }
  });
});

export { io, server, app };
