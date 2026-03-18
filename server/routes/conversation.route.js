import express from "express";
import { checkAuth } from "../middlewares/auth.middleware.js";
import { getConversations } from "../controllers/conversation.controller.js";

const conversationRouter = express.Router();

conversationRouter.get("/", checkAuth, getConversations);

export default conversationRouter;
