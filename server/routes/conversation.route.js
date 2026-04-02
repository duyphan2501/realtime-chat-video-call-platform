import express from "express";
import { checkAuth } from "../middlewares/auth.middleware.js";
import { createConversation, getConversations, markAsRead } from "../controllers/conversation.controller.js";

const conversationRouter = express.Router();
conversationRouter.use(checkAuth)

conversationRouter.get("/", getConversations);
conversationRouter.post("/:id/read", markAsRead);
conversationRouter.post("/create", createConversation);

export default conversationRouter;
