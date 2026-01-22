import { Request, Response } from "express";
import { mastodonService } from "../../services/platforms/mastodon.service";
import { ENV } from "../../config/env";
import { SuccessResponse, ErrorResponse } from "../../utils/responses";
import {
  updateMastodonDetails,
  findPlatformAccountByUserId,
} from "../../repositories/platform.repository";
import logger from "../../utils/logger";

export const connectMastodon = (req: Request, res: Response) => {
  try {
    const userId = req.auth?.id as string;
    const authUrl = mastodonService.getAuthUrl(userId);

    return new SuccessResponse("Mastodon auth URL generated", {
      data: { authUrl },
    }).send(res);
  } catch (error) {
    logger.error("Error generating Mastodon auth URL", error);
    return new ErrorResponse("Failed to initiate Mastodon connection", { status: 500 }).send(res);
  }
};

export const mastodonCallback = async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query as { code: string; state: string };
    const userId = state;

    if (!code) {
      return new ErrorResponse("Authorization code missing", { status: 400 }).send(res);
    }

    const accessToken = await mastodonService.getAccessToken(code);
    const profile = await mastodonService.getUserProfile(accessToken);

    await updateMastodonDetails(userId, {
      connected: true,
      instanceUrl: ENV.MASTODON.INSTANCE_URL,
      accountId: profile.id,
      auth: {
        accessToken: accessToken,
      },
      profile: {
        handle: profile.username,
        displayName: profile.display_name,
        avatar: profile.avatar,
      },
    });

    return res.redirect(`${ENV.APP.FRONTEND_URL}/settings`);
  } catch (error) {
    logger.error("Mastodon callback error", error);
    return new ErrorResponse("Failed to connect Mastodon", { status: 500 }).send(res);
  }
};

export const disconnectMastodon = async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.id as string;
    await updateMastodonDetails(userId, {
      connected: false,
      instanceUrl: null,
      accountId: null,
      auth: { accessToken: null },
      profile: { handle: null, displayName: null, avatar: null },
    });

    return new SuccessResponse("Mastodon disconnected successfully").send(res);
  } catch (error) {
    logger.error("Mastodon disconnect error", error);
    return new ErrorResponse("Failed to disconnect Mastodon", { status: 500 }).send(res);
  }
};

export const refreshMastodonProfile = async (req: Request, res: Response) => {
  try {
    if (!req.auth) {
      return new ErrorResponse("User not authenticated", { status: 401 }).send(res);
    }

    const userId = req.auth.id;
    const socialAccount = await findPlatformAccountByUserId(userId);

    if (
      !socialAccount ||
      !socialAccount.mastodon?.connected ||
      !socialAccount.mastodon.auth?.accessToken
    ) {
      return new ErrorResponse("Mastodon account not connected", { status: 400 }).send(res);
    }

    const accessToken = socialAccount.mastodon.auth.accessToken;
    const profile = await mastodonService.getUserProfile(accessToken);

    await updateMastodonDetails(userId, {
      connected: true,
      profile: {
        handle: profile.username,
        displayName: profile.display_name,
        avatar: profile.avatar,
      },
    });

    return new SuccessResponse("Mastodon profile refreshed", { data: profile }).send(res);
  } catch (error) {
    logger.error("Failed to refresh Mastodon profile", error);
    return new ErrorResponse("Failed to refresh profile", { status: 500 }).send(res);
  }
};

export const postToMastodon = async (req: Request, res: Response) => {
  try {
    if (!req.auth) {
      return new ErrorResponse("User not authenticated", { status: 401 }).send(res);
    }

    const { text, mediaUrls, scheduledAt, timezone } = req.body;
    const userId = req.auth.id;

    // 1. Create a persistent Post record in MongoDB
    const postRepository = await import("../../repositories/post.repository");
    const { Types } = await import("mongoose");

    const post = await postRepository.createPost({
      userId: new Types.ObjectId(userId),
      content: {
        text,
        mediaItems: mediaUrls?.map((url: string) => ({
          s3Url: url,
          s3Key: url.split("/").pop() || "unknown", // Temporary logic until media handling is fully ready
          mimeType: "image/jpeg" // Default for now
        })) || []
      },
      selectedPlatforms: ["mastodon"],
      status: scheduledAt ? "SCHEDULED" : "PENDING",
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      timezone: timezone || "UTC",
      platformStatuses: [] // Will be initialized by the model's pre-save hook
    });

    // 2. Queue the message in RabbitMQ with the real Post ID
    const { Producer } = await import("../../lib/queues/producer");

    const correlationId = await Producer.queueSocialPost({
      postId: post._id.toString(),
      userId,
      platform: "mastodon",
      content: {
        text,
        mediaUrls: mediaUrls || []
      },
      scheduledAt,
    });

    return new SuccessResponse("Post created and queued successfully", {
      data: {
        postId: post._id,
        correlationId
      }
    }).send(res);
  } catch (error) {
    logger.error("Failed to post to Mastodon", error);
    return new ErrorResponse("Failed to post to Mastodon", { status: 500 }).send(res);
  }
};
