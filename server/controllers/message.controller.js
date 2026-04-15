import createHttpError from "http-errors";
import { MessageService } from "../services/index.js";
import { ConversationService } from "../services/index.js";

const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    if (!conversationId)
      throw createHttpError.BadRequest("ConversationId is required");
    const { cursor } = req.query;
    const limit = parseInt(req.query.limit) || 20;
    if (limit > 100) limit = 100;
    const userId = req.user.userId;

    const resData = await MessageService.getMessages({
      conversationId,
      cursor,
      limit,
      currentUserId: userId,
    });
    return res.status(200).json(resData);
  } catch (error) {
    next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const { content, type, attachments, tempId, receiverId } = req.body;
    let { conversationId } = req.body;
    if (!type || !tempId)
      throw createHttpError.BadRequest(
        "ConversationId, type, tempId are required",
      );

    if (!conversationId && !receiverId)
      throw createHttpError.BadRequest(
        "ConversationId or receiverId is required",
      );

    if (!content && attachments.length === 0)
      throw createHttpError.BadRequest("Message is empty");

    const senderId = req.user.userId;
    if (!senderId) throw createHttpError.Unauthorized("Unauthorized");

    if (!conversationId) {
      const newConveration = await ConversationService.createConversation({
        type: "direct",
        participantIds: [senderId, receiverId],
        creatorId: senderId,
      });
      conversationId = newConveration._id;
    }

    const newMessage = await MessageService.sendMessage({
      conversationId,
      senderId,
      content,
      type,
      attachments,
      tempId,
    });

    res.status(201).json({
      data: newMessage,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const MessageController = { getMessages, sendMessage };
