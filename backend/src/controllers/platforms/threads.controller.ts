import { Request, Response } from "express";
import { ErrorResponse, SuccessResponse } from "../../utils/responses";
import logger from "../../utils/logger";
import { ENV } from "../../config/env";
import { threadsService } from "../../services/platforms/threads.service";
import {
  updateThreadsDetails,
  findPlatformAccountByUserId,
} from "../../repositories/platform.repository";
import { Producer } from "../../lib/queues/producer";

export const connectThreads = (req: Request, res: Response) => {
  if (!req.auth) return res.status(401).send("Unauthorized");

  const threadsScopes = [
    "threads_basic",
    "threads_content_publish",
    "threads_manage_insights",
  ].join(",");

  const redirectUri = ENV.THREADS.REDIRECT_URI;
  const appId = ENV.THREADS.APP_ID;
  const state = req.auth.id;

  const authUrl =
    `https://threads.net/oauth/authorize?` +
    `client_id=${appId}` +
    `&redirect_uri=${redirectUri}` +
    `&scope=${threadsScopes}` +
    `&state=${state}` +
    `&response_type=code`;

  return new SuccessResponse("Threads auth URL generated", { data: { url: authUrl } }).send(res);
};

export const threadsCallback = async (req: Request, res: Response) => {
  const { code } = req.query;

  if (!code) {
    return res.redirect(`${ENV.APP.FRONTEND_URL}/settings?error=threads_auth_failed`);
  }

  try {
    const { accessToken, userId } = await threadsService.getThreadsShortLivedToken(code as string);
    const longToken = await threadsService.getThreadsLongLivedToken(accessToken);

    const profile = await threadsService.getThreadsUserProfile(longToken);

    const authorizedUserId = req.query.state as string;

    if (authorizedUserId) {
      await updateThreadsDetails(authorizedUserId, {
        connected: true,
        platformId: userId,
        profile: {
          handle: profile.username,
          displayName: profile.name || profile.username,
          avatar: profile.threads_profile_picture_url,
        },
        auth: {
          accessToken: longToken,
          refreshToken: "",
          expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        },
        health: { status: "active" },
      });
    }

    return res.redirect(`${ENV.APP.FRONTEND_URL}/settings?success=threads_connected`);
  } catch (error) {
    logger.error("Threads Connect Error", error);
    return res.redirect(`${ENV.APP.FRONTEND_URL}/settings?error=threads_connect_failed`);
  }
};

export const disconnectThreads = async (req: Request, res: Response) => {
  try {
    if (!req.auth) return new ErrorResponse("Unauthorized", { status: 401 }).send(res);

    await updateThreadsDetails(req.auth.id, {
      connected: false,
      platformId: null,
      auth: {},
      profile: {},
    });

    return new SuccessResponse("Threads disconnected successfully").send(res);
  } catch (error) {
    logger.error("Disconnect Threads Error", error);
    return new ErrorResponse("Failed to disconnect").send(res);
  }
};

export const refreshThreadsProfile = async (req: Request, res: Response) => {
  try {
    if (!req.auth) return new ErrorResponse("Unauthorized", { status: 401 }).send(res);

    const userId = req.auth.id;
    const socialAccount = await findPlatformAccountByUserId(userId);

    if (!socialAccount || !socialAccount.threads?.connected) {
      return new ErrorResponse("Threads account not connected", { status: 400 }).send(res);
    }

    if (!socialAccount.threads.auth?.accessToken) {
      return new ErrorResponse("Threads session expired or missing. Please reconnect.", {
        status: 400,
      }).send(res);
    }

    const longToken = socialAccount.threads.auth.accessToken;
    const profile = await threadsService.getThreadsUserProfile(longToken);

    await updateThreadsDetails(userId, {
      connected: true,
      platformId: socialAccount.threads.platformId,
      profile: {
        handle: profile.username,
        displayName: profile.name || profile.username,
        avatar: profile.threads_profile_picture_url,
      },
    });

    return new SuccessResponse("Threads profile refreshed", { data: profile }).send(res);
  } catch (error) {
    logger.error("Refresh Threads Error", error);
    return new ErrorResponse("Failed to refresh Threads profile", { status: 500 }).send(res);
  }
};

import { Types } from "mongoose";
import * as postRepository from "../../repositories/post.repository";

// ... inside postToThreads
export const postToThreads = async (req: Request, res: Response) => {
  try {
    if (!req.auth) {
      return new ErrorResponse("User not authenticated", { status: 401 }).send(res);
    }

    const { text, mediaUrls, scheduledAt, timezone } = req.body;
    const userId = req.auth.id;

    // 0. Check if Threads is connected
    const socialAccount = await findPlatformAccountByUserId(userId);
    if (!socialAccount?.threads?.connected) {
      return new ErrorResponse("Threads account not connected", { status: 400 }).send(res);
    }

    // 1. Create a persistent Post record in MongoDB
    const post = await postRepository.createPost({
      userId: new Types.ObjectId(userId),
      content: {
        text,
        mediaItems: (mediaUrls || []).map((url: string) => ({
          s3Url: url,
          s3Key: "unknown",
          mimeType: "image/jpeg",
          originalFilename: "uploaded_file",
          sizeBytes: 0,
        })),
      },
      selectedPlatforms: ["threads"],
      platformStatuses: [
        {
          platform: "threads",
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
      platform: "threads",
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
    logger.error("Failed to post to Threads", error);
    return new ErrorResponse("Failed to post to Threads", { status: 500 }).send(res);
  }
};
