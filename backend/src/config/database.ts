import mongoose from "mongoose";
import { ENV } from "./env";
import logger from "../utils/logger";

const connectDB =async (): Promise<void> => {
  try {
    logger.info("MongoDB connection with retry");

    await mongoose.connect(ENV.DB.MONGODB_URI as string);

    logger.info("MongoDB is connected");
  } catch (error) {
    logger.error("MongoDB connection failed. Retrying in 5 seconds...");
    setTimeout(connectDB, 5000);
  }
};

mongoose.connection.on("error", (err: Error) => {
  logger.error(`MongoDB connection error: ${err.message}`);
});

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB is disconnected. Reconnecting...");
  setTimeout(connectDB, 5000);
});


export default connectDB;



