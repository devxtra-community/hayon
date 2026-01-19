import { blueskyService } from "../../services/platforms/bluesky.service";
import { Request, Response } from "express";
import { ErrorResponse, SuccessResponse } from "../../utils/responses";
import logger from "../../utils/logger";
import {
  updateBlueskyDetails,
  findPlatformAccountByUserId,
} from "../../repositories/platform.repository";
import { Producer } from "../../lib/queues/producer";

export const connectBluesky = async (req: Request, res: Response) => {
  try {
    const { identifier, appPassword } = req.body;
    logger.info(`Connecting to Bluesky for identifier: ${identifier}, appPassword: ${appPassword}`);

    const { session, profile } = await blueskyService.login(identifier, appPassword);

    if (!req.auth) {
      return new ErrorResponse("User not authenticated", { status: 401 }).send(res);
    }

    await updateBlueskyDetails(req.auth.id, {
      connected: true,
      did: session.did,
      handle: session.handle,
      auth: {
        accessJwt: session.accessJwt,
        refreshJwt: session.refreshJwt,
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

export const refreshBlueskyProfile = async (req: Request, res: Response) => {
  try {
    if (!req.auth) {
      return new ErrorResponse("User not authenticated", { status: 401 }).send(res);
    }

    const userId = req.auth.id;
    const socialAccount = await findPlatformAccountByUserId(userId);

    if (
      !socialAccount ||
      !socialAccount.bluesky?.connected ||
      !socialAccount.bluesky.auth?.refreshJwt ||
      !socialAccount.bluesky.did ||
      !socialAccount.bluesky.handle
    ) {
      return new ErrorResponse("Bluesky account not connected or session missing", {
        status: 400,
      }).send(res);
    }

    const sessionData = {
      did: socialAccount.bluesky.did,
      handle: socialAccount.bluesky.handle,
      email: undefined,
      emailConfirmed: undefined,
      active: true,
      refreshJwt: socialAccount.bluesky.auth!.refreshJwt!,
      accessJwt: socialAccount.bluesky.auth?.accessJwt || "",
    };

    const { session, profile } = await blueskyService.resumeSession(sessionData);

    if (!session) {
      return new ErrorResponse("Failed to resume Bluesky session", { status: 500 }).send(res);
    }

    await updateBlueskyDetails(userId, {
      connected: true,
      did: session.did,
      handle: session.handle,
      auth: {
        accessJwt: session.accessJwt,
        refreshJwt: session.refreshJwt,
      },
      profile: {
        displayName: profile.displayName,
        description: profile.description,
        avatar: profile.avatar,
      },
    });

    return new SuccessResponse("Bluesky profile refreshed", { data: profile }).send(res);
  } catch (error) {
    logger.error("Failed to refresh Bluesky profile", error);
    return new ErrorResponse("Failed to refresh Bluesky profile", { status: 500 }).send(res);
  }
};

export const postToBluesky = async (req: Request, res: Response) => {
  try {
    // if (!req.auth) {
    //   return new ErrorResponse("User not authenticated", { status: 401 }).send(res);
    // }

    const { text, scheduledAt } = req.body;
    console.log("Received request to post to Bluesky:", { text, scheduledAt });

    const correlationId = await Producer.queueSocialPost({
      postId: "some-db-id", //  database ID
      userId: "javadde-id", // from req.auth.id
      platform: "bluesky", // Or whatever platform
      content: { text },
      scheduledAt: scheduledAt, // Optional: If provided,  Class handles the delay!
    });

    return new SuccessResponse(correlationId).send(res);
  } catch (error) {
    logger.error("Failed to post to Bluesky", error);
    return new ErrorResponse("Failed to post to Bluesky", { status: 500 }).send(res);
  }
};
