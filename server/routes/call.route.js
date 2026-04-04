import express from "express";
import { CallController } from "../controllers/index.js";
import { checkAuth } from "../middlewares/auth.middleware.js";

export const callRouter = express.Router();
callRouter.use(checkAuth);

callRouter.post("/:conversationId/reject", CallController.rejectCall);
callRouter.post("/:conversationId/end", CallController.endCall);

