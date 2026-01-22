import { tumblrService } from "../../services/platforms/tumblr.service";
import { ErrorResponse, SuccessResponse } from "../../utils/responses";
import logger from "../../utils/logger";
import { Request, Response } from "express";
import {
  updateTumblerDetails,
  findPlatformAccountByUserId,
} from "../../repositories/platform.repository";
import * as postRepository from "../../repositories/post.repository";
import { ENV } from "../../config/env";
import { getErrorMessage } from "../../utils/errorHandler";
import { Producer } from "../../lib/queues/producer";
import { Types } from "mongoose";

export const connectTumblr = async (req: Request, res: Response) => {
  try {
    const userId = req?.auth?.id as string;
    const { authUrl } = await tumblrService.getRequestToken(userId);

    return new SuccessResponse("Tumblr request token obtained", {
      data: { authUrl },
    }).send(res);
  } catch (error: unknown) {
    logger.error(error);
    return new ErrorResponse("Failed to connect to Tumblr", { status: 500 }).send(res);
  }
};

export const tumblrCallback = async (req: Request, res: Response) => {
  try {
    const { oauth_token, oauth_verifier, state } = req.query as {
      oauth_token: string;
      oauth_verifier: string;
      state: string;
    };

    const userId = req.query.state as string;

    console.log("Tumblr callback received:", { oauth_token, oauth_verifier, state });

    const { accessToken, accessSecret } = await tumblrService.getAccessToken(
      oauth_token,
      oauth_verifier,
    );

    const { handle, blogHostname, avatar } = await tumblrService.getUserInfo(accessToken, accessSecret);

    await updateTumblerDetails(userId, {
      connected: true,
      blogHostname,
      auth: {
        oauthToken: accessToken,
        oauthTokenSecret: accessSecret,
      },
      profile: {
        handle,
        avatar,
      },
    });

    return res.redirect(`${ENV.APP.FRONTEND_URL}/settings`);
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    logger.error(error);
    if (message === "Tumblr OAuth session expired") {
      return res.status(400).send("Tumblr OAuth session expired");
    }
    return new ErrorResponse("Failed to process Tumblr callback", { status: 500 }).send(res);
  }
};

export const disconnectTumblr = async (req: Request, res: Response) => {
  try {
    if (!req.auth) {
      return new ErrorResponse("User not authenticated", { status: 401 }).send(res);
    }
    await updateTumblerDetails(req.auth.id, {
      connected: false,
      auth: {
        oauthToken: null,
        oauthTokenSecret: null,
      },
      profile: {
        handle: null,
        avatar: null,
      },
    });

    return new SuccessResponse("Tumblr disconnected successfully").send(res);
  } catch (error: unknown) {
    logger.error(error);
    return new ErrorResponse("Failed to disconnect from Tumblr", { status: 500 }).send(res);
  }
};

export const refreshTumblrProfile = async (req: Request, res: Response) => {
  try {
    if (!req.auth) {
      return new ErrorResponse("User not authenticated", { status: 401 }).send(res);
    }

    const userId = req.auth.id;
    const socialAccount = await findPlatformAccountByUserId(userId);

    const tumblrAuth = socialAccount?.tumblr?.auth;
    if (
      !socialAccount ||
      !socialAccount.tumblr?.connected ||
      !tumblrAuth?.oauthToken ||
      !tumblrAuth?.oauthTokenSecret
    ) {
      return new ErrorResponse("Tumblr account not connected", { status: 400 }).send(res);
    }

    const { oauthToken, oauthTokenSecret } = tumblrAuth;
    const { handle, blogHostname, avatar } = await tumblrService.getUserInfo(oauthToken, oauthTokenSecret);

    await updateTumblerDetails(userId, {
      connected: true,
      blogHostname,
      profile: {
        handle,
        avatar,
      },
    });

    return new SuccessResponse("Tumblr profile refreshed", { data: { handle, avatar } }).send(res);
  } catch (error: unknown) {
    logger.error("Failed to refresh Tumblr profile", error);
    return new ErrorResponse("Failed to refresh Tumblr profile", { status: 500 }).send(res);
  }
};

export const postToTumblr = async (req: Request, res: Response) => {
  try {
    if (!req.auth) {
      return new ErrorResponse("User not authenticated", { status: 401 }).send(res);
    }

    const { text, mediaUrls, scheduledAt, timezone } = req.body;
    const userId = req.auth.id;

    // 0. Check if Tumblr is connected
    const socialAccount = await findPlatformAccountByUserId(userId);
    if (!socialAccount?.tumblr?.connected) {
      return new ErrorResponse("Tumblr account not connected", { status: 400 }).send(res);
    }

    // 1. Create a persistent Post record in MongoDB
    const post = await postRepository.createPost({
      userId: new Types.ObjectId(userId),
      content: {
        text,
        mediaItems: (mediaUrls || []).map((url: string) => ({
          s3Url: url,
          s3Key: "unknown", // Simplified for testing
          mimeType: "image/jpeg",
          originalFilename: "uploaded_file",
          sizeBytes: 0,
        })),
      },
      selectedPlatforms: ["tumblr"],
      platformStatuses: [
        {
          platform: "tumblr",
          status: "pending",
          attemptCount: 0,
        },
      ],
      status: scheduledAt ? "SCHEDULED" : "PENDING",
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      timezone: timezone || "UTC",
      metadata: {
        source: "web",
      },
    });

    // 2. Queue the message in RabbitMQ with the real DB ID
    const correlationId = await Producer.queueSocialPost({
      postId: post._id!.toString(), // Real Database ID
      userId,
      platform: "tumblr",
      content: {
        text,
        mediaUrls: mediaUrls || [],
      },
      scheduledAt,
    });

    return new SuccessResponse("Post created and queued successfully", {
      data: {
        postId: post._id,
        correlationId,
      },
    }).send(res);
  } catch (error) {
    logger.error("Failed to post to Tumblr", error);
    return new ErrorResponse("Failed to post to Tumblr", { status: 500 }).send(res);
  }
};
