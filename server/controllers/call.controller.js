import createHttpError from "http-errors";
import { CallService } from "../services/index.js";

const rejectCall = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.user;
    const { targetUserId, ownerId, type, status } = req.body;
    if (!conversationId || !targetUserId || !type)
      throw createHttpError.BadRequest(
        "ConversationId, targetUserId, and type are required",
      );
    if (!userId) throw createHttpError.Unauthorized("Unauthorized");

    await CallService.rejectCall({
      targetUserId,
      senderId: ownerId || userId,
      conversationId,
      type,
      status,
    });

    res.status(200).json({ message: "Call rejected successfully" });
  } catch (error) {
    next(error);
  }
};

const endCall = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.user;
    const { targetUserId, ownerId, type, duration } = req.body;

    if (!conversationId || !targetUserId || !type || duration === undefined)
      throw createHttpError.BadRequest(
        "ConversationId, targetUserId, type, and duration are required",
      );
    if (!userId) throw createHttpError.Unauthorized("Unauthorized");

    await CallService.endCall({
      targetUserId,
      senderId: ownerId || userId,
      conversationId,
      type,
      duration,
    });

    res.status(200).json({ message: "Call ended successfully" });
  } catch (error) {
    next(error);
  }
};

export const CallController = {
  rejectCall,
  endCall,
};
