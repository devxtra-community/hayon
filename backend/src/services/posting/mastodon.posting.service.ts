// ============================================================================
// MASTODON POSTING SERVICE - SKELETON WITH TODO COMMENTS
// ============================================================================
// File: src/services/posting/mastodon.posting.service.ts
// Purpose: Post content to Mastodon instances
// ============================================================================

import { BasePostingService, PostResult } from "./base.posting.service";
import { PostQueueMessage } from "../../lib/queues/types";
import axios from "axios";

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

  /*
   * TODO: Implement media upload
   * 
   * Mastodon requires uploading media BEFORE creating status:
   * 
   * POST {instanceUrl}/api/v2/media
   * Headers: Authorization: Bearer {accessToken}
   * Body: multipart/form-data with file
   * 
   * Returns: { id: "media_id", type: "image", url: "..." }
   * 
   * Flow:
   * 1. Download media from S3 URL
   * 2. POST to Mastodon with file buffer
   * 3. Collect media IDs
   * 4. Use media IDs in status creation
   */

  async uploadMedia(mediaUrls: string[], credentials: any): Promise<string[]> {
    const { instanceUrl, auth: { accessToken } } = credentials;
    const mediaIds: string[] = [];
    const axios = require('axios');
    const FormData = require('form-data'); // Use form-data package

    for (const url of mediaUrls) {
      try {
        // Download from S3
        const response = await axios.get(url, { responseType: "arraybuffer" });
        const buffer = Buffer.from(response.data);

        // Create form data
        const formData = new FormData();
        formData.append("file", buffer, {
          filename: "media",
          contentType: response.headers["content-type"]
        });

        // Upload to Mastodon
        const uploadRes = await axios.post(
          `${instanceUrl}/api/v2/media`,
          formData,
          {
            headers: {
              ...formData.getHeaders(),
              Authorization: `Bearer ${accessToken}`
            }
          }
        );

        mediaIds.push(uploadRes.data.id);
      } catch (error: any) {
        console.error(`Error uploading media to Mastodon: ${error.response?.data || error.message}`);
        throw error;
      }
    }

    return mediaIds;
  }

  // ============================================================================
  // CREATE POST (Status)
  // ============================================================================

  /*
   * TODO: Implement status creation
   * 
   * POST {instanceUrl}/api/v1/statuses
   * Headers: Authorization: Bearer {accessToken}
   * Body (JSON):
   * {
   *   status: "Text content",
   *   media_ids: ["id1", "id2"],  // Optional
   *   visibility: "public",       // public, unlisted, private, direct
   *   spoiler_text: "CW text"     // Optional content warning
   * }
   * 
   * Returns:
   * {
   *   id: "status_id",
   *   url: "https://instance.social/@user/status_id",
   *   ...
   * }
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
