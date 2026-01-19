// ============================================================================
// POST INTERFACE - SKELETON WITH TODO COMMENTS
// ============================================================================
// File: src/interfaces/post.interface.ts
// Purpose: TypeScript interfaces for post-related data structures
// ============================================================================

import { Types } from "mongoose";

// ============================================================================
// PLATFORM TYPES
// ============================================================================

export type PlatformType =
    | "bluesky"
    | "threads"
    | "tumblr"
    | "mastodon"
    | "facebook"
    | "instagram";

export const ALL_PLATFORMS: PlatformType[] = [
    "bluesky",
    "threads",
    "tumblr",
    "mastodon",
    "facebook",
    "instagram"
];

// ============================================================================
// POST STATUS STATES
// ============================================================================

/*
 * State Machine:
 * 
 * DRAFT ──(submit)──→ PENDING ──(worker picks up)──→ PROCESSING
 *                         ↓                              ↓
 *                  (if scheduledAt)                 ┌────┴────┐
 *                         ↓                         ↓         ↓
 *                    SCHEDULED               COMPLETED   PARTIAL_SUCCESS
 *                                                          ↓
 *                                                       FAILED
 */
export type PostStatus =
    | "DRAFT"           // Saved but not submitted
    | "PENDING"         // Submitted for immediate posting
    | "SCHEDULED"       // Submitted for future posting
    | "PROCESSING"      // Worker is currently processing
    | "COMPLETED"       // All platforms succeeded
    | "PARTIAL_SUCCESS" // Some platforms succeeded, some failed
    | "FAILED";         // All platforms failed

export type PlatformStatus =
    | "pending"     // Waiting in queue
    | "processing"  // Currently being posted
    | "completed"   // Successfully posted
    | "failed";     // Failed to post

// ============================================================================
// MEDIA ITEM
// ============================================================================

/*
 * TODO: Consider these edge cases:
 * 
 * 1. Platform-specific media constraints:
 *    - Bluesky: Max 4 images, no videos yet
 *    - Instagram: Requires at least 1 image/video
 *    - Threads: Max 20 images
 *    - Each platform has different max file sizes
 * 
 * 2. Media processing before upload:
 *    - Resize images if too large
 *    - Generate thumbnails for videos
 *    - Extract video duration/dimensions
 * 
 * 3. S3 organization:
 *    - Key format: "posts/{userId}/{postId}/{uuid}.{ext}"
 *    - Consider lifecycle rules for drafts (auto-delete after 30 days?)
 */
export interface MediaItem {
    s3Key: string;          // "posts/user123/post456/abc.jpg"
    s3Url: string;          // Full CDN URL
    mimeType: string;       // "image/jpeg", "video/mp4"
    originalFilename: string;
    sizeBytes: number;
    width?: number;
    height?: number;
    duration?: number;      // For videos, in seconds
}

// ============================================================================
// PLATFORM-SPECIFIC POST STATUS
// ============================================================================

/*
 * Each platform in selectedPlatforms gets its own status tracking.
 * This allows:
 * - Partial success (Twitter failed but Facebook succeeded)
 * - Independent retry per platform
 * - Platform-specific post IDs/URLs for analytics
 */
export interface PlatformPostStatus {
    platform: PlatformType;
    status: PlatformStatus;
    platformPostId?: string;   // ID from platform (e.g., Bluesky post rkey)
    platformPostUrl?: string;  // Direct link to post
    error?: string;            // Error message if failed
    attemptCount: number;      // For retry logic
    lastAttemptAt?: Date;
    completedAt?: Date;
}

// ============================================================================
// CONTENT STRUCTURE
// ============================================================================

export interface PostContent {
    text: string;
    mediaItems: MediaItem[];
}

// ============================================================================
// MAIN POST INTERFACE
// ============================================================================

export interface Post {
    _id?: Types.ObjectId;
    userId: Types.ObjectId;

    // Main content (default for all platforms)
    content: PostContent;

    // Platform-specific overrides (when user customizes per platform)
    // Key: platform name, Value: customized content
    platformSpecificContent?: Map<PlatformType, Partial<PostContent>>;

    // Which platforms to post to (selected by user)
    selectedPlatforms: PlatformType[];

    // Status per platform
    platformStatuses: PlatformPostStatus[];

    // Overall post status
    status: PostStatus;

    // Scheduling
    scheduledAt?: Date;
    timezone: string;

    // Links to RabbitMQ for tracking
    correlationId?: string;

    // Metadata
    metadata?: {
        source: "web" | "api";
        userAgent?: string;
        ipAddress?: string;
    };

    createdAt?: Date;
    updatedAt?: Date;
}

// ============================================================================
// REQUEST/RESPONSE DTOs
// ============================================================================

/*
 * TODO: Define these DTOs for API layer:
 * 
 * 1. CreatePostRequest:
 *    - text: string
 *    - mediaUrls?: string[]  // S3 URLs from separate upload endpoint
 *    - selectedPlatforms: PlatformType[]
 *    - scheduledAt?: string  // ISO date string
 *    - timezone: string
 *    - platformSpecificContent?: Record<PlatformType, { text?: string }>
 * 
 * 2. CreatePostResponse:
 *    - postId: string
 *    - correlationId: string
 *    - status: PostStatus
 *    - message: string
 * 
 * 3. PostStatusResponse:
 *    - postId: string
 *    - status: PostStatus
 *    - platformStatuses: PlatformPostStatus[]
 *    - completedAt?: Date
 * 
 * 4. UploadMediaRequest (for S3 pre-signed URLs):
 *    - filename: string
 *    - mimeType: string
 *    - sizeBytes: number
 * 
 * 5. UploadMediaResponse:
 *    - uploadUrl: string      // Pre-signed S3 PUT URL
 *    - s3Key: string
 *    - s3Url: string          // Final URL after upload
 */

export interface CreatePostRequest {
    text: string;
    mediaUrls?: string[];
    selectedPlatforms: PlatformType[];
    scheduledAt?: string;
    timezone: string;
    platformSpecificContent?: Record<PlatformType, { text?: string }>;
}

export interface CreatePostResponse {
    postId: string;
    correlationId: string;
    status: PostStatus;
    message: string;
}
