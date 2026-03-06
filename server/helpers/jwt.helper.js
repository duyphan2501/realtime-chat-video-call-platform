import jwt from "jsonwebtoken";
import ENV from "../utils/env.util.js";

const generateAccessToken = async (payload, expire = "15m") => {
  const token = await new Promise((resolve, reject) => {
    jwt.sign(
      payload,
      ENV.ACCESS_TOKEN_SECRET_KEY,
      { expiresIn: expire },
      (err, token) => {
        if (err) reject(err);
        else resolve(token);
      },
    );
  });
  return token;
};

const generateRefreshToken = async (payload, expire = "7d") => {
  const token = await new Promise((resolve, reject) => {
    jwt.sign(
      payload,
      ENV.REFRESH_TOKEN_SECRET_KEY,
      { expiresIn: expire },
      (err, token) => {
        if (err) reject(err);
        else resolve(token);
      },
    );
  });

  return token;
};

const setCookieWithToken = (res, token, name, ttl) => {
  res.cookie(name, token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: ttl,
  });
};

const verifyRefreshToken = async (refreshToken) => {
  return new Promise((resolve, reject) => {
    jwt.verify(refreshToken, ENV.REFRESH_TOKEN_SECRET_KEY, (err, payload) => {
      if (err) return reject(err);
      return resolve(payload);
    });
  });
};

const verifyAccessToken = async (accessToken) => {
  return new Promise((resolve, reject) => {
    jwt.verify(accessToken, ENV.ACCESS_TOKEN_SECRET_KEY, (err, payload) => {
      if (err) return reject(err);
      return resolve(payload);
    });
  });
};

export {
  generateAccessToken,
  setCookieWithToken,
  generateRefreshToken,
  verifyRefreshToken,
  verifyAccessToken,
};
