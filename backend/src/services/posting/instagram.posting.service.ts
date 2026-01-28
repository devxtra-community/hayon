import { BasePostingService, PostResult } from "./base.posting.service";
import { PostQueueMessage } from "../../lib/queues/types";
import { getPresignedDownloadUrl, extractS3Key } from "../s3/s3.upload.service";
import axios from "axios";

// ============================================================================
// CONSTRAINTS
// ============================================================================

const INSTAGRAM_CONSTRAINTS = {
  MAX_CAPTION_CHARS: 2200,
  MAX_HASHTAGS: 30,
  MAX_IMAGES_CAROUSEL: 10,
  MIN_IMAGE_WIDTH: 320,
  MAX_IMAGE_WIDTH: 1440,
  ASPECT_RATIO_MIN: 0.8, // 4:5
  ASPECT_RATIO_MAX: 1.91, // 1.91:1
  SUPPORTED_TYPES: ["image/jpeg", "image/png"],
  MAX_VIDEO_DURATION: 60, // seconds for feed
  MAX_VIDEO_SIZE: 100_000_000, // 100MB
};

// ============================================================================
// INSTAGRAM POSTING SERVICE
// ============================================================================

export class InstagramPostingService extends BasePostingService {
  private graphApiUrl = "https://graph.facebook.com/v24.0";

  constructor() {
    super("instagram");
  }

  // ============================================================================
  // VALIDATE CONTENT
  // ============================================================================

  async validateContent(payload: PostQueueMessage): Promise<string | null> {
    if (!payload.content.mediaUrls || payload.content.mediaUrls.length === 0) {
      return "Instagram requires at least one image or video";
    }

    if (payload.content.text.length > INSTAGRAM_CONSTRAINTS.MAX_CAPTION_CHARS) {
      return `Caption exceeds ${INSTAGRAM_CONSTRAINTS.MAX_CAPTION_CHARS} character limit`;
    }

    const mediaCount = payload.content.mediaUrls?.length || 0;
    if (mediaCount > INSTAGRAM_CONSTRAINTS.MAX_IMAGES_CAROUSEL) {
      return `Maximum ${INSTAGRAM_CONSTRAINTS.MAX_IMAGES_CAROUSEL} images allowed for carousel`;
    }

    return null;
  }

  // ============================================================================
  // UPLOAD MEDIA - NOT STANDARD FOR INSTAGRAM!
  // ============================================================================

  /*
   * Instagram doesn't use traditional media upload!
   *
   * Instead, you provide a PUBLIC URL to the media:
   * - Single image: image_url parameter
   * - Single video: video_url parameter
   * - Carousel: array of item containers with media URLs
   *
   * S3 CONSIDERATIONS:
   * - Option A: Make bucket public (security concern)
   * - Option B: Generate pre-signed URLs with long expiry (1 hour+)
   * - Option C: Use CloudFront with signed URLs
   *
   * For this skeleton, we assume S3 URLs are publicly accessible.
   */

  async uploadMedia(
    mediaUrls: string[],
    _credentials: any,
    _payload: PostQueueMessage,
  ): Promise<string[]> {
    // Instagram Graph API MUST have a publicly accessible URL to fetch the media.
    // We convert our private S3 URLs into presigned download URLs (3 hour expiry to be safe).
    const presignedUrls = await Promise.all(
      mediaUrls.map(async (url) => {
        const s3Key = extractS3Key(url);
        return await getPresignedDownloadUrl(s3Key, 10800); // 3 hours
      }),
    );
    return presignedUrls;
  }

  // ============================================================================
  // CREATE POST - 2-STEP PROCESS
  // ============================================================================

  async createPost(
    payload: PostQueueMessage,
    credentials: any,
    mediaUrls: string[],
  ): Promise<PostResult> {
    const { platformId, businessId, auth } = credentials;
    const accessToken = auth?.accessToken;
    const igUserId = businessId || platformId;

    if (!igUserId || !accessToken) {
      return {
        success: false,
        error: "Missing Instagram User ID or Access Token",
      };
    }

    try {
      let containerId: string;
      const isVideo = mediaUrls[0]?.toLowerCase().match(/\.(mp4|mov|avi|wmv)$/);

      if (mediaUrls.length === 1) {
        if (isVideo) {
          // Video / Reels flow
          containerId = await this.createVideoContainer(igUserId, accessToken, {
            videoUrl: mediaUrls[0],
            caption: payload.content.text,
          });
          await this.waitForContainerReady(containerId, accessToken);
        } else {
          // Single image flow
          containerId = await this.createImageContainer(igUserId, accessToken, {
            imageUrl: mediaUrls[0],
            caption: payload.content.text,
          });
        }
      } else {
        // Carousel flow
        containerId = await this.createCarouselContainer(igUserId, accessToken, {
          mediaUrls,
          caption: payload.content.text,
        });
        // Carousels also need to be checked for ready status if they contain video
        await this.waitForContainerReady(containerId, accessToken);
      }

      // Publish the container
      const mediaId = await this.publishContainer(igUserId, accessToken, containerId);

      return {
        success: true,
        platformPostId: mediaId,
        platformPostUrl: `https://www.instagram.com/p/${mediaId}/`,
      };
    } catch (error: any) {
      const errorData = error.response?.data || error.message;
      console.error("Instagram post creation failed:", JSON.stringify(errorData, null, 2));
      return this.handleError(error);
    }
  }

  private async createImageContainer(
    igUserId: string,
    accessToken: string,
    { imageUrl, caption }: any,
  ): Promise<string> {
    const response = await axios.post(`${this.graphApiUrl}/${igUserId}/media`, {
      image_url: imageUrl,
      caption: caption,
      access_token: accessToken,
    });
    return response.data.id;
  }

  private async createVideoContainer(
    igUserId: string,
    accessToken: string,
    { videoUrl, caption }: any,
  ): Promise<string> {
    const response = await axios.post(`${this.graphApiUrl}/${igUserId}/media`, {
      video_url: videoUrl,
      media_type: "REELS",
      caption: caption,
      access_token: accessToken,
    });
    return response.data.id;
  }

  private async createCarouselContainer(
    igUserId: string,
    accessToken: string,
    { mediaUrls, caption }: any,
  ): Promise<string> {
    const childIds: string[] = [];

    for (const url of mediaUrls) {
      const isVideo = url.toLowerCase().match(/\.(mp4|mov|avi|wmv)$/);
      const res = await axios.post(`${this.graphApiUrl}/${igUserId}/media`, {
        [isVideo ? "video_url" : "image_url"]: url,
        is_carousel_item: true,
        access_token: accessToken,
      });
      childIds.push(res.data.id);
    }

    const response = await axios.post(`${this.graphApiUrl}/${igUserId}/media`, {
      media_type: "CAROUSEL",
      children: childIds,
      caption: caption,
      access_token: accessToken,
    });
    return response.data.id;
  }

  private async waitForContainerReady(containerId: string, accessToken: string): Promise<void> {
    let attempts = 0;
    const maxAttempts = 20;

    while (attempts < maxAttempts) {
      const response = await axios.get(`${this.graphApiUrl}/${containerId}`, {
        params: {
          fields: "status_code",
          access_token: accessToken,
        },
      });

      const status = response.data.status_code;
      if (status === "FINISHED") return;
      if (status === "ERROR") throw new Error("Instagram media processing failed");

      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds
      attempts++;
    }
    throw new Error("Instagram media processing timed out");
  }

  private async publishContainer(
    igUserId: string,
    accessToken: string,
    containerId: string,
  ): Promise<string> {
    const response = await axios.post(`${this.graphApiUrl}/${igUserId}/media_publish`, {
      creation_id: containerId,
      access_token: accessToken,
    });
    return response.data.id;
  }
}
