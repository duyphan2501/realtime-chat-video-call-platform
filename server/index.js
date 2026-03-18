import ENV from "./utils/env.util.js";
import errorHandeler from "./middlewares/errorHandler.middleware.js";
import authRouter from "./routes/auth.route.js";
import connectToDB from "./database/connectMongoDB.js";
import { app, server } from "./config/socket.config.js";
import conversationRouter from "./routes/conversation.route.js";

app.use("/api/auth", authRouter);
app.use("/api/conversations", conversationRouter);

app.use(errorHandeler);

const PORT = ENV.PORT || 8000;

server.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  await connectToDB();
});
