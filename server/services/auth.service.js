import createHttpError from "http-errors";
import UserModel from "../models/user.model.js";
import {
  checkPassword,
  handleNewRefreshToken,
  verifyGoogleToken,
} from "../helpers/auth.helper.js";
import { verifyRefreshToken } from "../helpers/jwt.helper.js";
import { filterFieldUser } from "../utils/filter.util.js";

const loginService = async (email, password) => {
  const foundUser = await UserModel.findOne({ email });

  if (!foundUser) throw createHttpError.NotFound("Account does not exist!");

  if (!foundUser.isVerified) {
    throw createHttpError.Unauthorized("Account not verified");
  }

  if (foundUser.status === "inactive")
    throw createHttpError.Forbidden("Account disabled");

  const isCorrectPassword = await checkPassword(password, foundUser.password);

  if (!isCorrectPassword)
    throw createHttpError.Unauthorized("Incorrect password");

  const refreshToken = await handleNewRefreshToken(foundUser);

  return {
    message: "Login successfully!",
    user: filterFieldUser(foundUser),
    refreshToken,
    userId: foundUser._id,
  };
};

const googleLoginService = async (token) => {
  const payload = await verifyGoogleToken(token);

  const userData = {
    email: payload.email,
    name: payload.name,
    password: "google",
    isVerified: true,
  };

  let foundUser = await UserModel.findOne({ email: userData.email });

  if (!foundUser) {
    foundUser = await UserModel.create(userData);

    if (!foundUser)
      throw createHttpError.InternalServerError("Failed to create user");
  }

  const refreshToken = await handleNewRefreshToken(foundUser);

  return {
    message: "Login successfully!",
    user: filterFieldUser(foundUser),
    refreshToken,
    userId: foundUser._id,
  };
};

const refreshTokenService = async (token) => {
  if (!token) throw createHttpError.Unauthorized("Refresh token missing");

  const decoded = await verifyRefreshToken(token);

  if (!decoded) throw createHttpError.Unauthorized("Invalid decoded token");

  const user = await UserModel.findOne({
    _id: decoded.userId,
    refreshTokenExpireAt: { $gte: new Date() },
  });

  if (!user || user.refreshToken !== token)
    throw createHttpError.Unauthorized("Refresh token expired");

  const newRefreshToken = await handleNewRefreshToken(user);

  return {
    message: "Refresh token successfully",
    user: filterFieldUser(user),
    refreshToken: newRefreshToken,
    userId: user._id,
  };
};

export { loginService, googleLoginService, refreshTokenService };
