import { Request, Response } from "express";
import { SuccessResponse, ErrorResponse } from "../utils/responses";
import * as analyticsRepository from "../repositories/analytics.repository";
import * as postRepository from "../repositories/post.repository";
import { analyticsProducer } from "../lib/queues/analytics.producer";

const getDateRange = (req: Request) => {
  const end = new Date();
  const start = new Date();

  if (req.query.period === "7d") {
    start.setDate(end.getDate() - 7);
  } else {
    start.setDate(end.getDate() - 30);
  }

  return { start, end };
};

export const getOverview = async (req: Request, res: Response) => {
  try {
    if (!req.auth) {
      return new ErrorResponse("Unauthorized").send(res);
    }
    const userId = req.auth.id;
    const { start, end } = getDateRange(req);

    const [stats, followers, platformStats] = await Promise.all([
      analyticsRepository.getOverviewStats(userId, start, end),
      analyticsRepository.getLatestFollowerCounts(userId),
      analyticsRepository.getPlatformStats(userId, start, end),
    ]);

    // Sum total followers
    const totalFollowers = Object.values(followers).reduce((sum, count) => sum + count, 0);

    // Derive Best Platform
    const bestPlatform = platformStats.length > 0 ? platformStats[0]._id : "N/A";

    return new SuccessResponse("Overview fetched successfully", {
      data: {
        stats: {
          ...stats,
          bestPlatform,
        },
        followers: {
          total: totalFollowers,
          breakdown: followers,
        },
        platformPerformance: platformStats, // Include for convenience
        period: { start, end },
      },
    }).send(res);
  } catch (error: any) {
    return new ErrorResponse(error.message).send(res);
  }
};

export const getTimeline = async (req: Request, res: Response) => {
  try {
    if (!req.auth) {
      return new ErrorResponse("Unauthorized").send(res);
    }
    const userId = req.auth.id;
    const { start, end } = getDateRange(req);
    const platform = req.query.platform as string | undefined;

    const timeline = await analyticsRepository.getEngagementTimeline(userId, start, end, platform);

    return new SuccessResponse("Timeline fetched successfully", { data: timeline }).send(res);
  } catch (error: any) {
    return new ErrorResponse(error.message).send(res);
  }
};

export const getGrowth = async (req: Request, res: Response) => {
  try {
    if (!req.auth) {
      return new ErrorResponse("Unauthorized").send(res);
    }
    const userId = req.auth.id;
    const { start, end } = getDateRange(req);
    const platform = req.query.platform as string | undefined;

    const growth = await analyticsRepository.getFollowerGrowth(userId, start, end, platform);

    return new SuccessResponse("Growth data fetched", { data: growth }).send(res);
  } catch (error: any) {
    return new ErrorResponse(error.message).send(res);
  }
};

export const getTopPosts = async (req: Request, res: Response) => {
  try {
    if (!req.auth) {
      return new ErrorResponse("Unauthorized").send(res);
    }
    const userId = req.auth.id;
    const limit = Number(req.query.limit) || 5;
    const sortBy = (req.query.sortBy as string) || "totalEngagement";
    const platform = req.query.platform as string | undefined;

    const posts = await analyticsRepository.getTopPosts(userId, limit, sortBy, platform);

    return new SuccessResponse("Top posts fetched successfully", { data: posts }).send(res);
  } catch (error: any) {
    return new ErrorResponse(error.message).send(res);
  }
};

export const getPlatformPerformance = async (req: Request, res: Response) => {
  try {
    if (!req.auth) {
      return new ErrorResponse("Unauthorized").send(res);
    }
    const userId = req.auth.id;
    const { start, end } = getDateRange(req);

    const stats = await analyticsRepository.getPlatformStats(userId, start, end);

    return new SuccessResponse("Platform performance fetched", { data: stats }).send(res);
  } catch (error: any) {
    return new ErrorResponse(error.message).send(res);
  }
};

export const getHeatmap = async (req: Request, res: Response) => {
  try {
    if (!req.auth) {
      return new ErrorResponse("Unauthorized").send(res);
    }
    const userId = req.auth.id;
    const { start, end } = getDateRange(req);

    const data = await analyticsRepository.getHeatmapData(userId, start, end);

    return new SuccessResponse("Heatmap data fetched", { data }).send(res);
  } catch (error: any) {
    return new ErrorResponse(error.message).send(res);
  }
};

/**
 * Manual refresh of analytics for a specific post on a specific platform
 * POST /analytics/posts/:postId/refresh?platform=X
 */
export const refreshPostAnalytics = async (req: Request, res: Response) => {
  try {
    if (!req.auth) {
      return new ErrorResponse("Unauthorized").send(res);
    }
    const userId = req.auth.id;
    const { postId } = req.params;
    const platform = req.query.platform as string;

    if (!postId || !platform) {
      return new ErrorResponse("Missing postId or platform", { status: 400 }).send(res);
    }

    // Verify user owns the post
    const post = await postRepository.findById(postId);
    if (!post) {
      return new ErrorResponse("Post not found", { status: 404 }).send(res);
    }
    if (post.userId.toString() !== userId) {
      return new ErrorResponse("Unauthorized", { status: 403 }).send(res);
    }

    // Queue the analytics fetch
    await analyticsProducer.sendMessage({
      type: "post",
      postId,
      platform: platform as any,
    });

    // Wait for processing (simple delay - worker typically completes within 2-5s)
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Fetch latest snapshot
    const latestSnapshot = await analyticsRepository.getLatestSnapshotsForPost(postId);

    return new SuccessResponse("Analytics refreshed successfully", {
      data: {
        analytics: latestSnapshot,
        platform,
      },
    }).send(res);
  } catch (error: any) {
    return new ErrorResponse(error.message).send(res);
  }
};
