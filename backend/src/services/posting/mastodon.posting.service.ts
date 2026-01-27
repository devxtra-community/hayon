import { BasePostingService, PostResult } from "./base.posting.service";
import { PostQueueMessage } from "../../lib/queues/types";
import axios from "axios";
import { downloadMedia, extractS3Key } from "../s3/s3.upload";

const MASTODON_CONSTRAINTS = {
  MAX_CHARS: 500, // Default, some instances allow more
  MAX_MEDIA: 4,
  MAX_IMAGE_SIZE: 10_000_000, // 10MB
  MAX_VIDEO_SIZE: 40_000_000, // 40MB
  SUPPORTED_TYPES: ["image/jpeg", "image/png", "image/gif", "video/webm", "video/mp4"],
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
    const {
      instanceUrl,
      auth: { accessToken },
    } = credentials;
    const mediaIds: string[] = [];

    for (const url of mediaUrls) {
      try {
        // Use S3 SDK to download (handles private access via IAM)
        const s3Key = extractS3Key(url);
        const buffer = await downloadMedia(s3Key);

        // Infer mimeType from extension
        const mimeType = url.endsWith(".png")
          ? "image/png"
          : url.endsWith(".webp")
            ? "image/webp"
            : url.endsWith(".gif")
              ? "image/gif"
              : url.endsWith(".mp4")
                ? "video/mp4"
                : "image/jpeg";

        // Create form data
        const formData = new FormData();
        const blob = new Blob([buffer], { type: mimeType });
        formData.append("file", blob, "media");

        // Upload to Mastodon
        const uploadRes = await axios.post(`${instanceUrl}/api/v2/media`, formData, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

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
    mediaIds: string[],
  ): Promise<PostResult> {
    const {
      instanceUrl,
      auth: { accessToken },
    } = credentials;
    try {
      const response = await axios.post(
        `${instanceUrl}/api/v1/statuses`,
        {
          status: payload.content.text,
          media_ids: mediaIds.length > 0 ? mediaIds : undefined,
          visibility: "public",
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      return {
        success: true,
        platformPostId: response.data.id,
        platformPostUrl: response.data.url,
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }
}
