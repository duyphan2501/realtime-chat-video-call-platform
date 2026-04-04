const refreshTokenTTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const accessTokenTTL = 15 * 60 * 1000; // 15 minutes in milliseconds
const accessTokenExpiresIn = "15m";
const refreshTokenExpiresIn = "7d";

const CACHE_USER_PREFIX = "user:profile:";
const CACHE_USER_TTL = 3600; // 1 tiếng

export {
  refreshTokenTTL,
  accessTokenTTL,
  accessTokenExpiresIn,
  refreshTokenExpiresIn,
  CACHE_USER_PREFIX,
  CACHE_USER_TTL,
};
