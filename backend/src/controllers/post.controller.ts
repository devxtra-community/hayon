import { Request, Response } from "express";
import { SuccessResponse, ErrorResponse } from "../utils/responses";
import logger from "../utils/logger";
import * as postRepository from "../repositories/post.repository";
import { Producer } from "../lib/queues/producer";
import { PostStatus, PlatformStatus } from "../interfaces/post.interface";
import { Types } from "mongoose";
import { z } from "zod";
import { getPresignedUploadUrl } from "../services/s3/s3.upload.service";
import { timezoneSchema, platformSpecificPostSchema } from "@hayon/schemas";

const createPostSchema = z.object({
  content: z.object({
    text: z.string().min(1, "Post content is required"),
    mediaItems: z
      .array(
        z.object({
          s3Url: z.string().url(),
          s3Key: z.string().optional(),
          mimeType: z.string().optional(),
        }),
      )
      .optional()
      .default([]),
  }),
  selectedPlatforms: z
    .array(z.enum(["bluesky", "threads", "instagram", "facebook", "mastodon", "tumblr"]))
    .min(1, "At least one platform must be selected"),
  platformSpecificContent: platformSpecificPostSchema.optional(),
  scheduledAt: z.string().datetime().optional(),
  timezone: timezoneSchema.optional(),
});

export const createPost = async (req: Request, res: Response) => {
  try {
    if (!req.auth) {
      return new ErrorResponse("Unauthorized", { status: 401 }).send(res);
    }
    const userId = req.auth.id;

    // Validation
    const validationResult = createPostSchema.safeParse(req.body);

    if (!validationResult.success) {
      logger.warn("Create post validation failed", {
        errors: validationResult.error.format(),
        body: req.body,
      });
      return new ErrorResponse("Invalid request data", {
        status: 400,
        data: validationResult.error.format(),
      }).send(res);
    }

    const { content, selectedPlatforms, platformSpecificContent, scheduledAt, timezone } =
      validationResult.data;

    // 2. Create Post Document
    const postData = {
      userId: new Types.ObjectId(userId),
      content: {
        text: content.text,
        mediaItems:
          content.mediaItems.map((item) => ({
            ...item,
            originalFilename: "uploaded_file",
            sizeBytes: 0,
            s3Key: item.s3Key || "unknown",
            mimeType: item.mimeType || "application/octet-stream",
          })) || [],
      },
      selectedPlatforms,
      platformSpecificContent: platformSpecificContent || {},
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      status: (scheduledAt ? "SCHEDULED" : "PENDING") as PostStatus,
      platformStatuses: selectedPlatforms.map((p: any) => ({
        platform: p,
        status: "pending" as PlatformStatus,
        attemptCount: 0,
      })),
      timezone: timezone || "UTC",
    };

    const post = await postRepository.createPost(postData);

    // 3. Enqueue Jobs for each Platform
    const queuePromises = selectedPlatforms.map(async (platform: any) => {
      const specificContent = (platformSpecificContent as any)?.[platform] || {};
      const finalContentText = specificContent.text || content.text;

      // Prefer platform-specific media items if they exist
      // Important: validation schema ensures structure, but here we merge logic
      const sourceMediaItems = specificContent.mediaItems || content.mediaItems || [];
      const mediaUrls = sourceMediaItems.map((item: any) => item.s3Url);

      await Producer.queueSocialPost({
        postId: post._id.toString(),
        userId,
        platform: platform as any,
        content: {
          text: finalContentText,
          mediaUrls,
        },
        scheduledAt: post.scheduledAt,
      });
    });

    await Promise.all(queuePromises);

    return new SuccessResponse("Post created successfully", {
      data: {
        postId: post._id,
        status: post.status,
        scheduledAt: post.scheduledAt,
      },
      status: 201,
    }).send(res);
  } catch (error) {
    logger.error("Create post error", error);
    return new ErrorResponse("Failed to create post").send(res);
  }
};

export const getPostStatus = async (req: Request, res: Response) => {
  try {
    if (!req.auth) {
      return new ErrorResponse("Unauthorized", { status: 401 }).send(res);
    }
    const { postId } = req.params;
    const userId = req.auth.id;
    const post = await postRepository.findById(postId);

    if (!post) {
      return new ErrorResponse("Post not found", { status: 404 }).send(res);
    }

    if (post.userId.toString() !== userId) {
      return new ErrorResponse("Unauthorized", { status: 403 }).send(res);
    }

    return new SuccessResponse("Post status fetched", {
      data: {
        postId: post._id,
        status: post.status,
        platformStatuses: post.platformStatuses,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      },
    }).send(res);
  } catch (error) {
    logger.error("Get post status error", error);
    return new ErrorResponse("Failed to get post status").send(res);
  }
};

export const getUserPosts = async (req: Request, res: Response) => {
  try {
    if (!req.auth) {
      return new ErrorResponse("Unauthorized", { status: 401 }).send(res);
    }

    return new ErrorResponse("Not implemented", { status: 501 }).send(res);
  } catch (error) {
    logger.error("Get user posts error", error);
    return new ErrorResponse("Failed to get posts").send(res);
  }
};

export const cancelPost = async (req: Request, res: Response) => {
  try {
    if (!req.auth) {
      return new ErrorResponse("Unauthorized", { status: 401 }).send(res);
    }

    return new ErrorResponse("Not implemented", { status: 501 }).send(res);
  } catch (error) {
    logger.error("Cancel post error", error);
    return new ErrorResponse("Failed to cancel post").send(res);
  }
};

export const retryPost = async (req: Request, res: Response) => {
  try {
    if (!req.auth) {
      return new ErrorResponse("Unauthorized", { status: 401 }).send(res);
    }

    return new ErrorResponse("Not implemented", { status: 501 }).send(res);
  } catch (error) {
    logger.error("Retry post error", error);
    return new ErrorResponse("Failed to retry post").send(res);
  }
};

export const getUploadUrls = async (req: Request, res: Response) => {
  try {
    if (!req.auth) {
      return new ErrorResponse("Unauthorized", { status: 401 }).send(res);
    }

    const userId = req.auth.id;
    const { contentType } = req.body;

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "video/mp4",
      "video/quicktime",
    ];
    if (!contentType || !allowedTypes.includes(contentType)) {
      return new ErrorResponse("Invalid media type", { status: 400 }).send(res);
    }

    const ext = contentType.split("/")[1];
    const filename = `post-media.${ext}`;

    const { uploadUrl, s3Url, s3Key } = await getPresignedUploadUrl(
      userId,
      filename,
      contentType,
      "posts",
    );

    return new SuccessResponse("Upload URL generated", {
      data: {
        uploadUrl,
        s3Url,
        s3Key,
        contentType,
      },
    }).send(res);
  } catch (error) {
    logger.error("Get upload URLs error", error);
    return new ErrorResponse("Failed to generate upload URLs").send(res);
  }
};

export const deleteMedia = async (req: Request, res: Response) => {
  try {
    if (!req.auth) {
      return new ErrorResponse("Unauthorized", { status: 401 }).send(res);
    }

    return new ErrorResponse("Not implemented", { status: 501 }).send(res);
  } catch (error) {
    logger.error("Delete media error", error);
    return new ErrorResponse("Failed to delete media").send(res);
  }
};
