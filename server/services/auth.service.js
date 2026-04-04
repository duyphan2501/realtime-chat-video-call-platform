import createHttpError from "http-errors";
import { UserModel } from "../models/index.js";
import { verifyRefreshToken } from "../helpers/jwt.helper.js";
import {
  checkPassword,
  handleNewRefreshToken,
  verifyGoogleToken,
} from "../helpers/auth.helper.js";
import { CACHE_USER_PREFIX, CACHE_USER_TTL } from "../utils/constant.util.js";

import { filterFieldUser } from "../utils/filter.util.js";
import { redisClient } from "../config/redis.config.js";

const cacheUserProfile = async (userId, userProfile) => {
  await redisClient.set(
    `${CACHE_USER_PREFIX}${userId}`,
    JSON.stringify(userProfile),
    { EX: CACHE_USER_TTL },
  );
};

const login = async (email, password) => {
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

  const userProfile = filterFieldUser(foundUser);

  await cacheUserProfile(foundUser._id, userProfile);

  return {
    message: "Login successfully!",
    user: userProfile,
    refreshToken,
    userId: foundUser._id,
  };
};

const googleLogin = async (token) => {
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

  const userProfile = filterFieldUser(foundUser);
  await cacheUserProfile(foundUser._id, userProfile);

  return {
    message: "Login successfully!",
    user: userProfile,
    refreshToken,
    userId: foundUser._id,
  };
};

const refreshToken = async (token) => {
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
  const userProfile = filterFieldUser(user);

  await cacheUserProfile(user._id, userProfile);
  return {
    message: "Refresh token successfully",
    user: userProfile,
    refreshToken: newRefreshToken,
    userId: user._id,
  };
};

const getUserById = async (id) => {
  const cachedUser = await redisClient.get(`${CACHE_USER_PREFIX}${id}`);
  if (cachedUser) return JSON.parse(cachedUser);

  const user = await UserModel.findOne({ _id: id, status: "active" }).lean();
  if (!user)
    throw createHttpError.NotFound("User does not exist or is inactive");

  const userProfile = filterFieldUser(user);

  await cacheUserProfile(id, userProfile);

  return userProfile;
};

export const AuthService = { login, googleLogin, refreshToken, getUserById };
