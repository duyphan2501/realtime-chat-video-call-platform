import express from "express";
import { checkAuth } from "../middlewares/auth.middleware.js";
import { ConversationController } from "../controllers/index.js";

export const conversationRouter = express.Router();
conversationRouter.use(checkAuth);

conversationRouter.get("/", ConversationController.getConversations);
conversationRouter.post("/:id/read", ConversationController.markAsRead);
conversationRouter.get(
  "/:id/media",
  ConversationController.getConversationMedia,
);
conversationRouter.post("/create", ConversationController.createConversation);

/* ── Group Management ─────────────────────────────── */
conversationRouter.put("/:conversationId", ConversationController.updateGroup);
conversationRouter.post(
  "/:conversationId/members/add",
  ConversationController.addMember,
);
conversationRouter.post(
  "/:conversationId/members/remove",
  ConversationController.removeMember,
);
conversationRouter.post(
  "/:conversationId/members/:userId/make-admin",
  ConversationController.makeAdmin,
);
conversationRouter.post(
  "/:conversationId/members/:userId/remove-admin",
  ConversationController.removeAdmin,
);
conversationRouter.post(
  "/:conversationId/leave",
  ConversationController.leaveGroup,
);
conversationRouter.post(
  "/:conversationId/disband",
  ConversationController.disbandGroup,
);
