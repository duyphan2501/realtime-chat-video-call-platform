import express from "express";
import { checkAuth } from "../middlewares/auth.middleware.js";
import { AuthController } from "../controllers/index.js";

export const authRouter = express.Router();

authRouter.post("/login", AuthController.login);
authRouter.post("/google", AuthController.googleLogin);
authRouter.get("/me", checkAuth, AuthController.getMe);
authRouter.delete("/logout", AuthController.logout);
authRouter.put("/refresh-token", AuthController.handleRefreshToken);
authRouter.post("/register", AuthController.register);
authRouter.post("/verify", AuthController.verifyEmail);
authRouter.post("/forgot-password", AuthController.forgotPassword);
authRouter.post("/reset-password", AuthController.resetPassword);
authRouter.put("/profile", checkAuth, AuthController.updateProfile);