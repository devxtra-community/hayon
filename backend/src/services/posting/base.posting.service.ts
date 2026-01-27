import { PostQueueMessage } from "../../lib/queues/types";

// ============================================================================
// POST RESULT INTERFACE
// ============================================================================

export interface PostResult {
  success: boolean;
  platformPostId?: string; // ID returned by platform
  platformPostUrl?: string; // Direct URL to the post
  error?: string; // Error message if failed
  rateLimited?: boolean; // If rate limited, worker can delay retry
  retryAfter?: number; // Seconds to wait if rate limited
}

// ============================================================================
// ABSTRACT BASE CLASS
// ============================================================================

/**
 * Each platform implementation extends this and implements:
 * - post(): Main posting logic
 * - uploadMedia(): Platform-specific media upload
 * - validateContent(): Pre-flight content validation
 *
 * The worker calls these methods polymorphically.
 */

export abstract class BasePostingService {
  protected platformName: string;

  constructor(platformName: string) {
    this.platformName = platformName;
  }

  // ============================================================================
  // TEMPLATE METHOD - Main posting flow
  // ============================================================================

  /*
   * This is the main entry point called by the worker.
   * It follows the Template Method pattern:
   * 1. Validate content
   * 2. Upload media (if any)
   * 3. Create post
   * 4. Return result
   *
   * Concrete platform classes override specific steps.
   */

  async execute(payload: PostQueueMessage, credentials: any): Promise<PostResult> {
    try {
      // Step 1: Validate content before posting
      const validationError = await this.validateContent(payload);
      if (validationError) {
        return { success: false, error: validationError };
      }

      // Step 2: Upload media if present
      let mediaIds: string[] = [];
      if (payload.content.mediaUrls?.length) {
        mediaIds = await this.uploadMedia(payload.content.mediaUrls, credentials, payload);
      }

      // Step 3: Create the post
      const result = await this.createPost(payload, credentials, mediaIds);

      // Step 4: Log result
      if (result.success) {
        console.log(`✅ Posted to ${this.platformName}: ${result.platformPostUrl}`);
      } else {
        console.log(`❌ Failed to post to ${this.platformName}: ${result.error}`);
      }

      return result;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  // ============================================================================
  // ABSTRACT METHODS - Must be implemented by each platform
  // ============================================================================

  /*
   * createPost: Actual API call to create the post
   *
   * Parameters:
   * - payload: The queue message with content
   * - credentials: Platform-specific auth (tokens, session, etc.)
   * - mediaIds: IDs of uploaded media (platform-specific)
   */
  abstract createPost(
    payload: PostQueueMessage,
    credentials: any,
    mediaIds: string[],
  ): Promise<PostResult>;

  /*
   * uploadMedia: Upload media files to platform
   *
   * Most platforms require media to be uploaded separately before posting.
   * Returns array of platform-specific media IDs.
   *
   * Flow:
   * 1. Download from S3 URL
   * 2. Upload to platform API
   * 3. Return media ID(s)
   */
  abstract uploadMedia(
    mediaUrls: string[],
    credentials: any,
    payload: PostQueueMessage,
  ): Promise<string[]>;

  /*
   * validateContent: Pre-flight validation
   *
   * Checks:
   * - Character count within limit
   * - Media count/type/size within limits
   * - Required fields present
   *
   * Returns null if valid, error message if invalid.
   */
  abstract validateContent(payload: PostQueueMessage): Promise<string | null>;

  // ============================================================================
  // SHARED ERROR HANDLING
  // ============================================================================

  protected handleError(error: any): PostResult {
    // 1. Log full error for developers
    // console.error(`[${this.platformName}] Raw Error:`, error);

    // 2. Map common axios/network errors
    if (error.code === "ECONNABORTED") {
      return { success: false, error: "Connection timeout - platform API might be slow" };
    }

    // 3. Map platform response errors
    if (error.response?.status) {
      const status = error.response.status;
      const data = error.response.data;

      // Rate limiting
      if (status === 429) {
        const retryAfter = parseInt(error.response.headers["retry-after"]) || 60;
        return {
          success: false,
          error: "Rate limited by platform. Please try again later.",
          rateLimited: true,
          retryAfter,
        };
      }

      // Auth errors
      if (status === 401 || status === 403) {
        return {
          success: false,
          error: "Authentication failed. Please disconnect and reconnect your account.",
        };
      }

      // Bluesky specific errors
      if (this.platformName === "bluesky") {
        if (data?.error === "BlobTooLarge") {
          return { success: false, error: "Image is too large for Bluesky (max 976KB)." };
        }
      }

      // Meta (Instagram/Threads/Facebook) specific errors
      if (["instagram", "threads", "facebook"].includes(this.platformName)) {
        const metaError = data?.error;
        if (metaError) {
          // Map common Meta error codes
          if (metaError.code === 100 && metaError.error_subcode === 33) {
            return {
              success: false,
              error: "Invalid account ID. Please try reconnecting your account.",
            };
          }
          return { success: false, error: `Platform error: ${metaError.message}` };
        }
      }
    }

    // 4. Fallback to generic error
    return {
      success: false,
      error: error.message || "An unexpected error occurred while posting.",
    };
  }
}
