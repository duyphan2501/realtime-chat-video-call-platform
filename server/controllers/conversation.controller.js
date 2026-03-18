import createHttpError from "http-errors";
import { ConversationService } from "../services/conversation.service.js";

export const getConversations = async (req, res, next) => {
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
