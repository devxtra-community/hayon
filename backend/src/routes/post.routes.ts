// ============================================================================
// POST ROUTES - SKELETON WITH TODO COMMENTS
// ============================================================================
// File: src/routes/post.routes.ts
// Purpose: API endpoints for creating, scheduling, and managing posts
// ============================================================================

import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
// TODO: Import controller functions once implemented
// import { createPost, getPostStatus, getUserPosts, cancelPost, retryPost } from "../controllers/post.controller";

const router = Router();

// ============================================================================
// ALL ROUTES REQUIRE AUTHENTICATION
// ============================================================================

router.use(authenticate);

// ============================================================================
// POST ENDPOINTS
// ============================================================================

/*
 * TODO: POST /api/posts
 * 
 * Creates a new post and queues it for publishing.
 * 
 * Request Body:
 * {
 *   text: string,                              // Required: Post content
 *   mediaUrls?: string[],                      // Optional: S3 URLs from upload
 *   selectedPlatforms: PlatformType[],         // Required: Which platforms to post to
 *   scheduledAt?: string,                      // Optional: ISO date for scheduling
 *   timezone: string,                          // Required: User's timezone
 *   platformSpecificContent?: {                // Optional: Per-platform overrides
 *     [platform]: { text?: string }
 *   }
 * }
 * 
 * Logic Flow:
 * 1. Validate request body
 * 2. Validate user has connected accounts for selected platforms
 * 3. Create Post document in MongoDB with status PENDING or SCHEDULED
 * 4. Upload media to S3 if not already uploaded
 * 5. Call Producer.queueSocialPost() for EACH selected platform
 *    - If scheduledAt provided → messages go to waiting room
 *    - If no scheduledAt → messages go directly to main queue
 * 6. Return postId and correlationId
 * 
 * Edge Cases:
 * - User selects platform they haven't connected → 400 error
 * - Media URLs provided but S3 object doesn't exist → 400 error
 * - scheduledAt is in the past → treat as immediate post
 * - Rate limiting per user (prevent spam)
 */
// router.post("/", createPost);

/*
 * TODO: GET /api/posts/:postId/status
 * 
 * Returns detailed status of a post including per-platform status.
 * 
 * Response:
 * {
 *   postId: string,
 *   status: PostStatus,
 *   platformStatuses: [{
 *     platform: string,
 *     status: string,
 *     platformPostId?: string,
 *     platformPostUrl?: string,
 *     error?: string
 *   }],
 *   createdAt: Date,
 *   scheduledAt?: Date
 * }
 * 
 * Use Cases:
 * - Frontend polling for post completion
 * - Showing user which platforms succeeded/failed
 */
// router.get("/:postId/status", getPostStatus);

/*
 * TODO: GET /api/posts
 * 
 * Returns paginated list of user's posts.
 * 
 * Query Params:
 * - status?: PostStatus filter
 * - page?: number (default 1)
 * - limit?: number (default 20, max 100)
 * - sortBy?: "createdAt" | "scheduledAt" (default "createdAt")
 * - sortOrder?: "asc" | "desc" (default "desc")
 * 
 * Response:
 * {
 *   posts: Post[],
 *   pagination: { page, limit, total, totalPages }
 * }
 */
// router.get("/", getUserPosts);

/*
 * TODO: DELETE /api/posts/:postId
 * 
 * Cancels a scheduled post (only if not yet processed).
 * 
 * Logic:
 * 1. Check post exists and belongs to user
 * 2. Check status is PENDING or SCHEDULED (can't cancel PROCESSING/COMPLETED)
 * 3. Remove message from RabbitMQ waiting room (if scheduled)
 *    - This is tricky! RabbitMQ doesn't support removing specific messages
 *    - Option A: Worker checks post status before processing, skips if cancelled
 *    - Option B: Use message TTL and a "cancelled" flag in DB
 * 4. Update post status to "CANCELLED" (add this status)
 * 
 * Edge Case: Race condition where worker picks up message right as user cancels
 * Solution: Worker should always check DB status before posting
 */
// router.delete("/:postId", cancelPost);

/*
 * TODO: POST /api/posts/:postId/retry
 * 
 * Retries failed platforms for a post.
 * 
 * Request Body:
 * {
 *   platforms?: PlatformType[]  // Optional: specific platforms to retry
 *                               // If not provided, retry all failed platforms
 * }
 * 
 * Logic:
 * 1. Get post, verify ownership
 * 2. Filter platformStatuses to find failed ones
 * 3. Reset their status to "pending", increment attemptCount
 * 4. Queue new messages for each platform to retry
 * 5. Update overall post status to PROCESSING
 */
// router.post("/:postId/retry", retryPost);

// ============================================================================
// MEDIA UPLOAD ENDPOINTS
// ============================================================================

/*
 * TODO: POST /api/posts/media/upload
 * 
 * Generates pre-signed S3 URLs for direct upload from frontend.
 * 
 * This is a 2-step process:
 * 1. Frontend calls this endpoint to get upload URL
 * 2. Frontend uploads directly to S3 using the pre-signed URL
 * 3. Frontend sends S3 URLs in createPost request
 * 
 * Request Body:
 * {
 *   files: [{
 *     filename: string,
 *     mimeType: string,
 *     sizeBytes: number
 *   }]
 * }
 * 
 * Response:
 * {
 *   uploadUrls: [{
 *     uploadUrl: string,    // Pre-signed PUT URL
 *     s3Key: string,
 *     s3Url: string         // Final URL after upload
 *   }]
 * }
 * 
 * Validation:
 * - Check mimeType is image/* or video/*
 * - Check sizeBytes doesn't exceed limit (e.g., 10MB for images, 100MB for videos)
 * - Rate limit uploads per user
 * 
 * S3 Key Format: "temp/{userId}/{uuid}.{ext}"
 * - "temp/" prefix for lifecycle rules (auto-delete after 24h if not used)
 * - Move to "posts/{userId}/{postId}/" when post is created
 */
// router.post("/media/upload", getUploadUrls);

/*
 * TODO: DELETE /api/posts/media/:s3Key
 * 
 * Deletes uploaded media (for draft cleanup).
 * Only allow deletion of user's own uploads.
 */
// router.delete("/media/:s3Key", deleteMedia);

export default router;

// ============================================================================
// MIDDLEWARE CONSIDERATIONS
// ============================================================================

/*
 * TODO: Add these middleware to routes:
 *
 * 1. Request validation middleware (using zod or joi)
 *    - Validate body matches expected schema
 *    - Return 400 with clear error messages
 *
 * 2. Rate limiting middleware
 *    - Limit posts per user per day (based on plan)
 *    - Limit media uploads per hour
 *
 * 3. Platform validation middleware
 *    - Check user has connected accounts for selected platforms
 *    - Check account health status (not expired/revoked)
 */

// ============================================================================
// REGISTER IN APP.TS
// ============================================================================

/*
 * TODO: Add to src/app.ts:
 * 
 * import postRoutes from "./routes/post.routes";
 * 
 * app.use("/api/posts", postRoutes);
 */
