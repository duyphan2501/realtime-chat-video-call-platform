const refreshTokenTTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const accessTokenTTL = 15 * 60 * 1000; // 15 minutes in milliseconds
const accessTokenExpiresIn = "15m";
const refreshTokenExpiresIn = "7d";
export { refreshTokenTTL, accessTokenTTL, accessTokenExpiresIn, refreshTokenExpiresIn };