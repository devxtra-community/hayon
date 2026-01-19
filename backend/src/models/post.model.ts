// ============================================================================
// POST MODEL - SKELETON WITH TODO COMMENTS
// ============================================================================
// File: src/models/post.model.ts
// Purpose: Store post data and track status across multiple platforms
// ============================================================================

import mongoose, { Schema, Model, Types } from "mongoose";

// ============================================================================
// TODO: TYPES/INTERFACES TO DEFINE
// ============================================================================

/*
 * TODO: Define these in src/interfaces/post.interface.ts:
 *
 * 1. PostStatus enum:
 *    - DRAFT: Post saved but not submitted yet
 *    - PENDING: Post queued for immediate publishing
 *    - SCHEDULED: Post queued for future publishing
 *    - PROCESSING: Worker is currently processing this post
 *    - COMPLETED: All platforms published successfully
 *    - PARTIAL_SUCCESS: Some platforms succeeded, some failed
 *    - FAILED: All platforms failed
 *
 * 2. PlatformPostStatus interface (per-platform status):
 *    - platform: "bluesky" | "threads" | "tumblr" | "mastodon" | "facebook" | "instagram"
 *    - status: "pending" | "processing" | "completed" | "failed"
 *    - platformPostId?: string  // ID returned by platform after posting
 *    - platformPostUrl?: string // Direct link to the post on platform
 *    - error?: string           // Error message if failed
 *    - attemptCount: number     // For retry logic
 *    - lastAttemptAt?: Date
 *    - completedAt?: Date
 *
 * 3. MediaItem interface:
 *    - s3Key: string           // Key in S3 bucket
 *    - s3Url: string           // Full CDN/S3 URL
 *    - mimeType: string        // "image/jpeg", "video/mp4", etc.
 *    - originalFilename: string
 *    - sizeBytes: number
 *    - width?: number          // For images/videos
 *    - height?: number
 *    - duration?: number       // For videos (seconds)
 *
 * 4. Post interface:
 *    - userId: ObjectId
 *    - content: { text: string, mediaItems: MediaItem[] }
 *    - platformSpecificContent: Map<platform, { text: string, mediaItems?: MediaItem[] }>
 *    - selectedPlatforms: PlatformType[]
 *    - platformStatuses: PlatformPostStatus[]
 *    - scheduledAt?: Date
 *    - status: PostStatus
 *    - correlationId: string   // Links to RabbitMQ messages
 *    - timezone: string
 *    - metadata: { source: "web" | "api", userAgent?: string, ipAddress?: string }
 */

// ============================================================================
// TODO: PLATFORM-SPECIFIC CONTENT HANDLING
// ============================================================================

/*
 * EDGE CASE: Per-Platform Customization
 * 
 * When user edits content for a specific platform in the preview view,
 * we need to store platform-specific overrides.
 * 
 * Example scenario:
 * - User writes 500 char post
 * - Bluesky limit is 300 chars, user edits down for Bluesky only
 * - Original 500 char version goes to Facebook
 * - Edited 300 char version goes to Bluesky
 * 
 * Schema structure:
 * {
 *   content: { text: "Original 500 char post...", mediaItems: [...] },
 *   platformSpecificContent: {
 *     bluesky: { text: "Shortened 300 char...", mediaItems: [...] }
 *   }
 * }
 * 
 * Worker logic: Check platformSpecificContent[platform] first, 
 * fallback to main content if not customized.
 */

// ============================================================================
// TODO: SCHEMA DEFINITION
// ============================================================================

/*
 * Pseudo-schema structure:
 * 
 * const mediaItemSchema = new Schema({
 *   s3Key: { type: String, required: true },
 *   s3Url: { type: String, required: true },
 *   mimeType: { type: String, required: true },
 *   originalFilename: String,
 *   sizeBytes: Number,
 *   width: Number,
 *   height: Number,
 *   duration: Number
 * }, { _id: false });
 * 
 * const platformPostStatusSchema = new Schema({
 *   platform: { type: String, enum: [...ALL_PLATFORMS], required: true },
 *   status: { type: String, enum: ["pending", "processing", "completed", "failed"], default: "pending" },
 *   platformPostId: String,
 *   platformPostUrl: String,
 *   error: String,
 *   attemptCount: { type: Number, default: 0 },
 *   lastAttemptAt: Date,
 *   completedAt: Date
 * }, { _id: false });
 * 
 * const postSchema = new Schema({
 *   userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
 *   
 *   content: {
 *     text: { type: String, required: true },
 *     mediaItems: [mediaItemSchema]
 *   },
 *   
 *   platformSpecificContent: {
 *     type: Map,
 *     of: {
 *       text: String,
 *       mediaItems: [mediaItemSchema]
 *     }
 *   },
 *   
 *   selectedPlatforms: [{
 *     type: String,
 *     enum: ["bluesky", "threads", "tumblr", "mastodon", "facebook", "instagram"]
 *   }],
 *   
 *   platformStatuses: [platformPostStatusSchema],
 *   
 *   status: {
 *     type: String,
 *     enum: ["DRAFT", "PENDING", "SCHEDULED", "PROCESSING", "COMPLETED", "PARTIAL_SUCCESS", "FAILED"],
 *     default: "DRAFT",
 *     index: true
 *   },
 *   
 *   scheduledAt: { type: Date, index: true },
 *   
 *   correlationId: { type: String, unique: true, sparse: true },
 *   
 *   timezone: { type: String, default: "UTC" },
 *   
 *   metadata: {
 *     source: { type: String, enum: ["web", "api"], default: "web" },
 *     userAgent: String,
 *     ipAddress: String
 *   }
 * }, { timestamps: true });
 */

// ============================================================================
// TODO: INDEXES FOR PERFORMANCE
// ============================================================================

/*
 * Add these indexes for common query patterns:
 * 
 * 1. postSchema.index({ userId: 1, status: 1, createdAt: -1 })
 *    - For user's post history with status filter
 * 
 * 2. postSchema.index({ status: 1, scheduledAt: 1 })
 *    - For finding scheduled posts that need processing
 * 
 * 3. postSchema.index({ correlationId: 1 })
 *    - For worker to find post by RabbitMQ correlation ID
 * 
 * 4. postSchema.index({ "platformStatuses.status": 1, "platformStatuses.platform": 1 })
 *    - For finding posts with failed platform statuses for retry
 */

// ============================================================================
// TODO: HOOKS (PRE-SAVE MIDDLEWARE)
// ============================================================================

/*
 * Pre-save hook to:
 * 
 * 1. Initialize platformStatuses array based on selectedPlatforms
 *    - When post is first created, create a platformPostStatus entry
 *      for each platform in selectedPlatforms with status: "pending"
 * 
 * 2. Update overall status based on platformStatuses
 *    - If all platforms completed → status = "COMPLETED"
 *    - If some completed, some failed → status = "PARTIAL_SUCCESS"
 *    - If all failed → status = "FAILED"
 *    - If any processing → status = "PROCESSING"
 */

// ============================================================================
// TEMPORARY PLACEHOLDER - REPLACE WITH ACTUAL IMPLEMENTATION
// ============================================================================

// Placeholder to avoid syntax errors - implement full schema above
const postSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    // TODO: Add full schema as described above
}, { timestamps: true });

const PostModel: Model<any> = mongoose.model("Post", postSchema);

export default PostModel;
