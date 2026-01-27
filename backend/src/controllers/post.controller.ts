import { Request, Response } from "express";
import { SuccessResponse, ErrorResponse } from "../utils/responses";
import logger from "../utils/logger";
import * as postRepository from "../repositories/post.repository";
import { Producer } from "../lib/queues/producer";
import { PostStatus, PlatformStatus } from "../interfaces/post.interface";
import { Types } from "mongoose";
export const createPost = async (req: Request, res: Response) => {
    try {
        if (!req.auth) {
            return new ErrorResponse("Unauthorized", { status: 401 }).send(res);
        }

        const userId = req.auth.id;
        const {
            content, // { text: string, mediaItems: [] }
            selectedPlatforms, // ["bluesky", "mastodon"]
            platformSpecificContent, // { bluesky: { text: "..." } }
            scheduledAt
        } = req.body;

        // 1. Basic Validation
        if (!content || !content.text) {
            return new ErrorResponse("Post content is required", { status: 400 }).send(res);
        }

        if (!selectedPlatforms || !Array.isArray(selectedPlatforms) || selectedPlatforms.length === 0) {
            return new ErrorResponse("At least one platform must be selected", { status: 400 }).send(res);
        }

        // 2. Create Post Document
        const postData = {
            userId: new Types.ObjectId(userId),
            content: {
                text: content.text,
                mediaItems: content.mediaItems || []
            },
            selectedPlatforms,
            platformSpecificContent: platformSpecificContent || {},
            scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
            status: (scheduledAt ? "SCHEDULED" : "PENDING") as PostStatus,
            platformStatuses: selectedPlatforms.map((p: any) => ({
                platform: p,
                status: "pending" as PlatformStatus,
                attemptCount: 0
            })),
            timezone: "UTC" // Default to UTC for now
        };

        const post = await postRepository.createPost(postData);

        // 3. Enqueue Jobs for each Platform
        // We use Producer.queueSocialPost which handles delayed publishing if scheduledAt is set

        const queuePromises = selectedPlatforms.map(async (platform) => {
            // Determine content for this specific platform
            // If platformSpecificContent exists, merge/override
            const specificContent = platformSpecificContent?.[platform] || {};

            // Allow overriding text. 
            // TODO: Ensure media overrides are also handled if we support per-platform media in frontend
            const finalContentText = specificContent.text || content.text;

            // Extract media URLs for the worker (which expects simple string[] currently)
            // If specific media is implemented later, logic goes here.
            // For now, use global media items.
            const mediaUrls = (content.mediaItems || []).map((item: any) => item.s3Url);


            await Producer.queueSocialPost({
                postId: post._id.toString(),
                userId,
                platform: platform as any, // Type cast to allowed platform union
                content: {
                    text: finalContentText,
                    mediaUrls
                },
                scheduledAt: post.scheduledAt
            });
        });

        await Promise.all(queuePromises);

        return new SuccessResponse("Post created successfully", {
            data: {
                postId: post._id,
                status: post.status,
                scheduledAt: post.scheduledAt
            },
            status: 201
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

        // Security check: ensure the post belongs to the user
        if (post.userId.toString() !== userId) {
            return new ErrorResponse("Unauthorized", { status: 403 }).send(res);
        }

        return new SuccessResponse("Post status fetched", {
            data: {
                postId: post._id,
                status: post.status,
                platformStatuses: post.platformStatuses,
                createdAt: post.createdAt,
                updatedAt: post.updatedAt
            }
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

import { getPresignedUploadUrl } from "../services/s3/s3.upload";

export const getUploadUrls = async (req: Request, res: Response) => {
    try {
        if (!req.auth) {
            return new ErrorResponse("Unauthorized", { status: 401 }).send(res);
        }

        const userId = req.auth.id;
        const { contentType } = req.body;

        // Validate content type
        const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "video/mp4", "video/quicktime"];
        if (!contentType || !allowedTypes.includes(contentType)) {
            return new ErrorResponse("Invalid media type", { status: 400 }).send(res);
        }

        // Generate presigned URL - defaulting to 'posts' folder as requested
        // This will create keys like: posts/{userId}/{uuid}.{ext}
        const ext = contentType.split("/")[1];
        const filename = `post-media.${ext}`; // The name here doesn't matter much as s3.upload.ts generates UUID for non-profile folders

        const { uploadUrl, s3Url, s3Key } = await getPresignedUploadUrl(
            userId,
            filename,
            contentType,
            "posts"
        );

        return new SuccessResponse("Upload URL generated", {
            data: {
                uploadUrl,
                s3Url,
                s3Key,
                contentType
            }
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
