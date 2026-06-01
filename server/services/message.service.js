import { ConversationModel, MessageModel } from "../models/index.js";
import { io } from "../sockets/index.js";

const getMessages = async ({
  conversationId,
  cursor,
  limit,
  currentUserId,
}) => {
  const query = {
    conversation: conversationId,
    deletedFor: { $ne: currentUserId },
  };

  if (cursor && cursor !== "null" && cursor !== "undefined")
    query._id = { $lt: cursor };

  const messages = await MessageModel.find(query)
    .sort({ _id: -1 })
    .limit(limit)
    .populate("sender", "_id avatar name")
    .populate("replyTo", "content type")
    .lean();
  const messLength = messages.length;

  const nextCursor = messLength > 0 ? messages[messLength - 1]._id : null;

  return {
    data: messages,
    nextCursor,
    hasMore: messLength === limit,
  };
};

const sendMessage = async ({
  conversationId,
  senderId,
  content,
  type,
  attachments,
  callData,
  tempId,
}) => {
  // 1. Lưu Message
  const newMessage = await MessageModel.create({
    conversation: conversationId,
    sender: senderId,
    content,
    type,
    attachments,
    callData,
  });

  // 2. Cập nhật Conversation & Tăng unreadCount cho những người khác
  const updatedConv = await ConversationModel.findOneAndUpdate(
    { _id: conversationId },
    {
      $inc: { "participants.$[elem].unreadCount": 1 },
      $set: {
        lastMessage: newMessage._id,
        lastMessageAt: new Date(),
      },
      $pull: { hiddenFor: { user: { $exists: true } } },
    },
    {
      arrayFilters: [{ "elem.user": { $ne: senderId } }],
      new: true, // Lấy data sau khi update
    },
  )
    .populate("participants.user", "_id name avatar lastRead lastActive")
    .populate({
      path: "lastMessage",
      populate: { path: "sender", select: "_id name avatar" },
    })
    .lean();

  const fullMessage = await newMessage.populate("sender", "_id name avatar");
  const messageData = { ...fullMessage.toObject(), tempId };

  // 3. Gửi Socket thông minh hơn
  // Thay vì broadcast chung chung, ta cần gửi unread riêng biệt cho từng người
  updatedConv.participants.forEach((p) => {
    const participantId = p.user?._id?.toString() || p.user?.toString();
    const room = `user_${participantId}`;
    if (room) {
      const conversationData = {
        ...updatedConv,
        avatar: updatedConv.avatar?.url || undefined,
        unreadCount: p.unreadCount,
        otherUser:
          updatedConv.type === "direct"
            ? (updatedConv.participants.find(
                (participant) =>
                  (participant.user?._id?.toString() ||
                    participant.user?.toString()) !== participantId,
              )?.user ?? null)
            : null,
      };

      io.to(room).emit("conversation:new", conversationData);
      io.to(room).emit("message:new", {
        newMessage: { ...messageData },
        unreadCount: p.unreadCount,
      });
    }
  });
  return messageData;
};

const createSystemMessage = async ({ conversationId, senderId, content }) => {
  // 1. Create system message
  const systemMessage = await MessageModel.create({
    conversation: conversationId,
    sender: senderId,
    content,
    type: "system",
  });

  // 2. Update conversation's last message (but don't increment unread counts for system messages)
  await ConversationModel.findByIdAndUpdate(conversationId, {
    lastMessage: systemMessage._id,
    lastMessageAt: new Date(),
  });

  // 3. Populate and return the message
  const fullMessage = await systemMessage.populate("sender", "_id name avatar");

  // 4. Emit to conversation room
  io.to(`conversation_${conversationId}`).emit("message:new", {
    newMessage: fullMessage,
    unreadCount: 0, // System messages don't count as unread
  });

  return fullMessage;
};

export const MessageService = {
  getMessages,
  sendMessage,
  createSystemMessage,
};
