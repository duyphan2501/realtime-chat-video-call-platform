import ENV from "./utils/env.util.js";
import errorHandler from "./middlewares/errorHandler.middleware.js";
import connectToDB from "./database/connectMongoDB.js";
import express from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import cors from "cors";
import { initSocket } from "./sockets/index.js";
import http from "http";
import { connectRedis } from "./config/redis.config.js";
import {
  authRouter,
  userRouter,
  conversationRouter,
  messageRouter,
  uploadRouter,
  callRouter,
} from "./routes/index.js";

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
await connectRedis();
initSocket(server, ENV.CLIENT_URL);

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/conversations", conversationRouter);
app.use("/api/messages", messageRouter);
app.use("/api/uploads", uploadRouter);
app.use("/api/calls", callRouter);

app.use(errorHandler);

const PORT = ENV.PORT || 8000;

server.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  await connectToDB();
});
