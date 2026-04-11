import { io } from "../sockets/index.js";
import { MessageService } from "./message.service.js";
import { redisClient } from "../config/redis.config.js";

const getCallInfo = async (userId) => {
  const data = await redisClient.hGet("active_calls", userId);
  return data ? JSON.parse(data) : null;
};

const processCallEnd = async ({ userId, callInfo, reason = "ended" }) => {
  const { callerId, partnerId, conversationId, callType, startTime } = callInfo;

  const otherUserId = userId === callerId ? partnerId : callerId;
  const duration = Math.floor((Date.now() - startTime) / 1000);

  try {
    await MessageService.sendMessage({
      conversationId,
      senderId: callerId,
      type: callType || "call",
      callData: {
        status: reason,
        duration: duration > 0 ? duration : 0,
      },
    });

    const eventName = reason === "rejected" ? "call:rejected" : "call:ended";
    io.to(`user_${otherUserId}`).emit(eventName, {
      fromUserId: userId,
      reason,
    });
  } finally {
    await redisClient.hDel("active_calls", userId);
    await redisClient.hDel("active_calls", otherUserId);
  }
};

const rejectCall = async ({ senderId, status = "rejected" }) => {
  const callInfo = await getCallInfo(senderId);
  if (!callInfo) return;
  await processCallEnd({ userId: senderId, callInfo, reason: status });
};

const endCall = async ({ senderId }) => {
  const callInfo = await getCallInfo(senderId);
  if (!callInfo) return;
  await processCallEnd({ userId: senderId, callInfo, reason: "ended" });
};

export const handleCallCleanup = async (userId) => {
  const callInfo = await getCallInfo(userId);
  if (!callInfo) return;

  console.log(`[Cleanup] User ${userId} disconnected, processing call end...`);
  await processCallEnd({ userId, callInfo, reason: "ended" });
};

export const CallService = {
  rejectCall,
  endCall,
};
