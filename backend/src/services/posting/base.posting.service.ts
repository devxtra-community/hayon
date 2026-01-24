import { PostQueueMessage } from "../../lib/queues/types";

// ============================================================================
// WHY A BASE CLASS?
// ============================================================================

/*
 * Each platform has different:
 * - API endpoints and authentication
 * - Media upload requirements (size limits, formats)
 * - Content constraints (character limits, hashtag handling)
 * - Rate limiting rules
 * 
 * A base class ensures:
 * - Consistent interface for the worker
 * - Shared error handling and logging
 * - Easy addition of new platforms
 */

// ============================================================================
// POST RESULT INTERFACE
// ============================================================================

export interface PostResult {
  success: boolean;
  platformPostId?: string;    // ID returned by platform
  platformPostUrl?: string;   // Direct URL to the post
  error?: string;             // Error message if failed
  rateLimited?: boolean;      // If rate limited, worker can delay retry
  retryAfter?: number;        // Seconds to wait if rate limited
}

// ============================================================================
// ABSTRACT BASE CLASS
// ============================================================================

/*
 * TODO: Implement this abstract class
 * 
 * Each platform implementation extends this and implements:
 * - post(): Main posting logic
 * - uploadMedia(): Platform-specific media upload
 * - validateContent(): Pre-flight content validation
 * 
 * The worker will call these methods polymorphically.
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
    // TODO: Implement template method

    try {
      // Step 1: Validate content before posting
      const validationError = await this.validateContent(payload);
      if (validationError) {
        return { success: false, error: validationError };
      }

      // console.log("validtion error", validationError)

      // Step 2: Upload media if present
      let mediaIds: string[] = [];
      if (payload.content.mediaUrls?.length) {
        mediaIds = await this.uploadMedia(payload.content.mediaUrls, credentials, payload);
      }

      console.log("this is media ids", mediaIds)

      // Step 3: Create the post
      const result = await this.createPost(payload, credentials, mediaIds);

      // Step 4: Log success
      console.log(`✅ Posted to ${this.platformName}: ${result.platformPostUrl}`);

      return result;
    } catch (error: any) {
      return this.handleError(error);
    }
    // return { success: false, error: "Not implemented" };
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
    mediaIds: string[]
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
    payload: PostQueueMessage
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
    // TODO: Implement common error handling

    // Check for rate limiting
    if (error.response?.status === 429) {
      const retryAfter = parseInt(error.response.headers["retry-after"]) || 60;
      return {
        success: false,
        error: "Rate limited",
        rateLimited: true,
        retryAfter
      };
    }

    // Check for auth errors (token expired)
    if (error.response?.status === 401 || error.response?.status === 403) {
      // TODO: Mark account as needing reconnection
      return {
        success: false,
        error: "Authentication failed - account needs reconnection"
      };
    }

    // Generic error
    return {
      success: false,
      error: error.message || "Unknown error"
    };
  }
}

// Factory is now in index.ts to prevent circular dependencies
