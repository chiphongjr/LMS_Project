import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("Connect db successfully");
  } catch (error: any) {
    console.log("Connect db fail",error.message);
  }
};
