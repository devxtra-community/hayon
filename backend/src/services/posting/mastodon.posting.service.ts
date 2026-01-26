// ============================================================================
// MASTODON POSTING SERVICE - SKELETON WITH TODO COMMENTS
// ============================================================================
// File: src/services/posting/mastodon.posting.service.ts
// Purpose: Post content to Mastodon instances
// ============================================================================

import { BasePostingService, PostResult } from "./base.posting.service";
import { PostQueueMessage } from "../../lib/queues/types";
import axios from "axios";
import { downloadMedia, extractS3Key } from "../s3/s3.upload";

// ============================================================================
// MASTODON API SPECIFICS
// ============================================================================

/*
 * Mastodon is SELF-HOSTED / FEDERATED:
 * - Each user is on a specific INSTANCE (server)
 * - API endpoint varies: {instanceUrl}/api/v1/...
 * - Store instanceUrl per user in SocialAccountModel
 * 
 * API Docs: https://docs.joinmastodon.org/methods/statuses/
 * 
 * Authentication: OAuth2 Bearer token
 * 
 * Key Features:
 * - 500 char limit (instance-configurable)
 * - Up to 4 media attachments
 * - Content warnings (CW/spoiler text)
 * - Visibility levels (public, unlisted, followers-only, direct)
 */

// ============================================================================
// CONSTRAINTS
// ============================================================================

const MASTODON_CONSTRAINTS = {
  MAX_CHARS: 500,           // Default, some instances allow more
  MAX_MEDIA: 4,
  MAX_IMAGE_SIZE: 10_000_000,  // 10MB
  MAX_VIDEO_SIZE: 40_000_000,  // 40MB
  SUPPORTED_TYPES: ["image/jpeg", "image/png", "image/gif", "video/webm", "video/mp4"]
};

// ============================================================================
// MASTODON POSTING SERVICE
// ============================================================================

export class MastodonPostingService extends BasePostingService {
  constructor() {
    super("mastodon");
  }

  async validateContent(payload: PostQueueMessage): Promise<string | null> {
    if (payload.content.text.length > MASTODON_CONSTRAINTS.MAX_CHARS) {
      return `Text exceeds ${MASTODON_CONSTRAINTS.MAX_CHARS} characters`;
    }

    const mediaCount = payload.content.mediaUrls?.length || 0;
    if (mediaCount > MASTODON_CONSTRAINTS.MAX_MEDIA) {
      return `Maximum ${MASTODON_CONSTRAINTS.MAX_MEDIA} media attachments allowed`;
    }

    return null;
  }

  // ============================================================================
  // UPLOAD MEDIA
  // ============================================================================

  /**
   * Uploads media to Mastodon instance before creating a status.
   */

  async uploadMedia(mediaUrls: string[], credentials: any): Promise<string[]> {

    const { instanceUrl, auth: { accessToken } } = credentials;
    const mediaIds: string[] = [];

    for (const url of mediaUrls) {
      try {
        // Use S3 SDK to download (handles private access via IAM)
        const s3Key = extractS3Key(url);
        const buffer = await downloadMedia(s3Key);

        // Infer mimeType from extension
        const mimeType = url.endsWith(".png") ? "image/png" :
          url.endsWith(".webp") ? "image/webp" :
            url.endsWith(".gif") ? "image/gif" :
              url.endsWith(".mp4") ? "video/mp4" : "image/jpeg";

        // Create form data
        const formData = new FormData();
        const blob = new Blob([buffer], { type: mimeType });
        formData.append("file", blob, "media");

        // Upload to Mastodon
        const uploadRes = await axios.post(
          `${instanceUrl}/api/v2/media`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          }
        );

        mediaIds.push(uploadRes.data.id);
      } catch (error) {
        console.error(`Error uploading media to Mastodon: ${error}`);
        throw error;
      }
    }

    return mediaIds;
  }

  // ============================================================================
  // CREATE POST (Status)
  // ============================================================================

  /**
   * Creates a status (post) on Mastodon.
   */

  async createPost(
    payload: PostQueueMessage,
    credentials: any,
    mediaIds: string[]
  ): Promise<PostResult> {
    const { instanceUrl, auth: { accessToken } } = credentials;
    try {
      const response = await axios.post(
        `${instanceUrl}/api/v1/statuses`,
        {
          status: payload.content.text,
          media_ids: mediaIds.length > 0 ? mediaIds : undefined,
          visibility: "public"
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      return {
        success: true,
        platformPostId: response.data.id,
        platformPostUrl: response.data.url
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }
}

// ============================================================================
// CREDENTIALS STRUCTURE
// ============================================================================

/*
 * MastodonCredentials - From SocialAccountModel:
 *
 * interface MastodonCredentials {
 *   instanceUrl: string;   // socialAccount.mastodon.instanceUrl
 *   accessToken: string;   // socialAccount.mastodon.auth.accessToken
 *   accountId: string;     // socialAccount.mastodon.accountId
 * }
 *
 * IMPORTANT: instanceUrl is required because Mastodon is federated!
 */

// ============================================================================
// EDGE CASES
// ============================================================================

/*
 * 1. Instance-Specific Limits:
 *    - Some instances have different char limits
 *    - Could fetch /api/v1/instance for config
 *    - Consider caching instance info
 * 
 * 2. Media Processing:
 *    - v2/media is async (recommended)
 *    - v1/media is sync (deprecated but simpler)
 *    - May need to poll for media ready status
 * 
 * 3. Content Warnings:
 *    - spoiler_text field for CW
 *    - Common etiquette on Mastodon
 *    - Could be user preference in settings
 * 
 * 4. Visibility:
 *    - public: shown everywhere
 *    - unlisted: not on public timelines
 *    - private: followers only
 *    - direct: mentioned users only
 *    - Default to public for now
 */
