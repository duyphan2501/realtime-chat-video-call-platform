import express from "express";
import { checkAuth } from "../middlewares/auth.middleware.js";
import { MessageController } from "../controllers/index.js";

export const messageRouter = express.Router();
messageRouter.use(checkAuth);

messageRouter.get("/:conversationId", MessageController.getMessages);
messageRouter.post("/send", MessageController.sendMessage);
