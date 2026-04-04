import { AuthService } from "../services/index.js";
import createHttpError from "http-errors";
import { filterFieldUser } from "../utils/filter.util.js";
import { generateAccessTokenAndSetCookies } from "../helpers/auth.helper.js";

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      throw createHttpError.BadRequest("Email and password are required!");

    const result = await AuthService.login(email, password);

    const accessToken = await generateAccessTokenAndSetCookies(
      res,
      { userId: result.userId },
      result.refreshToken,
    );

    return res.status(200).json({
      ...result,
      accessToken,
      success: true,
      isVerified: true,
    });
  } catch (error) {
    next(error);
  }
};

const googleLogin = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) throw createHttpError.BadRequest("Token is required!");

    const result = await AuthService.googleLogin(token);

    const accessToken = await generateAccessTokenAndSetCookies(
      res,
      { userId: result.userId },
      result.refreshToken,
    );

    return res.status(200).json({
      ...result,
      accessToken,
      success: true,
      isVerified: true,
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    if (!userId) throw createHttpError.BadRequest("Userid is missing");

    const user = await AuthService.getUserById(userId);
    const accessToken = req.cookies.accessToken;

    return res.status(200).json({ user: filterFieldUser(user), accessToken });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    return res
      .status(200)
      .json({ message: "Logged out successfully", success: true });
  } catch (error) {
    next(error);
  }
};

const handleRefreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken)
      throw createHttpError.Unauthorized("No refreshToken provided");

    const result = await AuthService.refreshToken(refreshToken);

    const accessToken = await generateAccessTokenAndSetCookies(
      res,
      { userId: result.userId },
      result.refreshToken,
    );
    return res.status(200).json({
      ...result,
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

export const AuthController = {
  login,
  googleLogin,
  getMe,
  logout,
  handleRefreshToken,
};
