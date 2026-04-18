import mongoose from "mongoose";
import { ConversationModel, MessageModel } from "../models/index.js";
import { io } from "../sockets/index.js";

export const ConversationService = {
  getConversations: async ({ userId, type, cursor, lastId, limit = 10 }) => {
    const match = { "participants.user": userId };
    if (type === "direct" || type === "group") match.type = type;

    const hasCursor = cursor && cursor !== "null" && cursor !== "undefined";
    const hasLastId = lastId && lastId !== "null" && lastId !== "undefined";

    if (hasCursor && hasLastId) {
      const cursorDate = new Date(cursor);

      if (!isNaN(cursorDate.getTime())) {
        match.$or = [
          { lastMessageAt: { $lt: cursorDate } },
          {
            lastMessageAt: cursorDate,
            _id: { $lt: new mongoose.Types.ObjectId(lastId) },
          },
        ];
      }
    }

    const conversations = await ConversationModel.find(match)
      .sort({ lastMessageAt: -1, _id: -1 })
      .limit(Number(limit))
      .populate("participants.user", "_id name avatar lastRead lastActive")
      .populate({
        path: "lastMessage",
        select:
          "content type attachments sender createdAt deletedForEveryone callData",
        populate: { path: "sender", select: "_id name avatar" },
      })
      .lean();

    const data = conversations.map((c) => ({
      ...c,
      lastMessage: c.lastMessage?.deletedForEveryone ? null : c.lastMessage,
      avatar: c.avatar?.url || undefined,
      otherUser:
        c.type === "direct"
          ? (c.participants.find(
              (p) => p.user._id.toString() !== userId.toString(),
            )?.user ?? null)
          : null,
    }));

    // Next cursor
    const last = conversations.at(-1);
    const nextCursor =
      conversations.length === Number(limit)
        ? { cursor: last.lastMessageAt, lastId: last._id }
        : null;

    return { data, nextCursor };
  },

  markAsRead: async ({ conversationId, userId }) => {
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
    io.to(`conversation_${conversationId}`).emit("message:seen", {
      conversationId,
      userId,
      lastRead,
    });
  },

  createConversation: async ({
    type,
    participantIds,
    name,
    avatar,
    creatorId,
  }) => {
    // 1. Tạo Conversation
    const conversation = await ConversationModel.create({
      type,
      name: type === "group" ? name : null,
      avatar: type === "group" && avatar ? avatar : null,
      participants: participantIds.map((id) => ({
        user: id,
        lastRead: null,
        role: id === creatorId ? "admin" : "member",
        unreadCount: 1,
      })),
      createdBy: creatorId,
      lastMessageAt: new Date(),
    });
    conversation.avatar = conversation.avatar?.url || undefined;

    if (type === "group") {
      const fullConversation = await conversation.populate([
        { path: "participants.user", select: "_id name avatar" },
        { path: "createdBy", select: "_id name avatar" },
      ]);

      // 2. Tạo tin nhắn hệ thống (System Message)
      // Bạn có thể tạo 1 tin nhắn tổng hợp hoặc nhiều tin nhắn riêng lẻ
      const systemContent = `Group created by ${fullConversation.createdBy.name}`;

      const systemMsg = await MessageModel.create({
        conversation: conversation._id,
        sender: creatorId, // Người tạo nhóm
        content: systemContent,
        type: "system", // Đánh dấu đây là tin nhắn hệ thống
      });

      // 3. Cập nhật lastMessage cho Conversation (để hiện preview ở danh sách chat)
      conversation.lastMessage = systemMsg._id;
      await conversation.save();

      // 4. Bắn Socket thông báo cho tất cả thành viên
      console.log("conversation", fullConversation);
      console.log("systemMsg", systemMsg);
      participantIds.forEach((id) => {
        // Thông báo có nhóm mới
        io.to(`user_${id}`).emit("conversation:new", fullConversation);

        // Thông báo có tin nhắn mới (tin nhắn hệ thống)
        io.to(`user_${id}`).emit("message:new", {
          newMessage: systemMsg,
          unreadCount: 1,
        });
      });
    }

    return conversation;
  },

  getConversationMedia: async ({ conversationId, tab, limit, skip }) => {
    const mediaRegex = /^(image|video)\//i;

    let matchCriteria = {
      conversation: new mongoose.Types.ObjectId(conversationId),
      attachments: { $exists: true, $not: { $size: 0 } },
      deletedForEveryone: false,
    };

    const results = await MessageModel.aggregate([
      // Bước 1: Tìm các tin nhắn có file trong hội thoại
      { $match: matchCriteria },

      // Bước 2: "Bung" mảng attachments (Nếu 1 tin nhắn có 2 ảnh thì tách thành 2 bản ghi)
      { $unwind: "$attachments" },

      // Bước 3: Phân loại dựa trên tab người dùng chọn
      {
        $match:
          tab === "media"
            ? { "attachments.type": { $regex: mediaRegex } }
            : { "attachments.type": { $not: { $regex: mediaRegex } } },
      },

      // Bước 4: Xử lý đa luồng (Lấy dữ liệu & Đếm tổng)
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 0,
                messageId: "$_id",
                sender: 1,
                createdAt: 1,
                file: "$attachments", // Đưa object attachment ra ngoài
              },
            },
          ],
        },
      },
    ]);

    const total = results[0].metadata[0]?.total || 0;
    const items = results[0].data;

    return { total, items };
  },
};
