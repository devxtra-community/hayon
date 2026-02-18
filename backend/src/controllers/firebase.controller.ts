import { Request, Response } from "express";
import { findUserByIdSafe, updateUser } from "../repositories/user.repository";
import { ErrorResponse, SuccessResponse } from "../utils/responses";
import logger from "../utils/logger";

export const saveToken = async (req: Request, res: Response) => {
  const { token } = req.body;
  const userId = req.auth?.id;

  if (!userId || !token) {
    return res.status(400).json({ message: "Missing userId or token" });
  }

  try {
    const user = await findUserByIdSafe(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await updateUser(userId, token);

    return new SuccessResponse("Token saved successfully", { data: token }).send(res);
  } catch (error) {
    logger.error("Error saving token", error);
    return new ErrorResponse("Server error").send(res);
  }
};

export const getToken = async (req: Request, res: Response) => {
  const userId = req.auth?.id as string;
  try {
    if (!userId) {
      return new ErrorResponse("User not found").send(res);
    }

    const user = await findUserByIdSafe(userId);
    if (!user) {
      return new ErrorResponse("User not found").send(res);
    }

    return new SuccessResponse("Token fetched successfully", { data: user.fcmTokens }).send(res);
  } catch (error) {
    logger.error("Error fetching token", error);
    return new ErrorResponse("Server error").send(res);
  }
};

export const sendPushToUser = async (req: Request, res: Response) => {
  return new ErrorResponse("Not implemented").send(res);
};
