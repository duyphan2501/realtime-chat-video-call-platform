import mongoose from "mongoose";
import ENV from "../utils/env.util.js";

const connectToDB = async () => {
  try {
    const mongoURI = ENV.MONGODB_URI;
    if (!mongoURI) throw new Error("Mongodb uri does not exist in .env file");
    await mongoose.connect(mongoURI);
    console.log("Connect to DB successfully");
  } catch (error) {
    console.log(error);
  }
};

export default connectToDB;
