import { Server } from "socket.io";
import { socketAuth } from "../middlewares/auth.middleware.js";
import registerWebRTCHandlers from "./webrtc.handler.js";
import registerChatHandlers from "./chat.handler.js";
import { UserModel } from "../models/index.js";
import { createAdapter } from "@socket.io/redis-adapter";
import { redisClient, pubClient, subClient } from "../config/redis.config.js";

export let io;

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
    await redisClient.sAdd("online_users", userId);
    await redisClient.sAdd(userKey, socket.id);

    socket.join(`user_${userId}`);

    const allOnlineIds = await redisClient.sMembers("online_users");
    socket.emit("presence:online_users", { userIds: allOnlineIds });

    socket.broadcast.emit("presence:online", { userId });
    console.log(
      `Socket connected. User ID: ${userId}, Socket ID: ${socket.id}`,
    );

    // Đăng ký các module logic
    registerChatHandlers(io, socket);
    registerWebRTCHandlers(io, socket);

    socket.on("disconnect", async () => {
      await redisClient.sRem(userKey, socket.id);
      const remainingSockets = await redisClient.sCard(userKey);
      if (remainingSockets !== 0) return;

      await redisClient.sRem("online_users", userId);

      const now = new Date();
      io.emit("presence:offline", { userId, lastActive: now });
      await UserModel.findByIdAndUpdate(userId, { lastActive: now });
      console.log(
        `User disconnected. Socket ID: ${socket.id}, User ID: ${userId}`,
      );
    });
  });
};
