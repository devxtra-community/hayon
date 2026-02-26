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

interface ThreadsCredentials {
  platformId: string; // Threads User ID
  auth: {
    accessToken: string;
  };
}

const THREADS_GRAPH_URL = "https://graph.threads.net/v1.0";

/**
 * Fetches analytics data from Threads API
 */
export class ThreadsAnalyticsService {
  /**
   * Fetch metrics for a specific post
   * API: GET /{media-id}?fields=likes,replies
   * Note: Threads uses "replies" instead of "comments"
   */
  async getPostMetrics(
    platformPostId: string,
    credentials: ThreadsCredentials,
  ): Promise<PostMetrics> {
    const { auth } = credentials;

    try {
      // 1. Fetch basic fields first (always available for the owner)
      // Note: We don't fetch counts here anymore as they might not be available as direct fields
      await axios.get(`${THREADS_GRAPH_URL}/${platformPostId}`, {
        params: {
          fields: "id,media_type,permalink",
          access_token: auth.accessToken,
        },
      });

      const metrics: PostMetrics = {
        likes: 0,
        shares: 0,
        comments: 0,
        impressions: 0,
      };

      // 2. Fetch engagement metrics from insights edge
      // Supported metrics: views, likes, replies, reposts, quotes
      try {
        const insightsResponse = await axios.get(
          `${THREADS_GRAPH_URL}/${platformPostId}/insights`,
          {
            params: {
              metric: "views,likes,replies,reposts,quotes",
              access_token: auth.accessToken,
            },
          },
        );

        const insights = insightsResponse.data.data || [];

        // Map insights to metrics
        metrics.likes = insights.find((m: any) => m.name === "likes")?.values?.[0]?.value || 0;

        const replies = insights.find((m: any) => m.name === "replies")?.values?.[0]?.value || 0;
        metrics.comments = replies;

        const reposts = insights.find((m: any) => m.name === "reposts")?.values?.[0]?.value || 0;
        const quotes = insights.find((m: any) => m.name === "quotes")?.values?.[0]?.value || 0;
        metrics.shares = reposts + quotes;

        metrics.impressions =
          insights.find((m: any) => m.name === "views")?.values?.[0]?.value || 0;
      } catch (insightError: any) {
        logger.warn(`[ThreadsAnalytics] Failed to fetch insights for ${platformPostId}:`, {
          error: insightError.response?.data || insightError.message,
        });
        // We still return basic empty metrics if insights fail but basic info was ok
      }

      return metrics;
    } catch (error: any) {
      const errorData = error.response?.data?.error;
      const statusCode = error.response?.status;

      if (errorData?.code === 190 || statusCode === 401) {
        throw new SocialMediaAnalyticsError(
          AnalyticsErrorType.UNAUTHORIZED,
          "Threads session expired or revoked",
          error,
        );
      }

      if (errorData?.code === 100 || statusCode === 404) {
        throw new SocialMediaAnalyticsError(
          AnalyticsErrorType.DELETED,
          "Post may have been deleted on Threads",
          error,
        );
      }

      const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      logger.error(`[ThreadsAnalytics] Failed to fetch post metrics: ${errorMsg}`, {
        platformPostId,
      });
      throw new SocialMediaAnalyticsError(
        AnalyticsErrorType.UNKNOWN,
        errorData?.message || error.message,
        error,
      );
    }
  }

  /**
   * Fetch account-level metrics (followers)
   * API: GET /me/threads_insights?metric=followers_count
   */
  async getAccountMetrics(credentials: ThreadsCredentials): Promise<AccountMetrics> {
    const { auth } = credentials;

    try {
      const response = await axios.get(`${THREADS_GRAPH_URL}/me/threads_insights`, {
        params: {
          metric: "followers_count",
          access_token: auth.accessToken,
        },
      });

      const insights = response.data.data || [];
      const followersMetric = insights.find((m: any) => m.name === "followers_count");

      return {
        followers: followersMetric?.total_value?.value || 0,
        totalPosts: 0, // Not available via threads_insights
      };
    } catch (error: any) {
      const errorData = error.response?.data?.error;
      const statusCode = error.response?.status;

      if (errorData?.code === 190 || statusCode === 401) {
        throw new SocialMediaAnalyticsError(
          AnalyticsErrorType.UNAUTHORIZED,
          "Threads session expired or revoked",
          error,
        );
      }

      logger.error(`[ThreadsAnalytics] Failed to fetch account metrics`, {
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

export const threadsAnalyticsService = new ThreadsAnalyticsService();
