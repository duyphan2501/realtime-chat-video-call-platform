import ENV from "./utils/env.util.js";
import errorHandeler from "./middlewares/errorHandler.middleware.js";
import authRouter from "./routes/auth.route.js";
import userRouter from "./routes/user.route.js";
import connectToDB from "./database/connectMongoDB.js";
import conversationRouter from "./routes/conversation.route.js";
import express from "express"
import cookieParser from "cookie-parser";
import morgan from "morgan";
import cors from "cors";
import { initSocket } from "./sockets/index.js";
import http from "http"

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: ENV.CLIENT_URL,
    credentials: true,
  }),
);

const server = http.createServer(app);
initSocket(server, ENV.CLIENT_URL)

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/conversations", conversationRouter);

app.use(errorHandeler);

const PORT = ENV.PORT || 8000;

server.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  await connectToDB();
});
