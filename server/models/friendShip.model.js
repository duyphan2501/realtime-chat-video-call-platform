import mongoose from "mongoose";

const friendshipSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enums: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true, _id: false, collection: "friendships" },
);

friendshipSchema.index({ requester: 1, recipient: 1 }, { unique: true });

export const FriendshipModel = mongoose.model("Friendship", friendshipSchema);
