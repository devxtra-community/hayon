import axios from "axios";
import logger from "../../utils/logger";

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
      const basicResponse = await axios.get(`${THREADS_GRAPH_URL}/${platformPostId}`, {
        params: {
          fields: "like_count,reply_count,repost_count,quote_count",
          access_token: auth.accessToken,
        },
      });

      const data = basicResponse.data;
      const metrics: PostMetrics = {
        likes: data.like_count || 0,
        shares: (data.repost_count || 0) + (data.quote_count || 0),
        comments: data.reply_count || 0,
        impressions: 0,
      };

      // 2. Try to fetch views from insights (optional)
      try {
        const insightsResponse = await axios.get(
          `${THREADS_GRAPH_URL}/${platformPostId}/threads_insights`,
          {
            params: {
              metric: "views",
              access_token: auth.accessToken,
            },
          },
        );
        const insights = insightsResponse.data.data || [];
        metrics.impressions =
          insights.find((m: any) => m.name === "views")?.total_value?.value || 0;
      } catch {
        // Ignore insight errors if basic data worked
      }

      return metrics;
    } catch (error: any) {
      const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      logger.error(`[ThreadsAnalytics] Failed to fetch post metrics: ${errorMsg}`, {
        platformPostId,
      });
      throw error;
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
      logger.error(`[ThreadsAnalytics] Failed to fetch account metrics`, {
        error: error.response?.data || error.message,
      });
      throw error;
    }
  }
}

export const threadsAnalyticsService = new ThreadsAnalyticsService();
