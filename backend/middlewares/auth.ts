import { NextFunction, Request, Response } from "express";
// import express, { NextFunction, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
import { redis } from "../utils/redis";
dotenv.config();
export const isAuthenticated = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const access_token = req.cookies.access_token;

  if (!access_token) {
    return next(new Error("Please login to access"));
  }

  const decoded = jwt.verify(
    access_token,
    process.env.ACCESS_TOKEN as string
  ) as JwtPayload;

  if (!decoded) {
    return next(new Error("Access token is not valid"));
  }

  const user = await redis.get(decoded.id);
  console.log("user from redis:", user);

  if (!user) {
    return next(new Error("User not found"));
  }

  (req as any).user = JSON.parse(user);
  next();
};
