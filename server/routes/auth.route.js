import express from "express";
import { getMe, googleLogin, handleRefreshToken, login, logout } from "../controllers/auth.controller.js";
import { checkAuth } from "../middlewares/auth.middleware.js";

const authRouter = express.Router();

authRouter.post("/login", login);
authRouter.post("/google", googleLogin);
authRouter.get("/me", checkAuth, getMe);
authRouter.delete("/logout", logout);
authRouter.put("/refresh-token", handleRefreshToken);

export default authRouter;
