import express from "express";
import { checkAuth } from "../middlewares/auth.middleware.js";
import { AuthController } from "../controllers/index.js";

export const authRouter = express.Router();

authRouter.post("/login", AuthController.login);
authRouter.post("/google", AuthController.googleLogin);
authRouter.get("/me", checkAuth, AuthController.getMe);
authRouter.delete("/logout", AuthController.logout);
authRouter.put("/refresh-token", AuthController.handleRefreshToken);
