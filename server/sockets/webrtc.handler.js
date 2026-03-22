import mongoose from "mongoose";
import { MessageModel } from "../models/message.model.js";
import UserModel from "../models/user.model.js";

export default (io, socket) => {
  const userId = socket.userId;

  // Hàm helper để lưu tin nhắn cuộc gọi vào DB và thông báo cho room
  const saveCallMessage = async (
    conversationId,
    senderId,
    type,
    status,
    duration = 0,
  ) => {
    try {
      const conversationObjId = new mongoose.Types.ObjectId(conversationId);
      const senderObjId = new mongoose.Types.ObjectId(senderId);
      const newMessage = await MessageModel.create({
        conversation: conversationObjId,
        sender: senderObjId,
        type: type,
        content: status,
        callData: {
          status,
          duration,
        },
      });
      await newMessage.populate("sender");

      io.to(`conversation_${conversationId}`).emit("message:new", newMessage);
      return newMessage;
    } catch (error) {
      console.error("Lỗi lưu tin nhắn cuộc gọi:", error);
    }
  };

  // --- LOGIC SIGNALING ---

  socket.on(
    "webrtc:offer",
    async ({ targetUserId, offer, callType, startedAt }) => {
      const fromUser = await UserModel.findById(userId)
        .select("_id name avatar")
        .lean();
      if (!fromUser) return;

      socket.to(`user_${targetUserId}`).emit("call:incoming", {
        incoming: {
          from: fromUser,
          offer,
        },
        callType,
        startedAt,
      });
    },
  );

  socket.on("webrtc:answer", async ({ targetUserId, answer }) => {
    const peerUser = await UserModel.findById(userId)
      .select("_id name avatar")
      .lean();
    if (!peerUser) return;
    socket
      .to(`user_${targetUserId}`)
      .emit("webrtc:answer", { answer, peerUser });
  });

  socket.on("webrtc:ice_candidate", ({ targetUserId, candidate }) => {
    socket
      .to(`user_${targetUserId}`)
      .emit("webrtc:ice_candidate", { candidate });
  });

  socket.on(
    "call:rejected",
    async ({
      targetUserId,
      ownerId,
      conversationId,
      type,
      status = "rejected",
    }) => {
      const senderId = ownerId || userId;
      await saveCallMessage(conversationId, senderId, type, status);
      socket
        .to(`user_${targetUserId}`)
        .emit("call:rejected", { reason: status });
    },
  );

  socket.on(
    "call:ended",
    async ({ targetUserId, ownerId, conversationId, type, duration }) => {
      const senderId = ownerId || userId;
      await saveCallMessage(conversationId, senderId, type, "ended", duration);
      socket.to(`user_${targetUserId}`).emit("call:ended");
    },
  );
};
