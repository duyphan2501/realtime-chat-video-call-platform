import { Server } from "socket.io";
import { socketAuth } from "../middlewares/auth.middleware.js";
import registerWebRTCHandlers from "./webrtc.handler.js";
import registerChatHandlers from "./chat.handler.js";
import { UserModel } from "../models/index.js";
import { createAdapter } from "@socket.io/redis-adapter";
import { redisClient, pubClient, subClient } from "../config/redis.config.js";
import { handleCallCleanup } from "../services/call.service.js";
import { AuthService } from "../services/auth.service.js";

export let io;
export const getIo = () => io;

const safeJsonParse = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const emitPendingCall = async (socket, userId) => {
  const pendingCall = await redisClient.hGet("active_calls", userId);
  const pendingCallData = safeJsonParse(pendingCall);
  if (!pendingCallData) return;

  const { startTime, callType, offer, conversationId, callerId, partnerId } =
    pendingCallData;

  if (userId !== partnerId) return;

  const fromUser = await AuthService.getUserById(callerId);
  socket.emit("call:incoming", {
    incoming: { from: fromUser, offer },
    startedAt: startTime,
    callType,
    conversationId,
  });
};

export const initSocket = async (server, clientUrl) => {
  io = new Server(server, {
    pingTimeout: 60000,
    cors: { origin: clientUrl, credentials: true },
    transports: ["websocket"],
  });
  io.adapter(createAdapter(pubClient, subClient));

  io.use(socketAuth);

  io.on("connection", async (socket) => {
    const userId = socket.userId.toString();
    if (!userId) return;

    const userKey = `online_user:${userId}`;

    const wasAddedToOnlineSet = await redisClient.sAdd("online_users", userId);
    await redisClient.sAdd(userKey, socket.id);

    socket.join(`user_${userId}`);

    const allOnlineIds = await redisClient.sMembers("online_users");
    socket.emit("presence:online_users", { userIds: allOnlineIds });

    if (wasAddedToOnlineSet === 1) {
      socket.broadcast.emit("presence:online", { userId });
    }
    console.log(
      `Socket connected. User ID: ${userId}, Socket ID: ${socket.id}`,
    );

    // Đăng ký các module logic
    registerChatHandlers(io, socket);
    registerWebRTCHandlers(io, socket);

    // Tạo cờ hiệu cục bộ cho riêng socket này nhằm tránh việc emit trùng lặp
    let isCallEmitted = false;
    const handleEmitPendingCall = async () => {
      if (isCallEmitted) return;
      isCallEmitted = true;
      await emitPendingCall(socket, userId);
    };

    // Cách 1: Client chủ động báo đã sẵn sàng nhận sự kiện
    socket.on("client:ready", async () => {
      await handleEmitPendingCall();
    });

    // Cách 2: Dự phòng sau 300ms nếu client tải chậm hoặc không gửi client:ready
    const pendingCallTimeout = setTimeout(() => {
      void handleEmitPendingCall();
    }, 300);

    socket.on("disconnect", async () => {
      clearTimeout(pendingCallTimeout);
      await redisClient.sRem(userKey, socket.id);
      const remainingSockets = await redisClient.sCard(userKey);
      console.log(
        `User disconnected. Socket ID: ${socket.id}, User ID: ${userId}, Remain: ${remainingSockets}`,
      );
      if (remainingSockets === 0) {
        const callDataRaw = await redisClient.hGet("active_calls", userId);
        const callData = safeJsonParse(callDataRaw);
        if (callData) {
          if (
            socket.id === callData.callerSocketId ||
            socket.id === callData.receiverSocketId
          ) {
            await handleCallCleanup(userId);
          }
        }
        await redisClient.sRem("online_users", userId);
        const now = new Date();
        io.emit("presence:offline", { userId, lastActive: now });

        await UserModel.findByIdAndUpdate(userId, { lastActive: now });
        console.log(`User completely disconnected. User ID: ${userId}`);
      }
    });
  });
};
