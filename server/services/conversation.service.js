import mongoose from "mongoose";
import createHttpError from "http-errors";
import { ConversationModel, MessageModel } from "../models/index.js";
import { AuthService } from "./auth.service.js";
import { MessageService } from "./message.service.js";
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
      unreadCount:
        c.participants.find((p) => p.user._id.toString() === userId)
          ?.unreadCount || 0,
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
    if (type === "direct") {
      const foundConversation = await ConversationModel.findOne({
        type: "direct",
        // Tìm hội thoại có chứa TẤT CẢ các ID trong participantIds
        "participants.user": {
          $all: participantIds,
        },
        // Đảm bảo số lượng participant đúng bằng số lượng ID truyền vào (tránh lấy nhầm group)
        participants: { $size: participantIds.length },
      });

      if (foundConversation) {
        return foundConversation;
      }
    }
    // 1. Tạo Conversation
    const conversation = await ConversationModel.create({
      type,
      name: type === "group" ? name : null,
      avatar: type === "group" && avatar ? avatar : null,
      participants: participantIds.map((id) => ({
        user: id,
        lastRead: null,
        role: id === creatorId ? "owner" : "member",
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
      const systemContent = `Group created by ${fullConversation.createdBy.name}`;

      const systemMsg = await MessageService.createSystemMessage({
        conversationId: conversation._id,
        senderId: creatorId,
        content: systemContent,
      });

      // 3. Bắn Socket thông báo cho tất cả thành viên (additional notifications beyond the system message)
      console.log("conversation", fullConversation);
      console.log("systemMsg", systemMsg);
      participantIds.forEach((id) => {
        // Thông báo có nhóm mới
        io.to(`user_${id}`).emit("conversation:new", fullConversation);

        // Thông báo có tin nhắn mới (tin nhắn hệ thống) - this is already handled by createSystemMessage
        // io.to(`user_${id}`).emit("message:new", {
        //   newMessage: systemMsg,
        //   unreadCount: 1,
        // });
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

  updateGroup: async ({ conversationId, userId, updateData }) => {
    // Check if user is admin or owner
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) {
      throw createHttpError(404, "Conversation not found");
    }

    const userParticipant = conversation.participants.find(
      (p) => p.user.toString() === userId.toString(),
    );

    if (
      !userParticipant ||
      !["admin", "owner"].includes(userParticipant.role)
    ) {
      throw createHttpError(
        403,
        "You don't have permission to update this group",
      );
    }

    const updatedConversation = await ConversationModel.findByIdAndUpdate(
      conversationId,
      updateData,
      { new: true },
    )
      .populate("participants.user", "_id name avatar")
      .populate("lastMessage");

    io.to(`conversation_${conversationId}`).emit(
      "group:updated",
      updatedConversation,
    );
    return updatedConversation;
  },

  addMember: async ({ conversationId, userId, newMemberId }) => {
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) {
      throw createHttpError(404, "Conversation not found");
    }

    const userParticipant = conversation.participants.find(
      (p) => p.user.toString() === userId.toString(),
    );

    if (
      !userParticipant ||
      !["admin", "owner"].includes(userParticipant.role)
    ) {
      throw createHttpError(403, "You don't have permission to add members");
    }

    // Check if member already exists
    const memberExists = conversation.participants.some(
      (p) => p.user.toString() === newMemberId.toString(),
    );

    if (memberExists) {
      throw createHttpError(400, "User is already a member of this group");
    }

    // Get user details for logging
    const adderUser = await AuthService.getUserById(userId);
    const newMember = await AuthService.getUserById(newMemberId);

    const updatedConversation = await ConversationModel.findByIdAndUpdate(
      conversationId,
      {
        $push: {
          participants: {
            user: newMemberId,
            role: "member",
            joinedAt: new Date(),
            lastRead: new Date(),
            unreadCount: 1,
          },
        },
      },
      { new: true },
    ).populate("participants.user", "_id name avatar");

    // Create system message for group event
    const systemContent = `${adderUser.name} added ${newMember.name} to the group`;

    const systemMsg = await MessageService.createSystemMessage({
      conversationId,
      senderId: userId,
      content: systemContent,
    });

    // Emit to group members (additional group-specific events)
    io.to(`conversation_${conversationId}`).emit("group:memberAdded", {
      newMemberId,
      conversation: updatedConversation,
      systemMessage: systemMsg,
    });

    // Emit to new member
    io.to(`user_${newMemberId}`).emit(
      "group:addedToGroup",
      updatedConversation,
    );

    return updatedConversation;
  },

  removeMember: async ({ conversationId, userId, memberToRemoveId }) => {
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) {
      throw createHttpError(404, "Conversation not found");
    }

    const userParticipant = conversation.participants.find(
      (p) => p.user.toString() === userId.toString(),
    );

    if (
      !userParticipant ||
      !["admin", "owner"].includes(userParticipant.role)
    ) {
      throw createHttpError(403, "You don't have permission to remove members");
    }

    // Get user details for logging
    const removerUser = await AuthService.getUserById(userId);
    const removedUser = await AuthService.getUserById(memberToRemoveId);

    const updatedConversation = await ConversationModel.findByIdAndUpdate(
      conversationId,
      { $pull: { participants: { user: memberToRemoveId } } },
      { new: true },
    ).populate("participants.user", "_id name avatar");

    // Create system message for group event
    const systemContent = `${removerUser.name} removed ${removedUser.name} from the group`;

    const systemMsg = await MessageService.createSystemMessage({
      conversationId,
      senderId: userId,
      content: systemContent,
    });

    // Emit to group members (additional group-specific events)
    io.to(`conversation_${conversationId}`).emit("group:memberRemoved", {
      removedUserId: memberToRemoveId,
      conversation: updatedConversation,
      systemMessage: systemMsg,
    });

    io.to(`user_${memberToRemoveId}`).emit("group:removedFromGroup", {
      conversationId,
    });

    return updatedConversation;
  },

  makeAdmin: async ({ conversationId, requestUserId, targetUserId }) => {
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) {
      throw createHttpError(404, "Conversation not found");
    }

    const requester = conversation.participants.find(
      (p) => p.user.toString() === requestUserId.toString(),
    );

    if (!requester || requester.role !== "owner") {
      throw createHttpError(403, "Only owner can make someone admin");
    }

    // Get user details for logging
    const requesterUser = await AuthService.getUserById(requestUserId);
    const targetUser = await AuthService.getUserById(targetUserId);

    const updatedConversation = await ConversationModel.findOneAndUpdate(
      {
        _id: conversationId,
        "participants.user": targetUserId,
      },
      { $set: { "participants.$.role": "admin" } },
      { new: true },
    ).populate("participants.user", "_id name avatar");

    // Create system message for group event
    const systemContent = `${requesterUser.name} made ${targetUser.name} an admin`;

    const systemMsg = await MessageService.createSystemMessage({
      conversationId,
      senderId: requestUserId,
      content: systemContent,
    });

    // Emit to group members (additional group-specific events)
    io.to(`conversation_${conversationId}`).emit("group:memberPromoted", {
      userId: targetUserId,
      role: "admin",
      conversation: updatedConversation,
      systemMessage: systemMsg,
    });

    return updatedConversation;
  },

  removeAdmin: async ({ conversationId, requestUserId, targetUserId }) => {
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) {
      throw createHttpError(404, "Conversation not found");
    }

    const requester = conversation.participants.find(
      (p) => p.user.toString() === requestUserId.toString(),
    );

    if (!requester || requester.role !== "owner") {
      throw new Error("Only owner can remove admin privileges");
    }

    // Get user details for logging
    const requesterUser = await AuthService.getUserById(requestUserId);
    const targetUser = await AuthService.getUserById(targetUserId);

    const updatedConversation = await ConversationModel.findOneAndUpdate(
      {
        _id: conversationId,
        "participants.user": targetUserId,
      },
      { $set: { "participants.$.role": "member" } },
      { new: true },
    ).populate("participants.user", "_id name avatar");

    // Create system message for group event
    const systemContent = `${requesterUser.name} removed ${targetUser.name} as admin`;

    const systemMsg = await MessageService.createSystemMessage({
      conversationId,
      senderId: requestUserId,
      content: systemContent,
    });

    // Emit to group members (additional group-specific events)
    io.to(`conversation_${conversationId}`).emit("group:adminRemoved", {
      userId: targetUserId,
      conversation: updatedConversation,
      systemMessage: systemMsg,
    });

    return updatedConversation;
  },

  leaveGroup: async ({ conversationId, userId, newOwnerId }) => {
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) {
      throw createHttpError(404, "Conversation not found");
    }

    const userParticipant = conversation.participants.find(
      (p) => p.user.toString() === userId.toString(),
    );

    if (!userParticipant) {
      throw createHttpError(400, "User is not a member of this group");
    }

    // Get user details for logging
    const leavingUser = await AuthService.getUserById(userId);

    // If the leaving user is the owner, require newOwnerId
    if (userParticipant.role === "owner") {
      if (!newOwnerId) {
        throw createHttpError(
          400,
          "Owner must choose a new owner before leaving the group",
        );
      }
      if (newOwnerId === userId) {
        throw createHttpError(400, "New owner cannot be the leaving user");
      }
      // Check if newOwnerId is a member
      const newOwnerParticipant = conversation.participants.find(
        (p) => p.user.toString() === newOwnerId.toString(),
      );
      if (!newOwnerParticipant) {
        throw createHttpError(
          400,
          "New owner must be a current member of the group",
        );
      }
      // Get new owner details
      const newOwnerUser = await AuthService.getUserById(newOwnerId);
      // Promote new owner
      await ConversationModel.updateOne(
        { _id: conversationId, "participants.user": newOwnerId },
        { $set: { "participants.$.role": "owner" } },
      );
    }

    const updatedConversation = await ConversationModel.findByIdAndUpdate(
      conversationId,
      { $pull: { participants: { user: userId } } },
      { new: true },
    ).populate("participants.user", "_id name avatar");

    // Create system message for group event
    const systemContent = `${leavingUser.name} left the group`;

    const systemMsg = await MessageService.createSystemMessage({
      conversationId,
      senderId: userId,
      content: systemContent,
    });

    // Emit to group members (additional group-specific events)
    io.to(`conversation_${conversationId}`).emit("group:memberLeft", {
      userId,
      conversation: updatedConversation,
      systemMessage: systemMsg,
    });

    io.to(`user_${userId}`).emit("group:leftGroup", {
      conversationId,
    });

    return updatedConversation;
  },

  disbandGroup: async ({ conversationId, userId }) => {
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) {
      throw createHttpError(404, "Conversation not found");
    }

    const userParticipant = conversation.participants.find(
      (p) => p.user.toString() === userId.toString(),
    );

    if (!userParticipant || userParticipant.role !== "owner") {
      throw createHttpError(403, "Only owner can disband the group");
    }

    await ConversationModel.findByIdAndDelete(conversationId);

    // Notify all members
    conversation.participants.forEach((participant) => {
      io.to(`user_${participant.user}`).emit("group:disbanded", {
        conversationId,
      });
    });

    io.to(`conversation_${conversationId}`).emit("group:disbanded", {
      conversationId,
    });
  },
};
