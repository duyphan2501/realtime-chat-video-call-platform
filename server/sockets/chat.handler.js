import { ConversationModel } from "../models/conservation.model.js";
import { MessageModel } from "../models/message.model.js";

import UserModel from "../models/user.model.js";

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

  /* ── Friend Request Events ────────────────────────── */

  // Khi gửi lời mời kết bạn → notify người nhận
  socket.on("friend:request", async ({ toUserId }) => {
    const userId = socket.userId;
    if (!userId || !toUserId) return;

    try {
      const user = await UserModel.findById(userId).select("name avatar");
      const targetSocketId = global.userSocketMap?.[toUserId];

      if (targetSocketId && user) {
        io.to(targetSocketId).emit("friend:request_received", {
          from: {
            _id: user._id,
            name: user.name,
            avatar: user.avatar,
          },
          createdAt: new Date(),
        });
      }
    } catch (err) {
      console.error("friend:request error:", err);
    }
  });

  // Khi chấp nhận lời mời → notify người gửi
  socket.on("friend:accept", async ({ toUserId }) => {
    const userId = socket.userId;
    if (!userId || !toUserId) return;

    try {
      const user = await UserModel.findById(userId).select("name avatar");
      const targetSocketId = global.userSocketMap?.[toUserId];

      if (targetSocketId && user) {
        io.to(targetSocketId).emit("friend:accepted", {
          from: {
            _id: user._id,
            name: user.name,
            avatar: user.avatar,
          },
          createdAt: new Date(),
        });
      }
    } catch (err) {
      console.error("friend:accept error:", err);
    }
  });

  // Khi từ chối lời mời → notify người gửi
  socket.on("friend:reject", async ({ toUserId }) => {
    const userId = socket.userId;
    if (!userId || !toUserId) return;

    try {
      const targetSocketId = global.userSocketMap?.[toUserId];

      if (targetSocketId) {
        io.to(targetSocketId).emit("friend:rejected", {
          from: { _id: userId },
        });
      }
    } catch (err) {
      console.error("friend:reject error:", err);
    }
  });

  // Khi unfriend → notify người kia
  socket.on("friend:unfriend", async ({ toUserId }) => {
    const userId = socket.userId;
    if (!userId || !toUserId) return;

    try {
      const targetSocketId = global.userSocketMap?.[toUserId];

      if (targetSocketId) {
        io.to(targetSocketId).emit("friend:removed", {
          by: { _id: userId },
        });
      }
    } catch (err) {
      console.error("friend:unfriend error:", err);
    }
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

  socket.on("typing:start", ({ conversationId }) => {
    socket.to(`conversation_${conversationId}`).emit("typing:start", {
      conversationId,
      userId: socket.userId,
    });
  });

  socket.on("typing:stop", ({ conversationId }) => {
    socket.to(`conversation_${conversationId}`).emit("typing:stop", {
      conversationId,
      userId: socket.userId,
    });
  });
};
