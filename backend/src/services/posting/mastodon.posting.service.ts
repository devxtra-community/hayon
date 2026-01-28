import { BasePostingService, PostResult } from "./base.posting.service";
import { PostQueueMessage } from "../../lib/queues/types";
import axios from "axios";
import { downloadMedia, extractS3Key } from "../s3/s3.upload.service";
import { PLATFORM_CONSTRAINTS } from "@hayon/schemas";

const constraints = PLATFORM_CONSTRAINTS.mastodon;

export class MastodonPostingService extends BasePostingService {
  constructor() {
    super("mastodon");
  }

  async validateContent(payload: PostQueueMessage): Promise<string | null> {
    if (payload.content.text.length > constraints.maxChars) {
      return `Text exceeds ${constraints.maxChars} characters`;
    }

    const mediaCount = payload.content.mediaUrls?.length || 0;
    if (mediaCount > constraints.maxImages) {
      return `Maximum ${constraints.maxImages} media attachments allowed`;
    }

    return null;
  }

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
