import { Request, Response } from "express";
import { ErrorResponse, SuccessResponse } from "../utils/responses";
import logger from "../utils/logger";
import { findPlatformAccountByUserId } from "../repositories/platform.repository";

// =================  PLATFORM ACCOUNTS CONTROLLER (RELATED TO ALL) =================//

export const findPlatformAccounts = async (req: Request, res: Response) => {
  try {
    const platformAccount = await findPlatformAccountByUserId(req?.auth?.id as string);
    return new SuccessResponse("Platform accounts found", { data: platformAccount }).send(res);
  } catch (error) {
    logger.error(error);
    return new ErrorResponse("Failed to find platform accounts", { status: 500 }).send(res);
  }
};

// =================  PLATFORM ACCOUNTS CONTROLLER (RELATED TO ALL) =================//
