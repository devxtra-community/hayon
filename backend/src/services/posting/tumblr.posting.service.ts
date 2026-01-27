import { BasePostingService, PostResult } from "./base.posting.service";
import { PostQueueMessage } from "../../lib/queues/types";
import { tumblrOAuth } from "../../utils/tumblrOAuth";
import axios from "axios";

const TUMBLR_CONSTRAINTS = {
  MAX_CHARS: 4096,
  MAX_PHOTOS: 10,
  MAX_PHOTO_SIZE: 20_000_000, // 20MB
};

export class TumblrPostingService extends BasePostingService {
  private apiUrl = "https://api.tumblr.com/v2";

  constructor() {
    super("tumblr");
  }

  async validateContent(payload: PostQueueMessage): Promise<string | null> {
    if (payload.content.text && payload.content.text.length > TUMBLR_CONSTRAINTS.MAX_CHARS) {
      return `Text exceeds ${TUMBLR_CONSTRAINTS.MAX_CHARS} characters`;
    }

    const mediaCount = payload.content.mediaUrls?.length || 0;
    if (mediaCount > TUMBLR_CONSTRAINTS.MAX_PHOTOS) {
      return `Maximum ${TUMBLR_CONSTRAINTS.MAX_PHOTOS} photos allowed`;
    }

    return null;
  }

  async uploadMedia(mediaUrls: string[], _credentials: any): Promise<string[]> {
    // Tumblr accepts URLs directly in the NPF content block
    return mediaUrls;
  }

  async createPost(
    payload: PostQueueMessage,
    credentials: any,
    mediaUrls: string[],
  ): Promise<PostResult> {
    const { blogHostname, auth } = credentials;
    const { oauthToken, oauthTokenSecret } = auth;

    try {
      // Using NPF (Neue Post Format) for modern posting
      const content: any[] = [];

      if (payload.content.text) {
        content.push({
          type: "text",
          text: payload.content.text,
        });
      }

      if (mediaUrls && mediaUrls.length > 0) {
        mediaUrls.forEach((url) => {
          content.push({
            type: "image",
            media: [{ url }],
          });
        });
      }

      const requestData = {
        url: `${this.apiUrl}/blog/${blogHostname}/posts`,
        method: "POST",
      };

      // Sign request with OAuth 1.0a
      // IMPORTANT: Do NOT include JSON body in authorize() if it's not form-encoded parameters
      const headers = tumblrOAuth.toHeader(
        tumblrOAuth.authorize(requestData, {
          key: oauthToken,
          secret: oauthTokenSecret,
        }),
      );

      const response = await axios.post(
        requestData.url,
        { content }, // This is the JSON body, NOT included in signature
        { headers: { ...headers, "Content-Type": "application/json" } },
      );

      const postId = response.data.response.id_string || response.data.response.id;
      return {
        success: true,
        platformPostId: postId.toString(),
        platformPostUrl: `https://www.tumblr.com/posts/${postId}`,
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }
}
