import { redisClient } from "../config/redis.config.js";

export default (io, socket) => {
  const userId = socket.userId.toString();

  socket.on(
    "webrtc:offer",
    async ({ targetUserId, offer, callType, startedAt, conversationId }) => {
      const isBusy = await redisClient.hGet("active_calls", targetUserId);
      if (isBusy) return socket.emit("call:busy", { targetUserId });

      // Dữ liệu cuộc gọi đầy đủ
      const callMetadata = JSON.stringify({
        callerId: userId, // Người gọi
        socketId: socket.id,
        offer,
        partnerId: targetUserId, // Người nhận
        conversationId, // ID cuộc trò chuyện
        callType, // "voice" hoặc "video"
        startTime: startedAt, // Dùng để tính duration khi kết thúc
      });

      // Lưu mapping cho cả 2 để khi bất kỳ ai disconnect đều truy xuất được data này
      await redisClient.hSet("active_calls", userId, callMetadata);
      await redisClient.hSet("active_calls", targetUserId, callMetadata);

      io.to(`user_${targetUserId}`).emit("call:incoming", {
        incoming: { from: socket.user, offer },
        startedAt,
        callType,
        conversationId,
      });
    },
  );

  socket.on("webrtc:answer", ({ targetUserId, answer }) => {
    const peerUser = socket.user;
    if (!peerUser) return;

    io.to(`user_${targetUserId}`).emit("webrtc:answer", {
      answer,
      peerUser,
    });
  });

  socket.on("webrtc:ice_candidate", ({ targetUserId, candidate }) => {
    io.to(`user_${targetUserId}`).emit("webrtc:ice_candidate", { candidate });
  });
};