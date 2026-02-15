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

interface InstagramCredentials {
  platformId: string; // Instagram User ID
  businessId?: string;
  auth: {
    accessToken: string;
  };
}

const FB_GRAPH_URL = "https://graph.facebook.com/v24.0";

/**
 * Fetches analytics data from Instagram Graph API (via Facebook Graph API)
 */
export class InstagramAnalyticsService {
  /**
   * Fetch metrics for a specific post (media)
   * API: GET /{media-id}?fields=like_count,comments_count
   * Note: Instagram doesn't have "shares" in the traditional sense
   */
  async getPostMetrics(
    platformPostId: string,
    credentials: InstagramCredentials,
  ): Promise<PostMetrics> {
    const { auth } = credentials;

    try {
      // 1. Fetch basic engagement
      const response = await axios.get(`${FB_GRAPH_URL}/${platformPostId}`, {
        params: {
          fields: "like_count,comments_count",
          access_token: auth.accessToken,
        },
      });

      const data = response.data;
      const metrics: PostMetrics = {
        likes: data.like_count || 0,
        shares: 0,
        comments: data.comments_count || 0,
        impressions: 0,
        reach: 0,
        saved: 0,
      };

      // 2. Fetch extended insights
      try {
        const insightsResponse = await axios.get(`${FB_GRAPH_URL}/${platformPostId}/insights`, {
          params: {
            metric: "impressions,reach,saved",
            access_token: auth.accessToken,
          },
        });

        const insights = insightsResponse.data.data || [];
        metrics.impressions =
          insights.find((m: any) => m.name === "impressions")?.values?.[0]?.value || 0;
        metrics.reach = insights.find((m: any) => m.name === "reach")?.values?.[0]?.value || 0;
        metrics.saved = insights.find((m: any) => m.name === "saved")?.values?.[0]?.value || 0;
      } catch {
        logger.debug(`[InstagramAnalytics] Failed to fetch insights for post ${platformPostId}`);
      }

      return metrics;
    } catch (error: any) {
      const errorData = error.response?.data?.error;
      const statusCode = error.response?.status;

      if (errorData?.code === 190 || statusCode === 401) {
        throw new SocialMediaAnalyticsError(
          AnalyticsErrorType.UNAUTHORIZED,
          "Instagram session expired or revoked",
          error,
        );
      }

      if (errorData?.code === 100 || statusCode === 404) {
        throw new SocialMediaAnalyticsError(
          AnalyticsErrorType.DELETED,
          "Post may have been deleted on Instagram",
          error,
        );
      }

      logger.error(`[InstagramAnalytics] Failed to fetch post metrics`, {
        platformPostId,
        error: error.response?.data || error.message,
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
   * API: GET /{ig-user-id}?fields=followers_count,media_count
   */
  async getAccountMetrics(credentials: InstagramCredentials): Promise<AccountMetrics> {
    const { platformId, businessId, auth } = credentials;
    const igUserId = businessId || platformId;

    try {
      const response = await axios.get(`${FB_GRAPH_URL}/${igUserId}`, {
        params: {
          fields: "followers_count,media_count",
          access_token: auth.accessToken,
        },
      });

      const data = response.data;

      return {
        followers: data.followers_count || 0,
        totalPosts: data.media_count || 0,
      };
    } catch (error: any) {
      const errorData = error.response?.data?.error;
      const statusCode = error.response?.status;

      if (errorData?.code === 190 || statusCode === 401) {
        throw new SocialMediaAnalyticsError(
          AnalyticsErrorType.UNAUTHORIZED,
          "Instagram session expired or revoked",
          error,
        );
      }

      logger.error(`[InstagramAnalytics] Failed to fetch account metrics`, {
        igUserId,
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

export const instagramAnalyticsService = new InstagramAnalyticsService();
