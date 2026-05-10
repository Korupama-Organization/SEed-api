import mongoose from "mongoose";
import { User } from "../models/User";
import { Job } from "../models/Job";
import { Counter } from "../models/Counter";

const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  try {
    const conn = await mongoose.connect(uri);
    await Promise.all([
      User.syncIndexes(),
      Job.syncIndexes(),
      Counter.syncIndexes(),
    ]);
    console.log(
      `MongoDB connected: ${conn.connection.host}/${conn.connection.name}`,
    );
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

// Graceful disconnect on app termination
process.on("SIGINT", async () => {
  await mongoose.disconnect();
  console.log("MongoDB disconnected on app termination");
  process.exit(0);
});

export default connectDB;
