import { Redis } from "ioredis";
import dotenv from "dotenv";
dotenv.config();

const redisClient = () => {
  if (process.env.REDIS_URL) {
    console.log("Redis connect succesfully");
    return process.env.REDIS_URL;
  }
  throw new Error("Redis connect fail");
};

export const redis = new Redis(redisClient());
