import express from "express";
import { checkAuth } from "../middlewares/auth.middleware.js";
import { ConversationController } from "../controllers/index.js";

export const conversationRouter = express.Router();
conversationRouter.use(checkAuth);

conversationRouter.get("/", ConversationController.getConversations);
conversationRouter.post("/:id/read", ConversationController.markAsRead);
conversationRouter.get("/:id/media", ConversationController.getConversationMedia);
conversationRouter.post("/create", ConversationController.createConversation);
