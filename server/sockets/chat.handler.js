import { MessageModel, UserModel, ConversationModel } from "../models/index.js";

export default (io, socket) => {
  const userId = socket.userId;

  socket.on("join_conversation", (conversationId) => {
    socket.join(`conversation_${conversationId}`);
    console.log(
      `Socket ${socket.id} joined room: conversation_${conversationId}`,
    );
  });

  socket.on("leave_conversation", (conversationId) => {
    socket.leave(`conversation_${conversationId}`);
    console.log(
      `Socket ${socket.id} left room: conversation_${conversationId}`,
    );
  });

  /* ── Friend Request Events (Sửa lỗi Multi-server ở đây) ────────────────── */

  socket.on("friend:request", async ({ toUserId }) => {
    if (!userId || !toUserId) return;
    try {
      const user = await UserModel.findById(userId)
        .select("name avatar")
        .lean();

      if (user) {
        io.to(`user_${toUserId}`).emit("friend:request_received", {
          from: { _id: user._id, name: user.name, avatar: user.avatar },
          createdAt: new Date(),
        });
      }
    } catch (err) {
      console.error("friend:request error:", err);
    }
  });

  socket.on("friend:accept", async ({ toUserId }) => {
    if (!userId || !toUserId) return;
    try {
      const user = await UserModel.findById(userId)
        .select("name avatar")
        .lean();
      if (user) {
        io.to(`user_${toUserId}`).emit("friend:accepted", {
          from: { _id: user._id, name: user.name, avatar: user.avatar },
          createdAt: new Date(),
        });
      }
    } catch (err) {
      console.error("friend:accept error:", err);
    }
  });

  socket.on("friend:reject", async ({ toUserId }) => {
    if (!userId || !toUserId) return;
    // Gửi tín hiệu từ chối đến người gửi lời mời ban đầu
    io.to(`user_${toUserId}`).emit("friend:rejected", {
      from: { _id: userId },
    });
  });

  socket.on("friend:unfriend", async ({ toUserId }) => {
    if (!userId || !toUserId) return;
    io.to(`user_${toUserId}`).emit("friend:removed", { by: { _id: userId } });
  });

  /* ── Message & Typing Events ─────────────────────────────────────────── */

  socket.on(
    "message:received",
    async ({ messageId, senderId, conversationId, tempId }) => {
      await MessageModel.updateOne(
        { _id: messageId, isDelivered: false },
        { $set: { isDelivered: true } },
      );

      // Đảm bảo dùng io.to() để xuyên instance
      io.to(`user_${senderId}`).emit("message:received", {
        messageId,
        conversationId,
        tempId,
      });
    },
  );

  // Typing nên dùng socket.to() để người gửi không tự nhận lại event của chính mình
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
