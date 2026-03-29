import express from "express";
import { checkAuth } from "../middlewares/auth.middleware.js";
import { getConversations, markAsRead } from "../controllers/conversation.controller.js";

const conversationRouter = express.Router();
conversationRouter.use(checkAuth)

conversationRouter.get("/", getConversations);
conversationRouter.post("/:id/read", markAsRead);

export default conversationRouter;
