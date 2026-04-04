import bcrypt from "bcryptjs";
import ENV from "../utils/env.util.js";
import { OAuth2Client } from "google-auth-library";
import {
  accessTokenExpiresIn,
  accessTokenTTL,
  refreshTokenExpiresIn,
  refreshTokenTTL,
} from "../utils/constant.util.js";
import {
  generateAccessToken,
  generateRefreshToken,
  setCookieWithToken,
} from "./jwt.helper.js";

const checkPassword = (password, hashedPassword) => {
  return new Promise((resolve, reject) => {
    bcrypt.compare(password, hashedPassword, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

const hashPassword = (password) => {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(10, (err, salt) => {
      if (err) reject(err);
      bcrypt.hash(password, salt, (err, hash) => {
        if (err) reject(err);
        resolve(hash);
      });
    });
  });
};

const verifyGoogleToken = async (token) => {
  const clientId = ENV.GOOGLE_CLIENT_ID;
  const client = new OAuth2Client(clientId);

  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: clientId,
  });

  const payload = ticket.getPayload();

  return payload;
};

const handleNewRefreshToken = async (foundUser) => {
  const refreshToken = await generateRefreshToken(
    { userId: foundUser._id },
    refreshTokenExpiresIn,
  );

  foundUser.refreshToken = refreshToken;
  foundUser.refreshTokenExpireAt = new Date(Date.now() + refreshTokenTTL);

  await foundUser.save();

  return refreshToken;
};

const generateAccessTokenAndSetCookies = async (res, payload, refreshToken) => {
  const accessToken = await generateAccessToken(payload, accessTokenExpiresIn);
  setCookieWithToken(res, accessToken, "accessToken", accessTokenTTL);
  setCookieWithToken(res, refreshToken, "refreshToken", refreshTokenTTL);
  return accessToken;
};

export {
  checkPassword,
  hashPassword,
  verifyGoogleToken,
  handleNewRefreshToken,
  generateAccessTokenAndSetCookies,
};
