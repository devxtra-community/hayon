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

interface FacebookCredentials {
  platformId: string; // Page ID
  auth: {
    accessToken: string;
  };
}

const FB_GRAPH_URL = "https://graph.facebook.com/v24.0";

/**
 * Fetches analytics data from Facebook Graph API
 */
export class FacebookAnalyticsService {
  /**
   * Fetch metrics for a specific post
   * API: GET /{post-id}?fields=likes.summary(true),shares,comments.summary(true)
   */
  async getPostMetrics(
    platformPostId: string,
    credentials: FacebookCredentials,
  ): Promise<PostMetrics> {
    const { auth } = credentials;

    try {
      // 1. Fetch basic engagement (likes, shares, comments)
      // Note: summary(true) requires pages_read_engagement
      const basicResponse = await axios.get(`${FB_GRAPH_URL}/${platformPostId}`, {
        params: {
          fields: "likes.summary(true),shares,comments.summary(true)",
          access_token: auth.accessToken,
        },
      });

      const data = basicResponse.data;
      const metrics: PostMetrics = {
        likes: data.likes?.summary?.total_count || 0,
        shares: data.shares?.count || 0,
        comments: data.comments?.summary?.total_count || 0,
        impressions: 0,
        reach: 0,
      };

      // 2. Try to fetch insights (reach and impressions)
      try {
        const insightsResponse = await axios.get(`${FB_GRAPH_URL}/${platformPostId}/insights`, {
          params: {
            metric: "post_impressions_unique,post_reach",
            access_token: auth.accessToken,
          },
        });

        const insights = insightsResponse.data.data || [];
        metrics.impressions =
          insights.find((m: any) => m.name === "post_impressions_unique")?.values?.[0]?.value || 0;
        metrics.reach = insights.find((m: any) => m.name === "post_reach")?.values?.[0]?.value || 0;
      } catch {
        // Insights might fail if the post is too new or permissions are missing - skip silently
        logger.debug(`[FacebookAnalytics] Failed to fetch insights for post ${platformPostId}`);
      }

      return metrics;
    } catch (error: any) {
      const errorData = error.response?.data?.error;
      const statusCode = error.response?.status;

      if (errorData?.code === 190 || statusCode === 401) {
        throw new SocialMediaAnalyticsError(
          AnalyticsErrorType.UNAUTHORIZED,
          "Facebook session expired or revoked",
          error,
        );
      }

      if (errorData?.code === 100 || statusCode === 404) {
        throw new SocialMediaAnalyticsError(
          AnalyticsErrorType.DELETED,
          "Post may have been deleted on Facebook",
          error,
        );
      }

      if (errorData?.code === 80004 || statusCode === 429) {
        throw new SocialMediaAnalyticsError(
          AnalyticsErrorType.RATE_LIMITED,
          "Facebook API rate limit reached",
          error,
        );
      }

      if (errorData?.code === 10) {
        logger.error(
          `[FacebookAnalytics] Permission Error: This app requires 'pages_read_engagement' to fetch engagement metrics.`,
          {
            message: errorData.message,
          },
        );
      } else {
        logger.error(`[FacebookAnalytics] Failed to fetch post metrics`, {
          platformPostId,
          error: errorData || error.message,
        });
      }
      throw new SocialMediaAnalyticsError(
        AnalyticsErrorType.UNKNOWN,
        errorData?.message || error.message,
        error,
      );
    }
  }

  /**
   * Fetch account-level metrics (page followers)
   * API: GET /{page-id}?fields=followers_count,fan_count
   */
  async getAccountMetrics(credentials: FacebookCredentials): Promise<AccountMetrics> {
    const { platformId, auth } = credentials;

    try {
      const response = await axios.get(`${FB_GRAPH_URL}/${platformId}`, {
        params: {
          fields: "followers_count,fan_count",
          access_token: auth.accessToken,
        },
      });

      const data = response.data;

      return {
        // fan_count is total likes, followers_count is total followers
        followers: data.followers_count || data.fan_count || 0,
        totalPosts: 0,
      };
    } catch (error: any) {
      const errorData = error.response?.data?.error;
      const statusCode = error.response?.status;

      if (errorData?.code === 190 || statusCode === 401) {
        throw new SocialMediaAnalyticsError(
          AnalyticsErrorType.UNAUTHORIZED,
          "Facebook session expired or revoked",
          error,
        );
      }

      logger.error(`[FacebookAnalytics] Failed to fetch account metrics`, {
        pageId: platformId,
        error: error.response?.data || error.message,
      });
      throw new SocialMediaAnalyticsError(
        AnalyticsErrorType.UNKNOWN,
        errorData?.message || error.message,
        error,
      );
    }
  }
}

export const facebookAnalyticsService = new FacebookAnalyticsService();
