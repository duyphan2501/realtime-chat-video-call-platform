import { refreshTokenExpiresIn, refreshTokenTTL } from "../config/TTL.config.js";
import createHttpError from "http-errors";
import UserModel from "../models/user.model.js";
import { checkPassword } from "../helpers/auth.helper.js";
import { generateRefreshToken } from "../helpers/jwt.helper.js";
import { filterFieldUser } from "../utils/filter.util.js";

const loginService = async (email, password) => {
  const foundUser = await UserModel.findOne({ email });
  if (!foundUser) throw createHttpError.NotFound("Account does not exist!");

  if (!foundUser.isVerified) {
    return {
      status: 401,
      data: {
        message: "Account not verified",
        user: filterFieldUser(foundUser),
        notVerified: true,
      },
    };
  }

  if (foundUser.status === "inactive") {
    return {
      status: 403,
      data: { message: "Account disabled", isInactive: true },
    };
  }
  const isCorrectPassword = foundUser.password === password;
//   const isCorrectPassword = await checkPassword(password, foundUser.password);
  if (!isCorrectPassword)
    throw createHttpError.Unauthorized("Incorrect password");

  // Logic xử lý Token & DB
  const refreshToken = await generateRefreshToken(foundUser._id, refreshTokenExpiresIn);
  foundUser.refreshToken = refreshToken;
  foundUser.refreshTokenExpireAt = new Date(Date.now() + refreshTokenTTL);
  await foundUser.save();

  return {
    status: 200,
    data: {
      message: "Login successfully!",
      user: filterFieldUser(foundUser),
      refreshToken, // Trả về để controller set cookie
      userId: foundUser._id,
    },
  };
};

export { loginService };
