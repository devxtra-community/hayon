import { Request, Response } from "express";
import {
  getCurrentUserService,
  loginService,
  logoutService,
  refreshService,
  signupService,
  sendResetPasswordEmailService,
  adminLoginService,
  getDevicesService,
  logoutDeviceService,
} from "../services/auth.service";
import { requestOtpService } from "../services/auth.service";
import { verifyOtpService } from "../services/auth.service";
import { SuccessResponse, ErrorResponse } from "../utils/responses";
import { setRefreshTokenCookie } from "../utils/setAuthCookies";
import { ENV } from "../config/env";
import { logoutAllService } from "../services/auth.service";
import logger from "../utils/logger";
import { resetPasswordService } from "../services/auth.service";

export const requestOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    await requestOtpService(email);

    // Create a common class or funciton to generate response
    new SuccessResponse("OTP send successfully", { status: 201 }).send(res);
  } catch (err: any) {
    logger.error(err);
    new ErrorResponse(err.message || "Failed to send OTP", { status: 403 }).send(res);
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    const result = await verifyOtpService(email, otp);

    new SuccessResponse("OTP verified successfully", { data: result }).send(res);
  } catch (err: any) {
    new ErrorResponse(err.message || "OTP verification failed", { status: 400 }).send(res);
  }
};

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user, accessToken, refreshToken } = await signupService(
      req.body,
      req?.auth?.id,
      req.ip,
      req.headers["user-agent"],
    );

    setRefreshTokenCookie(res, refreshToken);

    new SuccessResponse("Account created successfully", {
      status: 201,
      data: {
        accessToken, // client stores in memory
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    }).send(res);
  } catch (err: any) {
    new ErrorResponse(err.message || "Signup failed", {
      status: 400,
    }).send(res);
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const existingRefreshToken = req.cookies.refreshToken;
    if (existingRefreshToken) {
      await logoutService(existingRefreshToken).catch((err) => {
        logger.error(`Failed to revoke existing token on login: ${err.message}`);
      });
    }

    const { user, accessToken, refreshToken } = await loginService(
      req.body,
      req.ip,
      req.headers["user-agent"],
    );

    setRefreshTokenCookie(res, refreshToken);

    new SuccessResponse("Login successful", {
      data: {
        accessToken, // client keeps in memory
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
  } catch (err: any) {
    new ErrorResponse(err.message || "Login failed", {
      status: 401,
    }).send(res);
  }
};

export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const existingRefreshToken = req.cookies.refreshToken;
    if (existingRefreshToken) {
      await logoutService(existingRefreshToken).catch((err) => {
        logger.error(`Failed to revoke existing token on admin login: ${err.message}`);
      });
    }

    const { user, accessToken, refreshToken } = await adminLoginService(
      req.body,
      req.ip,
      req.headers["user-agent"],
    );
    logger.info(`Admin login attempt for user: ${user.email}`);
    setRefreshTokenCookie(res, refreshToken);

    new SuccessResponse("Login successful", {
      data: {
        accessToken, // client keeps in memory
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
  } catch (err: any) {
    new ErrorResponse(err.message || "Login failed", {
      status: 401,
    }).send(res);
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      new ErrorResponse("No refresh token provided", {
        status: 401,
      }).send(res);
      return;
    }

    const { accessToken, refreshToken: newRefreshToken } = await refreshService(
      refreshToken,
      req.ip,
      req.headers["user-agent"],
    );

    setRefreshTokenCookie(res, newRefreshToken);

    new SuccessResponse("Token refreshed", {
      data: { accessToken },
    }).send(res);
  } catch (err: any) {
    new ErrorResponse(err.message || "Invalid refresh token", {
      status: 401,
    }).send(res);
  }
};

export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.auth) {
      new ErrorResponse("Unauthorized", { status: 401 }).send(res);
      return;
    }
    const user = await getCurrentUserService(req.auth.id);

    new SuccessResponse("User fetched successfully", {
      data: { user },
    }).send(res);
  } catch (err: any) {
    new ErrorResponse(err.message || "Failed to fetch user", {
      status: 500,
    }).send(res);
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    await logoutService(refreshToken);
  }

  // Clear cookie with SAME path as set
  res.clearCookie("refreshToken", {
    path: "/api/auth",
    httpOnly: true,
    secure: ENV.APP.NODE_ENV === "production",
    sameSite: "lax",
  });

  new SuccessResponse("Logged out successfully").send(res);
};

export const logoutAll = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.auth) {
      new ErrorResponse("Unauthorized", { status: 401 }).send(res);
      return;
    }

    await logoutAllService(req.auth.id);

    // Clear current refresh token cookie
    res.clearCookie("refreshToken", {
      path: "/api/auth",
      httpOnly: true,
      secure: ENV.APP.NODE_ENV === "production",
      sameSite: "lax",
    });

    new SuccessResponse("Logged out from all devices").send(res);
  } catch (err: any) {
    new ErrorResponse(err.message || "Logout failed", {
      status: 500,
    }).send(res);
  }
};

//  reset password controller to be implemented

export const sendRsetPasswordEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    // Call the service to send reset password email
    await sendResetPasswordEmailService(email);
    new SuccessResponse("Password reset email sent successfully").send(res);
  } catch (err: any) {
    logger.error(err);
    new ErrorResponse(err.message || "Failed to send password reset email", { status: 500 }).send(
      res,
    );
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password, email } = req.body;
    await resetPasswordService(email, password, token);
    new SuccessResponse("Password has been reset successfully").send(res);
  } catch (err: any) {
    logger.error(err);
    new ErrorResponse(err.message || "Failed to reset password", { status: 500 }).send(res);
  }
};

export const getDevices = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.auth) {
      new ErrorResponse("Unauthorized", { status: 401 }).send(res);
      return;
    }
    const currentRefreshToken = req.cookies.refreshToken;
    const devices = await getDevicesService(req.auth.id, currentRefreshToken);
    new SuccessResponse("Devices fetched successfully", { data: devices }).send(res);
  } catch (err: any) {
    new ErrorResponse(err.message || "Failed to fetch devices", { status: 500 }).send(res);
  }
};

export const logoutDevice = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.auth) {
      new ErrorResponse("Unauthorized", { status: 401 }).send(res);
      return;
    }
    const { tokenId } = req.params;
    await logoutDeviceService(req.auth.id, tokenId);
    new SuccessResponse("Device logged out successfully").send(res);
  } catch (err: any) {
    new ErrorResponse(err.message || "Failed to logout device", { status: 500 }).send(res);
  }
};
