import { redis } from "../utils/redis";

export const getUserById = async (id: string) => {
  const userJson = await redis.get(id);
  if (!userJson) return null;
  const user = JSON.parse(userJson);
  return user;
};
