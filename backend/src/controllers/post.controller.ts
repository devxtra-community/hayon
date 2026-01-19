// ============================================================================
// POST CONTROLLER - SKELETON WITH TODO COMMENTS
// ============================================================================
// File: src/controllers/post.controller.ts
// Purpose: Handle HTTP requests for post operations
// ============================================================================

import { Request, Response } from "express";
import { SuccessResponse, ErrorResponse } from "../utils/responses";
import logger from "../utils/logger";
// TODO: Import these once created
// import * as postRepository from "../repositories/post.repository";
// import { Producer } from "../lib/queues/producer";
// import { findPlatformAccountByUserId } from "../repositories/platform.repository";
// import { getPresignedUploadUrl, moveS3Object } from "../services/s3/s3.service";

// ============================================================================
// CREATE POST
// ============================================================================

/*
 * TODO: Implement createPost controller
 * 
 * Main Logic Flow:
 * 
 * 1. EXTRACT & VALIDATE REQUEST
 *    const { text, mediaUrls, selectedPlatforms, scheduledAt, timezone, platformSpecificContent } = req.body;
 *    const userId = req.auth.id;
 * 
 * 2. VALIDATE CONNECTED PLATFORMS
 *    - Fetch user's SocialAccount
 *    - For each platform in selectedPlatforms:
 *      - Check socialAccount[platform].connected === true
 *      - Check socialAccount[platform].health.status === "active"
 *    - If any platform not connected/healthy → return 400 with specific platform names
 * 
 * 3. PROCESS MEDIA (if provided)
 *    - Validate mediaUrls exist in S3
 *    - Create MediaItem[] from URLs
 *    - Consider moving from temp/ to posts/{postId}/ path
 * 
 * 4. CREATE POST DOCUMENT
 *    const post = await postRepository.createPost({
 *      userId,
 *      content: { text, mediaItems },
 *      platformSpecificContent,
 *      selectedPlatforms,
 *      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
 *      timezone,
 *      status: scheduledAt ? "SCHEDULED" : "PENDING",
 *      platformStatuses: selectedPlatforms.map(p => ({
 *        platform: p,
 *        status: "pending",
 *        attemptCount: 0
 *      }))
 *    });
 * 
 * 5. QUEUE MESSAGES FOR EACH PLATFORM
 *    for (const platform of selectedPlatforms) {
 *      const content = platformSpecificContent?.[platform] || post.content;
 *      
 *      const correlationId = await Producer.queueSocialPost({
 *        postId: post._id.toString(),
 *        userId,
 *        platform,
 *        content: {
 *          text: content.text,
 *          mediaUrls: content.mediaItems?.map(m => m.s3Url)
 *        },
 *        scheduledAt: post.scheduledAt
 *      });
 *      
 *      // Store correlationId for tracking
 *      post.correlationId = correlationId;
 *    }
 *    await post.save();
 * 
 * 6. RETURN RESPONSE
 *    return { postId: post._id, status: post.status, correlationId };
 * 
 * EDGE CASES:
 * - scheduledAt in past → treat as immediate
 * - Empty text with media → allowed for Instagram
 * - Text too long for platform → should be caught by frontend, but validate anyway
 */

export const createPost = async (req: Request, res: Response) => {
    try {
        if (!req.auth) {
            return new ErrorResponse("Unauthorized", { status: 401 }).send(res);
        }

        // TODO: Implement logic as described above

        return new ErrorResponse("Not implemented", { status: 501 }).send(res);
    } catch (error) {
        logger.error("Create post error", error);
        return new ErrorResponse("Failed to create post").send(res);
    }
};

// ============================================================================
// GET POST STATUS
// ============================================================================

/*
 * TODO: Implement getPostStatus controller
 * 
 * Logic:
 * 1. Get postId from params
 * 2. Fetch post from DB
 * 3. Verify post belongs to requesting user
 * 4. Return post status and platformStatuses
 * 
 * This is useful for:
 * - Frontend polling after submission
 * - Showing user which platforms succeeded/failed
 */

export const getPostStatus = async (req: Request, res: Response) => {
    try {
        if (!req.auth) {
            return new ErrorResponse("Unauthorized", { status: 401 }).send(res);
        }

        const { postId } = req.params;

        // TODO: Implement
        // const post = await postRepository.findById(postId);
        // if (!post) return 404
        // if (post.userId.toString() !== req.auth.id) return 403
        // return { postId, status, platformStatuses, createdAt, scheduledAt }

        return new ErrorResponse("Not implemented", { status: 501 }).send(res);
    } catch (error) {
        logger.error("Get post status error", error);
        return new ErrorResponse("Failed to get post status").send(res);
    }
};

// ============================================================================
// GET USER POSTS (Paginated)
// ============================================================================

/*
 * TODO: Implement getUserPosts controller
 * 
 * Query params:
 * - status: filter by PostStatus
 * - page: pagination
 * - limit: items per page
 * - sortBy: field to sort by
 * - sortOrder: asc/desc
 * 
 * Return format:
 * {
 *   posts: [...],
 *   pagination: { page, limit, total, totalPages }
 * }
 */

export const getUserPosts = async (req: Request, res: Response) => {
    try {
        if (!req.auth) {
            return new ErrorResponse("Unauthorized", { status: 401 }).send(res);
        }

        // TODO: Implement with pagination

        return new ErrorResponse("Not implemented", { status: 501 }).send(res);
    } catch (error) {
        logger.error("Get user posts error", error);
        return new ErrorResponse("Failed to get posts").send(res);
    }
};

// ============================================================================
// CANCEL POST
// ============================================================================

/*
 * TODO: Implement cancelPost controller
 * 
 * IMPORTANT: Cancellation is tricky with RabbitMQ!
 * 
 * Problem: Once a message is in the queue, you can't easily remove it.
 * 
 * Solution Options:
 * 
 * A) Database Flag Approach (RECOMMENDED):
 *    1. Set post.status = "CANCELLED" in DB
 *    2. Worker checks DB status BEFORE processing
 *    3. If cancelled, worker ACKs message without posting
 *    
 * B) Separate Cancel Queue:
 *    1. Publish cancel message to special queue
 *    2. Worker maintains in-memory set of cancelled postIds
 *    3. Check set before processing
 *    (More complex, less reliable)
 * 
 * Implementation (Option A):
 * 1. Verify post exists and belongs to user
 * 2. Check status is PENDING or SCHEDULED
 * 3. Update status to "CANCELLED"
 * 4. Return success
 * 
 * Worker modification:
 * - At start of processMessage, fetch post from DB
 * - If status === "CANCELLED", ack message and return early
 */

export const cancelPost = async (req: Request, res: Response) => {
    try {
        if (!req.auth) {
            return new ErrorResponse("Unauthorized", { status: 401 }).send(res);
        }

        // TODO: Implement as described above

        return new ErrorResponse("Not implemented", { status: 501 }).send(res);
    } catch (error) {
        logger.error("Cancel post error", error);
        return new ErrorResponse("Failed to cancel post").send(res);
    }
};

// ============================================================================
// RETRY FAILED PLATFORMS
// ============================================================================

/*
 * TODO: Implement retryPost controller
 * 
 * Logic:
 * 1. Get post by ID, verify ownership
 * 2. Find platforms with status "failed"
 * 3. If req.body.platforms provided, filter to only those
 * 4. For each platform to retry:
 *    a. Reset platformStatus to "pending"
 *    b. Increment attemptCount
 *    c. Queue new message via Producer
 * 5. Update post status to "PROCESSING"
 * 6. Save and return
 * 
 * Edge Cases:
 * - No failed platforms → 400 "Nothing to retry"
 * - Max retry limit (e.g., 3 attempts) → 400 "Max retries exceeded"
 */

export const retryPost = async (req: Request, res: Response) => {
    try {
        if (!req.auth) {
            return new ErrorResponse("Unauthorized", { status: 401 }).send(res);
        }

        // TODO: Implement

        return new ErrorResponse("Not implemented", { status: 501 }).send(res);
    } catch (error) {
        logger.error("Retry post error", error);
        return new ErrorResponse("Failed to retry post").send(res);
    }
};

// ============================================================================
// MEDIA UPLOAD (Pre-signed URLs)
// ============================================================================

/*
 * TODO: Implement getUploadUrls controller
 * 
 * Flow:
 * 1. Validate file metadata (type, size)
 * 2. Generate unique S3 keys
 * 3. Create pre-signed PUT URLs using s3.service
 * 4. Return URLs to frontend
 * 
 * Frontend then:
 * 1. Uses PUT URL to upload directly to S3
 * 2. Includes s3Url in createPost request
 * 
 * S3 Key Format: "temp/{userId}/{uuid}-{sanitizedFilename}"
 * - temp/ prefix for auto-cleanup via S3 lifecycle rules
 * - uuid prevents filename collisions
 * 
 * Add to s3.service.ts:
 * - getPresignedUploadUrl(key, contentType, expiresIn)
 * - Uses @aws-sdk/s3-request-presigner
 */

export const getUploadUrls = async (req: Request, res: Response) => {
    try {
        if (!req.auth) {
            return new ErrorResponse("Unauthorized", { status: 401 }).send(res);
        }

        // TODO: Implement

        return new ErrorResponse("Not implemented", { status: 501 }).send(res);
    } catch (error) {
        logger.error("Get upload URLs error", error);
        return new ErrorResponse("Failed to generate upload URLs").send(res);
    }
};

// ============================================================================
// DELETE MEDIA
// ============================================================================

/*
 * TODO: Implement deleteMedia controller
 * 
 * For cleaning up uploaded but unused media (draft cleanup).
 * 
 * Security:
 * - Extract userId from S3 key and verify matches req.auth.id
 * - Only allow deletion of keys in "temp/" prefix
 */

export const deleteMedia = async (req: Request, res: Response) => {
    try {
        if (!req.auth) {
            return new ErrorResponse("Unauthorized", { status: 401 }).send(res);
        }

        // TODO: Implement

        return new ErrorResponse("Not implemented", { status: 501 }).send(res);
    } catch (error) {
        logger.error("Delete media error", error);
        return new ErrorResponse("Failed to delete media").send(res);
    }
};
