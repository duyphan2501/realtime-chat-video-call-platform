import express from "express";
import { checkAuth } from "../middlewares/auth.middleware.js";
import * as userController from "../controllers/user.controller.js";

const userRouter = express.Router();

// All routes require authentication
userRouter.use(checkAuth);

/* ── Profile ──────────────────────────────────────── */
userRouter.get("/me", userController.getMe);
userRouter.put("/me", userController.updateMe);

/* ── Search ────────────────────────────────────────── */
userRouter.get("/search", userController.searchUsers);
userRouter.get("/search/friends", userController.searchOnlyFriends);

/* ── Friends ──────────────────────────────────────── */
userRouter.get("/friends", userController.getFriends);
userRouter.get("/friend-requests", userController.getFriendRequests);

/* ── Friend Request Actions ───────────────────────── */
userRouter.post("/friend-request/:userId", userController.sendFriendRequest);
userRouter.post("/friend-request/:userId/accept", userController.acceptFriendRequest);
userRouter.delete("/friend-request/:userId/reject", userController.rejectFriendRequest);

/* ── Unfriend ─────────────────────────────────────── */
userRouter.delete("/friends/:userId", userController.unfriend);

export default userRouter;
