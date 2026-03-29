import { ConversationModel } from "../models/conservation.model.js";
import { MessageModel } from "../models/message.model.js";

export default (io, socket) => {
  socket.on("join_conversation", (conversationId) => {
    socket.join(`conversation_${conversationId}`);
    console.log(
      `Socket ${socket.id} joined room: conversation_${conversationId}`,
    );
  });

  socket.on("leave_conversation", (conversationId) => {
    socket.leave(`conversation_${conversationId}`);
  });

  socket.on("message:received", async ({ messageId, senderId, conversationId , tempId }) => {
    await MessageModel.updateOne(
      { _id: messageId },
      { $set: { isDelivered: true } },
    );
    socket.to(`user_${senderId}`).emit("message:received", { messageId, conversationId, tempId });
  });

  socket.on("message:seen", async ({ conversationId, userId }) => {
    const lastRead = new Date();
    await ConversationModel.updateOne(
      { _id: conversationId, "participants.user": userId },
      {
        $set: {
          "participants.$.unreadCount": 0,
          "participants.$.lastRead": lastRead,
        },
      },
    );
    io.to(`conversation_${conversationId}`).emit("message_seen", {
      conversationId,
      userId,
      lastRead,
    });
  });
};
