import { Request, Response } from "express";
import { SuccessResponse, ErrorResponse } from "../utils/responses";
import logger from "../utils/logger";
import * as postRepository from "../repositories/post.repository";
import { Producer } from "../lib/queues/producer";
import { PostStatus, PlatformStatus, Post } from "../interfaces/post.interface";
import { Types } from "mongoose";
import { z } from "zod";
import { getPresignedUploadUrl } from "../services/s3/s3.upload.service";
import { timezoneSchema, platformSpecificPostSchema } from "@hayon/schemas";
import { ENV } from "../config/env";
import { GoogleGenAI } from "@google/genai";

const createPostSchema = z.object({
  content: z.object({
    text: z.string(),
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
  status: z.enum(["DRAFT", "PENDING", "SCHEDULED"]).optional(),
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

    const { content, selectedPlatforms, platformSpecificContent, scheduledAt, timezone, status } =
      validationResult.data;

    // Determine the post status
    let postStatus: PostStatus;
    if (status === "DRAFT") {
      postStatus = "DRAFT";
    } else if (scheduledAt) {
      postStatus = "SCHEDULED";
    } else {
      postStatus = "PENDING";
    }

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
      status: postStatus,
      platformStatuses: selectedPlatforms.map((p: any) => ({
        platform: p,
        status: "pending" as PlatformStatus,
        attemptCount: 0,
      })),
      timezone: timezone || "UTC",
    };

    const post = await postRepository.createPost(postData);

    // 3. Enqueue Jobs for each Platform (skip for drafts)
    if (postStatus !== "DRAFT") {
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
    }

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

export const getPostById = async (req: Request, res: Response) => {
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

    return new SuccessResponse("Post fetched successfully", {
      data: { post },
    }).send(res);
  } catch (error) {
    logger.error("Get post by ID error", error);
    return new ErrorResponse("Failed to get post").send(res);
  }
};

export const getUserPosts = async (req: Request, res: Response) => {
  try {
    if (!req.auth) {
      return new ErrorResponse("Unauthorized", { status: 401 }).send(res);
    }

    const userId = req.auth.id;
    const { page = 1, limit = 20, status, sortBy = "createdAt", sortOrder = "desc" } = req.query;

    const { posts, total } = await postRepository.findByUserId(userId, {
      page: Number(page),
      limit: Number(limit),
      status: status as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as "asc" | "desc",
    });

    return new SuccessResponse("Posts fetched successfully", {
      data: {
        posts,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    }).send(res);
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
    const { postId } = req.params;
    const userId = req.auth.id;

    const cancelledPost = await postRepository.cancelPost(postId, userId);

    if (!cancelledPost) {
      return new ErrorResponse("Post not found, unauthorized, or not in a cancellable state", {
        status: 404,
      }).send(res);
    }

    return new SuccessResponse("Post cancelled successfully", {
      data: { postId: cancelledPost._id, status: cancelledPost.status },
    }).send(res);
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
    const { postId } = req.params;
    const userId = req.auth.id;

    const post = await postRepository.findById(postId);
    if (!post) {
      return new ErrorResponse("Post not found", { status: 404 }).send(res);
    }

    if (post.userId.toString() !== userId) {
      return new ErrorResponse("Unauthorized", { status: 403 }).send(res);
    }

    // Identify failed platforms
    const failedPlatforms = post.platformStatuses
      .filter((p) => p.status === "failed")
      .map((p) => p.platform);

    if (failedPlatforms.length === 0) {
      return new ErrorResponse("No failed platforms to retry", { status: 400 }).send(res);
    }

    // Reset status for failed platforms and re-enqueue
    const retryPromises = failedPlatforms.map(async (platform) => {
      // Update DB status back to pending
      await postRepository.updatePlatformStatus(postId, platform, {
        status: "pending",
        error: undefined,
      });

      // Prepare content (respecting platform-specific overrides)
      const specificContent = (post.platformSpecificContent as any)?.[platform] || {};
      const finalContentText = specificContent.text || post.content.text;
      const sourceMediaItems = specificContent.mediaItems || post.content.mediaItems || [];
      const mediaUrls = sourceMediaItems.map((item: any) => item.s3Url);

      // Re-enqueue
      await Producer.queueSocialPost({
        postId: post._id!.toString(),
        userId,
        platform: platform as any,
        content: {
          text: finalContentText,
          mediaUrls,
        },
        // For retry, we usually want it to go out immediately
        scheduledAt: undefined,
      });
    });

    await Promise.all(retryPromises);

    return new SuccessResponse("Retry initiated for failed platforms", {
      data: {
        postId: post._id,
        retryingPlatforms: failedPlatforms,
      },
    }).send(res);
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

export const updatePost = async (req: Request, res: Response) => {
  try {
    if (!req.auth) {
      return new ErrorResponse("Unauthorized", { status: 401 }).send(res);
    }

    const { postId } = req.params;
    const userId = req.auth.id;

    // Validate the update data using the same schema as createPost
    const validationResult = createPostSchema.safeParse(req.body);

    if (!validationResult.success) {
      logger.warn("Update post validation failed", {
        errors: JSON.stringify(validationResult.error.format(), null, 2),
        body: JSON.stringify(req.body, null, 2),
      });
      return new ErrorResponse("Invalid request data", {
        status: 400,
        data: validationResult.error.format(),
      }).send(res);
    }

    const { content, selectedPlatforms, platformSpecificContent, scheduledAt, timezone, status } =
      validationResult.data;

    // Fetch the existing post
    const existingPost = await postRepository.findById(postId);
    if (!existingPost) {
      return new ErrorResponse("Post not found", { status: 404 }).send(res);
    }

    if (existingPost.userId.toString() !== userId) {
      return new ErrorResponse("Unauthorized", { status: 403 }).send(res);
    }

    // Determine the new status
    let newStatus: PostStatus;
    if (status === "DRAFT") {
      newStatus = "DRAFT";
    } else if (scheduledAt) {
      newStatus = "SCHEDULED";
    } else {
      newStatus = "PENDING";
    }

    // Check if status is changing from DRAFT to PENDING/SCHEDULED
    const statusChangedFromDraft = existingPost.status === "DRAFT" && newStatus !== "DRAFT";

    // Update the post
    const updateData: Partial<Post> = {
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
      status: newStatus,
      platformStatuses: selectedPlatforms.map((p: any) => ({
        platform: p,
        status: "pending" as PlatformStatus,
        attemptCount: 0,
      })),
      timezone: timezone || "UTC",
    };

    // FIX: If publishing a draft (DRAFT -> PENDING/SCHEDULED), update createdAt to now
    // so it appears at the top of the history list.
    if (statusChangedFromDraft) {
      updateData.createdAt = new Date();
    }

    const updatedPost = await postRepository.updatePost(postId, userId, updateData);

    if (!updatedPost) {
      return new ErrorResponse("Failed to update post", { status: 500 }).send(res);
    }

    // If status changed from DRAFT to PENDING/SCHEDULED, enqueue jobs
    if (statusChangedFromDraft) {
      const queuePromises = selectedPlatforms.map(async (platform: any) => {
        const specificContent = (platformSpecificContent as any)?.[platform] || {};
        const finalContentText = specificContent.text || content.text;
        const sourceMediaItems = specificContent.mediaItems || content.mediaItems || [];
        const mediaUrls = sourceMediaItems.map((item: any) => item.s3Url);

        await Producer.queueSocialPost({
          postId: updatedPost._id.toString(),
          userId,
          platform: platform as any,
          content: {
            text: finalContentText,
            mediaUrls,
          },
          scheduledAt: updatedPost.scheduledAt,
        });
      });

      await Promise.all(queuePromises);
    }

    return new SuccessResponse("Post updated successfully", {
      data: {
        postId: updatedPost._id,
        status: updatedPost.status,
        scheduledAt: updatedPost.scheduledAt,
      },
    }).send(res);
  } catch (error) {
    logger.error("Update post error", error);
    return new ErrorResponse("Failed to update post").send(res);
  }
};

export const deletePost = async (req: Request, res: Response) => {
  try {
    if (!req.auth) {
      return new ErrorResponse("Unauthorized", { status: 401 }).send(res);
    }

    const { postId } = req.params;
    const userId = req.auth.id;

    const deletedPost = await postRepository.deletePost(postId, userId);

    if (!deletedPost) {
      return new ErrorResponse("Post not found or unauthorized", { status: 404 }).send(res);
    }

    return new SuccessResponse("Post deleted successfully", {
      data: { postId: deletedPost._id },
    }).send(res);
  } catch (error) {
    logger.error("Delete post error", error);
    return new ErrorResponse("Failed to delete post").send(res);
  }
};

export const generateCaptions = async (req: Request, res: Response) => {
  try {
    if (!req.auth) {
      return new ErrorResponse("Unauthorized", { status: 401 }).send(res);
    }

    const { media } = req.body;

    function parseBase64Image(dataUrl: any) {
      const matches = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);

      return {
        mimeType: matches[1], // image/png or image/jpeg
        data: matches[2], // pure base64
      };
    }

    const images = media.map((img: string) => parseBase64Image(img)).filter(Boolean); // removes nulls

    const imageParts = images.map((img: any) => ({
      inlineData: {
        mimeType: img.mimeType,
        data: img.data,
      },
    }));

    imageParts.push({
      text: "generate some captions according to this image i want to post this on my instagram account",
    });

    //TODO: Implement caption generation logic here

    const GenAi = new GoogleGenAI({
      apiKey: ENV.GEMINI.API_KEY,
    });

    const result = await GenAi.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: imageParts,
        },
      ],
    });

    console.log("model result :", result);
    return new SuccessResponse("Captions generated successfully", { data: result }).send(res);
  } catch (error) {
    logger.error("Generate captions error", error);
    return new ErrorResponse("Failed to generate captions").send(res);
  }
};
