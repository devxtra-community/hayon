import { BasePostingService, PostResult } from "./base.posting.service";
import { PostQueueMessage } from "../../lib/queues/types";
import axios from "axios";
import { getPresignedDownloadUrl, extractS3Key } from "../s3/s3.upload.service";
import { PLATFORM_CONSTRAINTS } from "@hayon/schemas";

const constraints = PLATFORM_CONSTRAINTS.facebook;

export class FacebookPostingService extends BasePostingService {
  private graphApiUrl = "https://graph.facebook.com/v24.0";

  constructor() {
    super("facebook");
  }

  async validateContent(payload: PostQueueMessage): Promise<string | null> {
    if (payload.content.text.length > constraints.maxChars) {
      return `Text exceeds ${constraints.maxChars} character limit`;
    }

    return null;
  }

  async uploadMedia(mediaUrls: string[], _credentials: any): Promise<string[]> {
    // Facebook Graph API MUST have a publicly accessible URL to fetch the media.
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
    const { platformId: pageId, auth } = credentials;
    const { accessToken } = auth;
    const hasMedia = mediaUrls && mediaUrls.length > 0;

    try {
      let response;

      if (!hasMedia) {
        // Text-only post
        response = await axios.post(`${this.graphApiUrl}/${pageId}/feed`, null, {
          params: {
            message: payload.content.text,
            access_token: accessToken,
          },
        });
      } else if (mediaUrls.length === 1) {
        // Single photo
        // Note: Facebook /photos returns 'id' and 'post_id'
        response = await axios.post(`${this.graphApiUrl}/${pageId}/photos`, null, {
          params: {
            url: mediaUrls[0],
            caption: payload.content.text,
            access_token: accessToken,
          },
        });
      } else {
        // Multiple photos (Carousel/Album style)
        // 1. Upload each photo as unpublished
        const mediaIds = [];
        for (const url of mediaUrls) {
          const photoRes = await axios.post(`${this.graphApiUrl}/${pageId}/photos`, null, {
            params: {
              url,
              published: false,
              access_token: accessToken,
            },
          });
          mediaIds.push(photoRes.data.id);
        }

        // 2. Create feed post with attached media
        const attachedMedia = mediaIds.map((id) => ({ media_fbid: id }));
        response = await axios.post(`${this.graphApiUrl}/${pageId}/feed`, null, {
          params: {
            message: payload.content.text,
            attached_media: JSON.stringify(attachedMedia),
            access_token: accessToken,
          },
        });
      }

      const postId = response.data.post_id || response.data.id;

      return {
        success: true,
        platformPostId: postId,
        platformPostUrl: `https://www.facebook.com/${postId}`,
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }
}
