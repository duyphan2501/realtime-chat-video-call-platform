import express from "express";
import { checkAuth } from "../middlewares/auth.middleware.js";
import { getMessages, sendMessage } from "../controllers/message.controller.js";

const messageRouter = express.Router();
messageRouter.use(checkAuth);

messageRouter.get("/:conversationId", getMessages);
messageRouter.post("/send", sendMessage);

export default messageRouter;
