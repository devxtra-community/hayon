import axios from "axios";
import { tumblrOAuth } from "../../utils/tumblrOAuth";
import logger from "../../utils/logger";
import type { AxiosRequestHeaders } from "axios";
import { AnalyticsErrorType, SocialMediaAnalyticsError } from "./errors";

export interface PostMetrics {
  likes: number;
  shares: number;
  comments: number;
  impressions?: number;
  reach?: number;
  saved?: number;
}

export interface AccountMetrics {
  followers: number;
  totalPosts: number;
}

interface TumblrCredentials {
  blogHostname: string;
  auth: {
    oauthToken: string;
    oauthTokenSecret: string;
  };
}

/**
 * Fetches analytics data from Tumblr API v2
 */
export class TumblrAnalyticsService {
  private apiUrl = "https://api.tumblr.com/v2";

  /**
   * Fetch metrics for a specific post
   * API: GET /v2/blog/{blog}/posts?id={postId}
   * Note: Tumblr uses "note_count" which combines likes, reblogs, and replies
   */
  async getPostMetrics(
    platformPostId: string,
    credentials: TumblrCredentials,
  ): Promise<PostMetrics> {
    const { blogHostname, auth } = credentials;

    try {
      const requestData = {
        url: `${this.apiUrl}/blog/${blogHostname}/posts?id=${platformPostId}`,
        method: "GET",
      };

      const headers = tumblrOAuth.toHeader(
        tumblrOAuth.authorize(requestData, {
          key: auth.oauthToken,
          secret: auth.oauthTokenSecret,
        }),
      ) as AxiosRequestHeaders;

      const response = await axios.get(requestData.url, { headers });

      const posts = response.data.response.posts;
      if (!posts || posts.length === 0) {
        throw new SocialMediaAnalyticsError(
          AnalyticsErrorType.DELETED,
          `Post not found on Tumblr: ${platformPostId}`,
        );
      }

      const post = posts[0];

      // Tumblr only provides combined note_count (likes + reblogs + replies)
      // We store it as "likes" to represent total engagement
      // shares and comments are set to 0 since we can't separate them
      const noteCount = post.note_count || 0;

      return {
        likes: noteCount, // Total engagement from notes
        shares: 0, // Tumblr doesn't expose reblogs separately
        comments: 0, // Tumblr doesn't expose replies separately
      };
    } catch (error: any) {
      if (error instanceof SocialMediaAnalyticsError) throw error;

      const statusCode = error.response?.status;

      if (statusCode === 401) {
        throw new SocialMediaAnalyticsError(
          AnalyticsErrorType.UNAUTHORIZED,
          "Tumblr session expired or revoked",
          error,
        );
      }

      if (statusCode === 404) {
        throw new SocialMediaAnalyticsError(
          AnalyticsErrorType.DELETED,
          "Post not found on Tumblr",
          error,
        );
      }

      logger.error(`[TumblrAnalytics] Failed to fetch post metrics`, {
        platformPostId,
        blogHostname,
        error: error.message,
      });
      throw new SocialMediaAnalyticsError(AnalyticsErrorType.UNKNOWN, error.message, error);
    }
  }

  /**
   * Fetch account-level metrics (followers)
   * API: GET /v2/blog/{blog}/followers
   */
  async getAccountMetrics(credentials: TumblrCredentials): Promise<AccountMetrics> {
    const { blogHostname, auth } = credentials;

    try {
      // Get followers count
      const followersRequest = {
        url: `${this.apiUrl}/blog/${blogHostname}/followers`,
        method: "GET",
      };

      const followersHeaders = tumblrOAuth.toHeader(
        tumblrOAuth.authorize(followersRequest, {
          key: auth.oauthToken,
          secret: auth.oauthTokenSecret,
        }),
      ) as AxiosRequestHeaders;

      const followersResponse = await axios.get(followersRequest.url, {
        headers: followersHeaders,
      });

      // Get blog info for total posts
      const blogInfoRequest = {
        url: `${this.apiUrl}/blog/${blogHostname}/info`,
        method: "GET",
      };

      const blogInfoHeaders = tumblrOAuth.toHeader(
        tumblrOAuth.authorize(blogInfoRequest, {
          key: auth.oauthToken,
          secret: auth.oauthTokenSecret,
        }),
      ) as AxiosRequestHeaders;

      const blogInfoResponse = await axios.get(blogInfoRequest.url, {
        headers: blogInfoHeaders,
      });

      return {
        followers: followersResponse.data.response.total_users || 0,
        totalPosts: blogInfoResponse.data.response.blog?.posts || 0,
      };
    } catch (error: any) {
      const statusCode = error.response?.status;

      if (statusCode === 401) {
        throw new SocialMediaAnalyticsError(
          AnalyticsErrorType.UNAUTHORIZED,
          "Tumblr session expired or revoked",
          error,
        );
      }

      logger.error(`[TumblrAnalytics] Failed to fetch account metrics`, {
        blogHostname,
        error: error.message,
      });
      throw new SocialMediaAnalyticsError(AnalyticsErrorType.UNKNOWN, error.message, error);
    }
  }
}

export const tumblrAnalyticsService = new TumblrAnalyticsService();
