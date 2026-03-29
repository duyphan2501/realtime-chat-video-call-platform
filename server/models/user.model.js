import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    forgotPasswordToken: String,
    forgotPasswordTokenExpireAt: Date,
    verificationToken: String,
    verificationTokenExpireAt: Date,
    refreshToken: String,
    refreshTokenExpireAt: Date,
    avatar: String,
    isVerified: { type: Boolean, default: false },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    phone: String,
    lastActive: Date,
    bio: String,

    // Friends system
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    friendRequestsReceived: [{
      from: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      createdAt: { type: Date, default: Date.now }
    }],
    friendRequestsSent: [{
      to: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      createdAt: { type: Date, default: Date.now }
    }],
  },
  { timestamps: true, collection: "users" }
);

const UserModel = mongoose.model("User", userSchema);

export default UserModel;
