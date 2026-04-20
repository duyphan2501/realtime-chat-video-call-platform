import createHttpError from "http-errors";
import { ConversationService } from "../services/index.js";

const getConversations = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { type, cursor, lastId, limit = 10 } = req.query;

    const { data, nextCursor } = await ConversationService.getConversations({
      userId,
      type,
      cursor,
      lastId,
      limit,
    });
    res.json({ data, nextCursor });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    if (!id) throw createHttpError.BadRequest("ConversationId is required");
    if (!userId) throw createHttpError.Unauthorized("Unauthorized");

    await ConversationService.markAsRead({ conversationId: id, userId });

    res.status(200).json({
      message: "Messages marked as read",
    });
  } catch (error) {
    next(error);
  }
};

const createConversation = async (req, res, next) => {
  try {
    const { type, participantIds, name, avatar } = req.body;
    const creatorId = req.user.userId;
    if (!type || !participantIds || participantIds.length === 0) {
      throw createHttpError.BadRequest("Type and participantIds are required");
    }

    const conversation = await ConversationService.createConversation({
      type,
      participantIds,
      name,
      avatar,
      creatorId,
    });
    res.status(201).json({ conversation });
  } catch (error) {
    next(error);
  }
};

export const getConversationMedia = async (req, res, next) => {
  try {
    const conversationId = req.params.id;
    const { tab } = req.query; // Nhận vào 'media' hoặc 'file'
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const { total, items } = await ConversationService.getConversationMedia({
      conversationId,
      tab,
      limit,
      skip,
    });

    return res.status(200).json({
      success: true,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════════════
   PUT /conversations/:conversationId — update group
   ═══════════════════════════════════════════════════════════ */
const updateGroup = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.userId;
    const { name, avatar } = req.body;

    if (!conversationId)
      throw createHttpError.BadRequest("Conversation ID is required");

    // Only include fields that are actually provided
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (avatar !== undefined) updateData.avatar = avatar;

    const conversation = await ConversationService.updateGroup({
      conversationId,
      userId,
      updateData,
    });

    res.status(200).json({ success: true, conversation });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════════════
   POST /conversations/:conversationId/members/add — add member
   ═══════════════════════════════════════════════════════════ */
const addMember = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.userId;
    const { userId: newMemberId } = req.body;

    if (!conversationId)
      throw createHttpError.BadRequest("Conversation ID is required");
    if (!newMemberId)
      throw createHttpError.BadRequest("New member ID is required");

    const conversation = await ConversationService.addMember({
      conversationId,
      userId,
      newMemberId,
    });

    res.status(200).json({ success: true, conversation });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════════════
   POST /conversations/:conversationId/members/remove — remove member
   ═══════════════════════════════════════════════════════════ */
const removeMember = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.userId;
    const { userId: memberToRemoveId } = req.body;

    if (!conversationId)
      throw createHttpError.BadRequest("Conversation ID is required");
    if (!memberToRemoveId)
      throw createHttpError.BadRequest("Member ID is required");

    const conversation = await ConversationService.removeMember({
      conversationId,
      userId,
      memberToRemoveId,
    });

    res.status(200).json({ success: true, conversation });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════════════
   POST /conversations/:conversationId/members/:userId/make-admin
   ═══════════════════════════════════════════════════════════ */
const makeAdmin = async (req, res, next) => {
  try {
    const { conversationId, userId: targetUserId } = req.params;
    const requestUserId = req.user.userId;

    if (!conversationId)
      throw createHttpError.BadRequest("Conversation ID is required");
    if (!targetUserId)
      throw createHttpError.BadRequest("Target user ID is required");

    const conversation = await ConversationService.makeAdmin({
      conversationId,
      requestUserId,
      targetUserId,
    });

    res.status(200).json({ success: true, conversation });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════════════
   POST /conversations/:conversationId/members/:userId/remove-admin
   ═══════════════════════════════════════════════════════════ */
const removeAdmin = async (req, res, next) => {
  try {
    const { conversationId, userId: targetUserId } = req.params;
    const requestUserId = req.user.userId;

    if (!conversationId)
      throw createHttpError.BadRequest("Conversation ID is required");
    if (!targetUserId)
      throw createHttpError.BadRequest("Target user ID is required");

    const conversation = await ConversationService.removeAdmin({
      conversationId,
      requestUserId,
      targetUserId,
    });

    res.status(200).json({ success: true, conversation });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════════════
   POST /conversations/:conversationId/leave — leave group
   ═══════════════════════════════════════════════════════════ */
const leaveGroup = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.userId;
    const newOwnerId = req.body?.newOwnerId || undefined;

    if (!conversationId)
      throw createHttpError.BadRequest("Conversation ID is required");

    const conversation = await ConversationService.leaveGroup({
      conversationId,
      userId,
      newOwnerId,
    });

    res.status(200).json({ success: true, message: "Left group successfully" });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════════════
   POST /conversations/:conversationId/disband — disband group
   ═══════════════════════════════════════════════════════════ */
const disbandGroup = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.userId;

    if (!conversationId)
      throw createHttpError.BadRequest("Conversation ID is required");

    await ConversationService.disbandGroup({
      conversationId,
      userId,
    });

    res
      .status(200)
      .json({ success: true, message: "Group disbanded successfully" });
  } catch (error) {
    next(error);
  }
};

export const ConversationController = {
  getConversations,
  markAsRead,
  createConversation,
  getConversationMedia,
  updateGroup,
  addMember,
  removeMember,
  makeAdmin,
  removeAdmin,
  leaveGroup,
  disbandGroup,
};
