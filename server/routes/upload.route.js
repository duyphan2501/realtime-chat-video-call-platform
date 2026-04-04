import express from "express";
import { uploadDoc, uploadImg } from "../middlewares/multer.middleware.js";
import { UploadController } from "../controllers/index.js";
import { checkAuth } from "../middlewares/auth.middleware.js";

export const uploadRouter = express.Router();
uploadRouter.use(checkAuth);

uploadRouter.post(
  "/documents",
  uploadDoc.array("files", 10),
  UploadController.uploadDocument,
);
uploadRouter.post(
  "/images",
  uploadImg.array("files", 10),
  UploadController.uploadImages,
);
