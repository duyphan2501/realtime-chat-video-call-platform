import createHttpError from "http-errors";
import { ConversationService } from "../services/conversation.service.js";

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

const markAsRead = async(req, res, next) => {
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

export { getConversations, markAsRead };
