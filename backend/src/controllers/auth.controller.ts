import { Request, Response } from "express";
import bcrypt from "bcrypt";
import User from "../models/user.model";
import { generateToken } from "../utils/jwt";
import { signupService } from "../services/auth.service";
import { setCookieToken } from "../utils/setAuthCookies";
import { requestOtpService } from "../services/auth.service";
import { verifyOtpService } from "../services/auth.service";
import { SuccessResponse, ErrorResponse } from "../utils/responses";
import { JWTPayload } from "../utils/jwt";

declare global {
  namespace Express {
    interface Request {
      jwtUser?: JWTPayload;
    }
  }
}

export const requestOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    await requestOtpService(email);

    // Create a common class or funciton to generate response
    new SuccessResponse("OTP send successfully", { status: 201 }).send(res);
  } catch (err: any) {
    new ErrorResponse("Failed to send OTP", { status: 403 }).send(res);
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    const result = await verifyOtpService(email, otp);

    new SuccessResponse("OTP verified successfully", { data: result }).send(res);
  } catch (err: any) {
    new ErrorResponse("OTP verification failed", { status: 400 }).send(res);
  }
};

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user, token } = await signupService(req.body);
    setCookieToken(res, token);

    new SuccessResponse("Account created successfully", {
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      status: 201,
    }).send(res);
  } catch (err: any) {
    new ErrorResponse(err.message || "Signup failed", { status: 400 }).send(res);
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      new ErrorResponse("Email and password are required", { status: 400 }).send(res);
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      new ErrorResponse("Invalid email or password", { status: 401 }).send(res);
      return;
    }

    if (user.auth.provider !== "email" || !user.auth.passwordHash) {
      new ErrorResponse("Please login with Google", { status: 400 }).send(res);
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.auth.passwordHash);

    if (!isPasswordValid) {
      new ErrorResponse("Invalid email or password", { status: 401 }).send(res);
      return;
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    setCookieToken(res, token);

    new SuccessResponse("Login successful", {
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
          subscription: user.subscription,
        },
      },
    }).send(res);
  } catch (error) {
    console.error("Login error:", error);
    new ErrorResponse("Server error during login", { status: 500 }).send(res);
  }
};

export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  console.log("req came in");
  try {
    const user = await User.findById(req.jwtUser?.userId).select("-auth.password_hash");

    if (!user) {
      new ErrorResponse("User not found", { status: 404 }).send(res);
      return;
    }

    new SuccessResponse("User fetched successfully", { data: { user } }).send(res);
   
  } catch (error) {
    console.error("Get user error:", error);
    new ErrorResponse("Server error fetching user", { status: 500 }).send(res);
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  res.clearCookie("token");
  new SuccessResponse("Logged out successfully").send(res);
};
