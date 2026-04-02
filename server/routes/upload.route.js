import express from "express";
import {
  uploadDocument,
  uploadImages,
} from "../controllers/upload.controller.js";
import { checkAuth } from "../middlewares/auth.middleware.js";
import { uploadDoc, uploadImg } from "../middlewares/multer.middleware.js";

const uploadRouter = express.Router();
uploadRouter.use(checkAuth);

uploadRouter.post("/documents", uploadDoc.array("files", 10), uploadDocument);
uploadRouter.post("/images", uploadImg.array("files", 10), uploadImages);

export default uploadRouter;
