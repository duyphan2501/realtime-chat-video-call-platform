import { accessTokenExpiresIn, accessTokenTTL, refreshTokenTTL } from "../config/TTL.config.js";
import { verifyGoogleToken } from "../helpers/auth.helper.js";
import { generateAccessToken, setCookieWithToken } from "../helpers/jwt.helper.js";
import {googleLoginService, loginService} from "../services/auth.service.js";

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) throw CreateError.BadRequest("Email and password are required!");

    const result = await loginService(email, password);

    if (result.status !== 200) {
      return res.status(result.status).json(result.data);
    }

    const accessToken = await generateAccessToken(result.data.userId, accessTokenExpiresIn);
    setCookieWithToken(res, accessToken, "accessToken", accessTokenTTL); 
    setCookieWithToken(res, result.data.refreshToken, "refreshToken", refreshTokenTTL);

    return res.status(200).json({
      ...result.data,
      accessToken,
      success: true,
      isVerified: true
    });
  } catch (error) {
    next(error);
  }
};

const googleLogin = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) throw CreateError.BadRequest("Token is required!");

    const result = await googleLoginService(token);

    const accessToken = await generateAccessToken(result.data.userId, accessTokenExpiresIn);
    setCookieWithToken(res, accessToken, "accessToken", accessTokenTTL); 
    setCookieWithToken(res, result.data.refreshToken, "refreshToken", refreshTokenTTL);

    return res.status(200).json({
      ...result.data,
      accessToken,
      success: true,
      isVerified: true
    });
  } catch (error) {
    next(error);
  }
};


export { login, googleLogin };