import { io } from "../sockets/index.js";
import { MessageService } from "./message.service.js";

const rejectCall = async ({
  targetUserId,
  senderId,
  conversationId,
  type,
  status = "rejected",
}) => {
  const callData = { status, duration: 0 };
  await MessageService.sendMessage({
    conversationId,
    senderId,
    type,
    status,
    callData,
  });
  io.to(`user_${targetUserId}`).emit("call:rejected", { reason: status });
};

const endCall = async ({
  targetUserId,
  senderId,
  conversationId,
  type,
  duration,
}) => {
  const callData = { status: "ended", duration };
  await MessageService.sendMessage({
    conversationId,
    senderId,
    type,
    callData,
  });
  io.to(`user_${targetUserId}`).emit("call:ended");
};

export const CallService = {
  rejectCall,
  endCall,
};
