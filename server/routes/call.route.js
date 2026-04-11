import express from "express";
import { CallController } from "../controllers/index.js";
import { checkAuth } from "../middlewares/auth.middleware.js";

export const callRouter = express.Router();
callRouter.use(checkAuth);

callRouter.post("/reject", CallController.rejectCall);
callRouter.post("/end", CallController.endCall);

