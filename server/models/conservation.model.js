// models/conversation.model.js
import mongoose from "mongoose";

const participantSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["member", "admin"], default: "member" },
    joinedAt: { type: Date, default: Date.now },
    lastRead: { type: Date, default: Date.now },
  },
  { _id: false },
);

const conversationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["direct", "group"], required: true },
    participants: { type: [participantSchema], required: true },
    name: { type: String, trim: true },
    avatar: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    lastMessageAt: { type: Date },
  },
  { timestamps: true },
);

conversationSchema.index({ "participants.user": 1, lastMessageAt: -1 });
conversationSchema.index(
  { type: 1, "participants.user": 1 },
  { partialFilterExpression: { type: "direct" } },
);

export const ConversationModel = mongoose.model("Conversation", conversationSchema);
