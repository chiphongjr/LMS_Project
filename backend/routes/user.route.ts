import express from "express";
import {
  activateUser,
  changePassword,
  getUserInfor,
  login,
  logout,
  signup,
  socialLogin,
  updateAccessToken,
  updateUserInfo,
} from "../controllers/user.controller";
import { isAuthenticated } from "../middlewares/auth";

const userRouter = express.Router();

userRouter.post("/signup", signup);
userRouter.post("/activate-user", activateUser);
userRouter.post("/login", login);
userRouter.get("/logout", isAuthenticated, logout);
userRouter.get("/refresh-token", updateAccessToken);
userRouter.get("/me", isAuthenticated, getUserInfor);
userRouter.post("/social-login", socialLogin);
userRouter.put("/update-user", isAuthenticated, updateUserInfo);
userRouter.put("/change-password", isAuthenticated, changePassword);

export default userRouter;
