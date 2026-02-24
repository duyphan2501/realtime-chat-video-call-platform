import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import ENV from "./utils/env.util.js";
import errorHandeler from "./middlewares/errorHandler.middleware.js";
import authRouter from "./routes/auth.route.js";
import connectToDB from "./database/connectMongoDB.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  }),
);

//routes
app.use("/api/auth", authRouter);

app.use(errorHandeler);

const PORT = ENV.PORT || 8000;

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  await connectToDB();
});
