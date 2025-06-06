import { NextFunction, Request, Response } from "express";
import { IUser, User } from "../models/user.model";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import dotenv from "dotenv";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";
import {
  accessTokenOptions,
  refreshTokenOptions,
  sendToken,
} from "../utils/jwt";
import { redis } from "../utils/redis";
import { getUserById } from "../services/user.service";

dotenv.config();

interface IRegistrationBody {
  username: string;
  email: string;
  password: string;
  avatar?: string;
}

export const signup = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    const isEmailExist = await User.findOne({ email });

    if (isEmailExist) {
      throw new Error("Email already exist");
    }

    const user: IRegistrationBody = {
      username,
      email,
      password,
    };

    const activationToken = createActivationToken(user);
    const activationCode = activationToken.activationCode;
    const data = { user: { username: user.username }, activationCode };

    await ejs.renderFile(
      path.join(__dirname, "../mails/activation-mail.ejs"),
      data
    );

    await sendMail({
      email: user.email,
      subject: "Activate your account",
      template: "activation-mail.ejs",
      data,
    });

    res.status(201).json({
      success: true,
      message: `Please check your email: ${user.email} to activate your account`,
      activationToken: activationToken.token,
    });
  } catch (error: any) {
    throw new Error(error.message);
  }
};

interface IActivationToken {
  token: string;
  activationCode: string;
}

export const createActivationToken = (
  user: IRegistrationBody
): IActivationToken => {
  const activationCode = Math.floor(1000 * Math.random() * 9000).toString();

  const token = jwt.sign(
    { user, activationCode },
    process.env.ACTIVATION_SECRET_KEY as Secret,
    { expiresIn: "5m" }
  );
  return { token, activationCode };
};

interface IActivationRequest {
  activation_token: string;
  activation_code: string;
}

export const activateUser = async (req: Request, res: Response) => {
  try {
    const { activation_token, activation_code } =
      req.body as IActivationRequest;

    const newUser: { user: IUser; activationCode: string } = jwt.verify(
      activation_token,
      process.env.ACTIVATION_SECRET_KEY as string
    ) as { user: IUser; activationCode: string };

    if (newUser.activationCode !== activation_code) {
      throw new Error("Invalid activation code");
    }

    const { username, email, password } = newUser.user;

    const existUser = await User.findOne({ email });

    if (existUser) {
      throw new Error("Email already exist");
    }

    const user = await User.create({
      username,
      email,
      password,
    });
    res.status(201).json({ success: true });
  } catch (error: any) {
    throw new Error(error.message);
  }
};

interface ILoginRequest {
  email: string;
  password: string;
}

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body as ILoginRequest;
    if (!email || !password) {
      return next(new Error("Please enter email and password"));
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return next(new Error("Invalid email or password"));
    }

    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return next(new Error("Invalid email or password"));
    }

    sendToken(user, 200, res);
  } catch (error: any) {
    return next(new Error(error.message));
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.cookie("access_token", "", { maxAge: 1 });
    res.cookie("refresh_token", "", { maxAge: 1 });

    const userId = (req as any).user?.id || "";
    redis.del(userId);

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error: any) {
    return next(new Error(error.message));
  }
};

export const updateAccessToken = async (req: Request, res: Response) => {
  try {
    const refresh_token = req.cookies.refresh_token as string;
    const decoded = jwt.verify(
      refresh_token,
      process.env.REFRESH_TOKEN as string
    ) as JwtPayload;
    if (!decoded) {
      throw new Error("Could not refresh token");
    }
    const session = await redis.get(decoded.id as string);
    if (!session) {
      throw new Error("Could not refresh token");
    }
    const user = JSON.parse(session);

    const accessToken = jwt.sign(
      { id: user._id },
      process.env.ACCESS_TOKEN as string,
      { expiresIn: "5m" }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.REFRESH_TOKEN as string,
      { expiresIn: "3d" }
    );

    (req as any).user = user;

    res.cookie("access_token", accessToken, accessTokenOptions);
    res.cookie("refresh_token", refreshToken, refreshTokenOptions);

    res.status(200).json({
      status: "success",
      accessToken,
    });
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const getUserInfor = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?._id;
    getUserById(userId, res);
    // const userId=await getUserById(req.params.id)
    //  res.status(200).json({
    //   success: true,
    //   userId,
    // });
  } catch (error: any) {
    throw new Error(error.message);
  }
};

interface ISocialLoginBody {
  username: string;
  email: string;
  avatar: string;
}

export const socialLogin = async (req: Request, res: Response) => {
  try {
    const { username, email, avatar } = req.body as ISocialLoginBody;
    const user = await User.findOne({ email });
    if (!user) {
      const newUser = await User.create({ username, email, avatar });
      sendToken(newUser, 200, res);
    } else {
      sendToken(user, 200, res);
    }
  } catch (error: any) {
    throw new Error(error.message);
  }
};

interface IUpdateUserInfo {
  username?: string;
  email?: string;
}

export const updateUserInfo = async (req: Request, res: Response) => {
  try {
    const { username, email } = req.body as IUpdateUserInfo;
    const userId = (req as any).user?._id;
    const user = await User.findById(userId);
    if (email && user) {
      const isEmailExist = await User.findOne({ email });
      if (isEmailExist) {
        res.status(400).json({ message: "Email already exist" });
      }
      user.email = email;
    }
    if (username && user) {
      user.username = username;
    }
    await user?.save();

    await redis.set(userId, JSON.stringify(user));

    res.status(201).json({ success: true, user });
  } catch (error: any) {
    console.log(error.message);
  }
};

// export const authorizeRoles=(...roles:string[])=>{
//   return (req:Request,res:Response,next:NextFunction)=>{
//     if(!roles.includes(req.user?.role))
//   }
// }
