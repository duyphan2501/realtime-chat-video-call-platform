import mongoose from "mongoose";
import { ConversationModel } from "../models/conservation.model.js";
import { MessageModel } from "../models/message.model.js";
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
        select: "content type attachments sender createdAt deletedForEveryone",
        populate: { path: "sender", select: "_id name avatar" },
      })
      .lean();

    const data = conversations.map((c) => ({
      ...c,
      lastMessage: c.lastMessage?.deletedForEveryone ? null : c.lastMessage,
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
};
