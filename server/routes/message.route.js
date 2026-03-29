import express from "express";
import { checkAuth } from "../middlewares/auth.middleware.js";
import { getMessages, sendMessage, uploadDocument, uploadImages } from "../controllers/message.controller.js";
import { uploadDoc, uploadImg } from "../middlewares/multer.middleware.js";

const messageRouter = express.Router();
messageRouter.use(checkAuth)

messageRouter.get("/:conversationId", getMessages)
messageRouter.post("/send", sendMessage)
messageRouter.post("/upload-images", uploadImg.array('files', 10), uploadImages);
messageRouter.post("/upload-documents", uploadDoc.array('files', 10), uploadDocument);

export default messageRouter;
