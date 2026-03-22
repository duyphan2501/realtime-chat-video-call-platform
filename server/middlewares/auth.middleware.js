import { verifyAccessToken } from "../helpers/jwt.helper.js";

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
    return res.status(401).json({
      message: err.message || err,
      success: false,
    });
  }
};

const socketAuth = async (socket, next) => {
  try {
    const cookieString = socket.handshake.headers.cookie;

    let token =
      socket.handshake.auth.token ||
      cookieString
        ?.split("; ")
        .find((row) => row.startsWith("accessToken"))
        ?.split("=")[1];

    let payload;
    try {
      payload = await verifyAccessToken(token);
    } catch (err) {
      if (err.message === "jwt expired") {
        return next(new Error("TOKEN_EXPIRED"));
      }
      return next(new Error("INVALID_TOKEN"));
    }

    socket.userId = payload.userId;
    next();
  } catch (error) {
    console.log("SocketAuthError:", error);
    next(new Error("AUTH_ERROR"));
  }
};

export { checkAuth, socketAuth };
