import { createBlueskyAgent } from "../services/blueSky.service";
import { Request, Response } from "express";
import { ErrorResponse, SuccessResponse } from "../utils/responses";
import logger from "../utils/logger";
import {
  findPlatformAccountByUserId,
  updateBlueskyDetails,
} from "../repositories/platform.repository";

// ================= BLUESKY CONTROLLER =================//

export const connectBluesky = async (req: Request, res: Response) => {
  try {
    const { identifier, appPassword } = req.body;
    logger.info(`Connecting to Bluesky for identifier: ${identifier}, appPassword: ${appPassword}`);

    if (!identifier || !appPassword) {
      return new ErrorResponse("Missing identifier or app password", { status: 400 }).send(res);
    }

    const agent = createBlueskyAgent();

    // 🔑 CREATE  SESSION
    const session = await agent.login({
      identifier: identifier,
      password: appPassword,
    });

    const profileRes = await agent.api.app.bsky.actor.getProfile({
      actor: session.data.did,
    });

    const profile = profileRes.data;
    const blueskySession = session.data;

    // 💾 STORE TOKENS (DB)

    if (!req.auth) {
      return new ErrorResponse("User not authenticated", { status: 401 }).send(res);
    }

    await updateBlueskyDetails(req.auth.id, {
      connected: true,
      did: blueskySession.did,
      handle: blueskySession.handle,
      auth: {
        accessJwt: blueskySession.accessJwt,
        refreshJwt: blueskySession.refreshJwt,
      },
      profile: {
        displayName: profile.displayName,
        description: profile.description,
        avatar: profile.avatar,
      },
    });

    return new SuccessResponse("Bluesky connected successfully", { data: profile }).send(res);
  } catch (error) {
    logger.error(error);
    return new ErrorResponse("Failed to connect to Bluesky", { status: 500 }).send(res);
  }
};

export const disconnectBluesky = async (req: Request, res: Response) => {
  try {
    if (!req.auth) {
      return new ErrorResponse("User not authenticated", { status: 401 }).send(res);
    }

    await updateBlueskyDetails(req.auth.id, {
      connected: false,
      did: null,
      handle: null,
      auth: {
        accessJwt: null,
        refreshJwt: null,
      },
      profile: {
        displayName: null,
        description: null,
        avatar: null,
      },
    });

    return new SuccessResponse("Bluesky disconnected successfully").send(res);
  } catch (error) {
    logger.error(error);
    return new ErrorResponse("Failed to disconnect from Bluesky", { status: 500 }).send(res);
  }
};

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
