import { blueskyService } from "../../services/platforms/bluesky.service";
import { Request, Response } from "express";
import { ErrorResponse, SuccessResponse } from "../../utils/responses";
import logger from "../../utils/logger";
import {
  updateBlueskyDetails,
  findPlatformAccountByUserId,
} from "../../repositories/platform.repository";
import * as postRepository from '../../repositories/post.repository';
import { Types } from "mongoose"
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
    if (!req.auth) {
      return new ErrorResponse("User not authenticated", { status: 401 }).send(res);
    }




    const { text, scheduledAt, mediaUrls } = req.body;
    const userId = req.auth.id; 
    const timezone = 'UTC';

    console.log("media urls :::", mediaUrls);

    const post = await postRepository.createPost({
      userId: new Types.ObjectId(userId),
      content: {
        text,
        mediaItems: mediaUrls?.map((url: string) => ({
          s3Url: url,
          s3Key: url.split("/").pop() || "unknown", // Temporary logic until media handling is fully ready
          mimeType: `image/${url.split(".").pop()}` // Default for now
        })) || []
      },
      selectedPlatforms: ["bluesky"],
      status: scheduledAt ? "SCHEDULED" : "PENDING",
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      timezone: timezone || "UTC",
      platformStatuses: [] // Will be initialized by the model's pre-save hook
    })

    const tess = JSON.stringify(post)
    console.log(tess)
    const correlationId = Producer.queueSocialPost({
      postId: post._id.toString(),
      userId,
      platform: "bluesky",
      content: {
        text,
        mediaUrls: mediaUrls || []
      },
      scheduledAt,
    })


    return new SuccessResponse("Post queued successfully", { data: post }).send(res);
  } catch (error) {
    logger.error("Failed to post to Bluesky", error);
    return new ErrorResponse("Failed to post to Bluesky", { status: 500 }).send(res);
  }
};
