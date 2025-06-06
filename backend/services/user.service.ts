import { Response } from "express";
import { redis } from "../utils/redis";

export const getUserById = async (id: string, res: Response) => {
  const userJson = await redis.get(id);
  if (userJson) {
    const user = await JSON.parse(userJson);
    res.status(201).json({
      status: true,
      user,
    });
  }
};
