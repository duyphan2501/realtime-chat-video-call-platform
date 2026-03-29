import UserModel from "../models/user.model.js";

export default (io, socket) => {
  socket.on("join_conversation", (conversationId) => {
    socket.join(`conversation_${conversationId}`);
    console.log(`Socket ${socket.id} joined room: conversation_${conversationId}`);
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
};