import { BasePostingService, PostResult } from "./base.posting.service";
import { PostQueueMessage } from "../../lib/queues/types";
import { tumblrOAuth } from "../../utils/tumblrOAuth";
import axios from "axios";
import { PLATFORM_CONSTRAINTS } from "@hayon/schemas";

const constraints = PLATFORM_CONSTRAINTS.tumblr;

export class TumblrPostingService extends BasePostingService {
  private apiUrl = "https://api.tumblr.com/v2";

  constructor() {
    super("tumblr");
  }

  async validateContent(payload: PostQueueMessage): Promise<string | null> {
    if (payload.content.text && payload.content.text.length > constraints.maxChars) {
      return `Text exceeds ${constraints.maxChars} characters`;
    }

    const mediaCount = payload.content.mediaUrls?.length || 0;
    if (mediaCount > constraints.maxImages) {
      return `Maximum ${constraints.maxImages} photos allowed`;
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
        platformPostUrl: blogHostname.includes(".")
          ? `https://${blogHostname}/post/${postId}`
          : `https://${blogHostname}.tumblr.com/post/${postId}`,
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }
}
