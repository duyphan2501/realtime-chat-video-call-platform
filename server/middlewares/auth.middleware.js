import dotenv from "dotenv";
import { verifyAccessToken } from "../helpers/jwt.helper.js";
dotenv.config({ quiet: true });

const checkAuth = async (req, res, next) => {
  const accessToken =
    req.cookies.accessToken || req.headers?.authorization?.split(" ")[1];
  if (!accessToken)
    return res.status(401).json({
      message: "AccessToken is missing",
      success: false,
    });
  try {
    const decodedToken = await verifyAccessToken(accessToken);
    req.user = decodedToken;
    next();
  } catch (err) {
    return res.status(403).json({
      message: err.message || err,
      success: false,
    });
  }
};

export default checkAuth;
