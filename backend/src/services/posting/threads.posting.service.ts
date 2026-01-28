import { BasePostingService, PostResult } from "./base.posting.service";
import { PostQueueMessage } from "../../lib/queues/types";
import axios from "axios";
import { getPresignedDownloadUrl, extractS3Key } from "../s3/s3.upload.service";

const THREADS_CONSTRAINTS = {
  MAX_CHARS: 500,
  MAX_IMAGES: 20,
};

export class ThreadsPostingService extends BasePostingService {
  private graphApiUrl = "https://graph.threads.net/v1.0";

  constructor() {
    super("threads");
  }

  async validateContent(payload: PostQueueMessage): Promise<string | null> {
    if (payload.content.text.length > THREADS_CONSTRAINTS.MAX_CHARS) {
      return `Text exceeds ${THREADS_CONSTRAINTS.MAX_CHARS} character limit`;
    }

    const mediaCount = payload.content.mediaUrls?.length || 0;
    if (mediaCount > THREADS_CONSTRAINTS.MAX_IMAGES) {
      return `Maximum ${THREADS_CONSTRAINTS.MAX_IMAGES} media items allowed`;
    }

    return null;
  }

  async uploadMedia(mediaUrls: string[], _credentials: any): Promise<string[]> {
    // Threads Graph API MUST have a publicly accessible URL to fetch the media.
    // We convert our private S3 URLs into presigned download URLs (3 hour expiry).
    const presignedUrls = await Promise.all(
      mediaUrls.map(async (url) => {
        const s3Key = extractS3Key(url);
        return await getPresignedDownloadUrl(s3Key, 10800); // 3 hours
      }),
    );
    return presignedUrls;
  }

  async createPost(
    payload: PostQueueMessage,
    credentials: any,
    mediaUrls: string[],
  ): Promise<PostResult> {
    const { platformId, auth } = credentials;
    const accessToken = auth?.accessToken;
    const threadsUserId = platformId;

    if (!threadsUserId || !accessToken) {
      return {
        success: false,
        error: "Missing Threads User ID or Access Token. Please reconnect your account.",
      };
    }
    const hasMedia = mediaUrls && mediaUrls.length > 0;

    try {
      // 1. Create Media Container
      const containerParams: any = {
        access_token: accessToken,
        text: payload.content.text,
      };

      if (!hasMedia) {
        containerParams.media_type = "TEXT";
      } else if (mediaUrls.length === 1) {
        const isVideo = mediaUrls[0].includes(".mp4") || mediaUrls[0].includes(".mov");
        containerParams.media_type = isVideo ? "VIDEO" : "IMAGE";
        if (isVideo) {
          containerParams.video_url = mediaUrls[0];
        } else {
          containerParams.image_url = mediaUrls[0];
        }
      } else {
        // Carousel logic
        const childIds: string[] = [];

        for (const url of mediaUrls) {
          const isVideo = url.includes(".mp4") || url.includes(".mov");
          const itemRes = await axios.post(`${this.graphApiUrl}/${threadsUserId}/threads`, null, {
            params: {
              access_token: accessToken,
              media_type: isVideo ? "VIDEO" : "IMAGE",
              [isVideo ? "video_url" : "image_url"]: url,
              is_carousel_item: true,
            },
          });
          const childId = itemRes.data.id;
          // Wait for child container to be ready
          await this.waitForContainerReady(childId, accessToken);
          childIds.push(childId);
        }

        containerParams.media_type = "CAROUSEL";
        containerParams.children = childIds.join(",");
      }

      const containerResponse = await axios.post(
        `${this.graphApiUrl}/${threadsUserId}/threads`,
        null,
        { params: containerParams },
      );

      const containerId = containerResponse.data.id;

      // 2. Wait for container to be ready (especially for videos/carousels)
      await this.waitForContainerReady(containerId, accessToken);

      const publishResponse = await axios.post(
        `${this.graphApiUrl}/${threadsUserId}/threads_publish`,
        null,
        {
          params: {
            creation_id: containerId,
            access_token: accessToken,
          },
        },
      );

      const postId = publishResponse.data.id;

      return {
        success: true,
        platformPostId: postId,
        platformPostUrl: `https://www.threads.net/t/${postId}`,
      };
    } catch (error: any) {
      const errorData = error.response?.data || error.message;
      console.error("Threads post creation failed:", JSON.stringify(errorData, null, 2));
      return this.handleError(error);
    }
  }

  private async waitForContainerReady(containerId: string, accessToken: string): Promise<void> {
    let attempts = 0;
    const maxAttempts = 30; // 5 mins max

    while (attempts < maxAttempts) {
      const response = await axios.get(`${this.graphApiUrl}/${containerId}`, {
        params: {
          fields: "status",
          access_token: accessToken,
        },
      });

      const status = response.data.status;
      if (status === "FINISHED") return;
      if (status === "ERROR") {
        throw new Error(
          `Threads media processing failed: ${response.data.error_message || "Unknown error"}`,
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds
      attempts++;
    }
    throw new Error("Threads media processing timed out");
  }
}
