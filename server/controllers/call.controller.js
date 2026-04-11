import createHttpError from "http-errors";
import { CallService } from "../services/index.js";

const rejectCall = async (req, res, next) => {
  try {
    const { userId } = req.user; 
    const { status } = req.body; 

    if (!userId) throw createHttpError.Unauthorized("Unauthorized");

    await CallService.rejectCall({
      senderId: userId,
      status: status || "rejected",
    });

    res.status(200).json({ message: "Call rejected successfully" });
  } catch (error) {
    next(error);
  }
};

const endCall = async (req, res, next) => {
  try {
    const { userId } = req.user;

    if (!userId) throw createHttpError.Unauthorized("Unauthorized");

    await CallService.endCall({
      senderId: userId,
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
