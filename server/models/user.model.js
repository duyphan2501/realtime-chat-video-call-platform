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
    lastActive: { type: Date, default: Date.now },
    bio: String,
  },
  { timestamps: true, collection: "users" },
);

export const UserModel = mongoose.model("User", userSchema);
