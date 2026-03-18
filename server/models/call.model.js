// models/call.model.js
import mongoose from "mongoose";

const callParticipantSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    joinedAt: { type: Date },
    leftAt: { type: Date },
  },
  { _id: false },
);

const callSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    initiator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: { type: String, enum: ["video", "audio"], required: true },
    status: {
      type: String,
      enum: ["pending", "active", "ended", "missed", "declined"],
      default: "pending",
    },
    participants: { type: [callParticipantSchema], default: [] },
    startedAt: { type: Date },
    endedAt: { type: Date },
    duration: { type: Number }, // seconds, tính khi end
  },
  { timestamps: true },
);

callSchema.index({ conversation: 1, createdAt: -1 });
callSchema.index(
  { status: 1 },
  { partialFilterExpression: { status: "active" } },
);

export const CallModel = mongoose.model("Call", callSchema);
