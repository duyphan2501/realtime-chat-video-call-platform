import { redisClient } from "../config/redis.config.js";
import { MessageService } from "../services/index.js";

export default (io, socket) => {
  const userId = socket.userId.toString();

  socket.on(
    "webrtc:offer",
    async ({ targetUserId, offer, callType, startedAt, conversationId }) => {
      const isBusy = await redisClient.hGet("active_calls", targetUserId);
      if (isBusy) {
        console.log(
          `[Missed Call] User ${targetUserId} is busy. Call from ${userId} missed.`,
        );

        // Log missed call message to conversation
        try {
          await MessageService.sendMessage({
            conversationId,
            senderId: userId,
            type: callType || "call",
            callData: {
              status: "missed",
              duration: 0,
            },
          });
        } catch (error) {
          console.error(
            `[Error] Failed to log missed call for user ${targetUserId}:`,
            error.message,
          );
        }

        return socket.emit("call:user_busy", { targetUserId });
      }

      // Dữ liệu cuộc gọi đầy đủ
      const callMetadata = JSON.stringify({
        callerId: userId,
        callerSocketId: socket.id, // Lưu socketId của người gọi
        partnerId: targetUserId,
        conversationId,
        callType,
        startTime: startedAt,
        offer,
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

  socket.on("webrtc:answer", async ({ targetUserId, answer }) => {
    const peerUser = socket.user;
    if (!peerUser) return;

    // Lấy data hiện tại và bổ sung receiverSocketId
    const rawData = await redisClient.hGet("active_calls", userId);
    if (rawData) {
      const data = JSON.parse(rawData);
      data.receiverSocketId = socket.id; // Tab hiện tại của người nhận

      const updatedData = JSON.stringify(data);
      await redisClient.hSet("active_calls", userId, updatedData);
      await redisClient.hSet("active_calls", targetUserId, updatedData);
    }

    io.to(`user_${targetUserId}`).emit("webrtc:answer", { answer, peerUser });
  });

  socket.on("webrtc:ice_candidate", async ({ targetUserId, candidate }) => {
    if (!targetUserId || !candidate) return;

    const rawCall = await redisClient.hGet("active_calls", userId);
    if (!rawCall) return;

    const activeCall = JSON.parse(rawCall);
    const isPeer =
      activeCall.callerId === targetUserId ||
      activeCall.partnerId === targetUserId;
    if (!isPeer) return;

    io.to(`user_${targetUserId}`).emit("webrtc:ice_candidate", {
      candidate,
      fromUserId: userId,
    });
  });

  socket.on("call:media_state", ({ targetUserId, mediaState }) => {
    if (!targetUserId || !mediaState) return;
    io.to(`user_${targetUserId}`).emit("call:media_state", {
      fromUserId: userId,
      mediaState,
    });
  });
};
