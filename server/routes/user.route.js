import express from "express";
import { checkAuth } from "../middlewares/auth.middleware.js";
import { UserController } from "../controllers/index.js";

export const userRouter = express.Router();

userRouter.use(checkAuth);

/* ── Profile ──────────────────────────────────────── */
userRouter.get("/me", UserController.getMe);
userRouter.put("/me", UserController.updateMe);

/* ── Search ────────────────────────────────────────── */
userRouter.get("/search", UserController.searchUsers);
userRouter.get("/search/friends", UserController.searchOnlyFriends);

/* ── Friends ──────────────────────────────────────── */
userRouter.get("/friends", UserController.getFriends);
userRouter.get("/friend-requests", UserController.getFriendRequests);

/* ── Friend Request Actions ───────────────────────── */
userRouter.post("/friend-request/:userId", UserController.sendFriendRequest);
userRouter.post(
  "/friend-request/:userId/accept",
  UserController.acceptFriendRequest,
);
userRouter.delete(
  "/friend-request/:userId/reject",
  UserController.rejectFriendRequest,
);

/* ── Unfriend ─────────────────────────────────────── */
userRouter.delete("/friends/:userId", UserController.unfriend);
