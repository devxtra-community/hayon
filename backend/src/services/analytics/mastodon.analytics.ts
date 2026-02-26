import axios from "axios";
import logger from "../../utils/logger";
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

interface MastodonCredentials {
  instanceUrl: string;
  auth: {
    accessToken: string;
  };
}

/**
 * Fetches analytics data from Mastodon API
 */
export class MastodonAnalyticsService {
  /**
   * Fetch metrics for a specific post (status)
   * API: GET /api/v1/statuses/:id
   */
  async getPostMetrics(
    platformPostId: string,
    credentials: MastodonCredentials,
  ): Promise<PostMetrics> {
    const { instanceUrl, auth } = credentials;

    try {
      const response = await axios.get(`${instanceUrl}/api/v1/statuses/${platformPostId}`, {
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
        },
      });

      const data = response.data;

      return {
        likes: data.favourites_count || 0,
        shares: data.reblogs_count || 0,
        comments: data.replies_count || 0,
      };
    } catch (error: any) {
      const statusCode = error.response?.status;

      if (statusCode === 401) {
        throw new SocialMediaAnalyticsError(
          AnalyticsErrorType.UNAUTHORIZED,
          "Mastodon session expired or revoked",
          error,
        );
      }

      if (statusCode === 404) {
        throw new SocialMediaAnalyticsError(
          AnalyticsErrorType.DELETED,
          "Post not found on Mastodon",
          error,
        );
      }

      logger.error(`[MastodonAnalytics] Failed to fetch post metrics`, {
        platformPostId,
        error: error.message,
      });
      throw new SocialMediaAnalyticsError(AnalyticsErrorType.UNKNOWN, error.message, error);
    }
  }

  /**
   * Fetch account-level metrics (followers)
   * API: GET /api/v1/accounts/verify_credentials
   */
  async getAccountMetrics(credentials: MastodonCredentials): Promise<AccountMetrics> {
    const { instanceUrl, auth } = credentials;

    try {
      const response = await axios.get(`${instanceUrl}/api/v1/accounts/verify_credentials`, {
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
        },
      });

      const data = response.data;

      return {
        followers: data.followers_count || 0,
        totalPosts: data.statuses_count || 0,
      };
    } catch (error: any) {
      const statusCode = error.response?.status;

      if (statusCode === 401) {
        throw new SocialMediaAnalyticsError(
          AnalyticsErrorType.UNAUTHORIZED,
          "Mastodon session expired or revoked",
          error,
        );
      }

      logger.error(`[MastodonAnalytics] Failed to fetch account metrics`, {
        error: error.message,
      });
      throw new SocialMediaAnalyticsError(AnalyticsErrorType.UNKNOWN, error.message, error);
    }
  }
}

export const mastodonAnalyticsService = new MastodonAnalyticsService();
