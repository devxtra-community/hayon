import AnalyticsSnapshotModel from "../models/analyticsSnapshot.model";
import AccountSnapshotModel from "../models/accountSnapshot.model";
import PostModel from "../models/post.model";
import { Types } from "mongoose";
import { cacheAside } from "../utils/cache";

export const fillTimelineGaps = <T extends { _id: string }>(
  data: T[],
  startDate: Date,
  endDate: Date,
  defaultValues: Omit<T, "_id">,
): T[] => {
  const dataMap = new Map<string, T>();
  data.forEach((item) => {
    dataMap.set(item._id, item);
  });

  const result: T[] = [];
  const current = new Date(startDate);
  current.setUTCHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setUTCHours(23, 59, 59, 999);

  while (current <= end) {
    const dateStr = current.toISOString().split("T")[0];

    if (dataMap.has(dateStr)) {
      result.push(dataMap.get(dateStr)!);
    } else {
      result.push({
        _id: dateStr,
        ...defaultValues,
      } as T);
    }

    current.setUTCDate(current.getUTCDate() + 1);
  }

  return result;
};

/**
 * Get aggregated overview stats for a user
 */
export const getOverviewStats = async (userId: string, startDate: Date, endDate: Date) => {
  const dateStr = startDate.toISOString().split("T")[0];
  return cacheAside(
    `analytics:overview:${userId}:${dateStr}`,
    async () => {
      // 1. Get snapshot-based metrics (engagement, impressions, avg rate) within the period
      const snapshotStats = await AnalyticsSnapshotModel.aggregate([
        {
          $match: {
            userId: new Types.ObjectId(userId),
            snapshotAt: { $gte: startDate, $lte: endDate },
          },
        },
        { $sort: { snapshotAt: -1 } },
        {
          $group: {
            _id: {
              postId: "$postId",
              platform: "$platform",
            },
            latestSnapshot: { $first: "$$ROOT" },
          },
        },
        {
          $group: {
            _id: null,
            totalEngagement: { $sum: "$latestSnapshot.derived.totalEngagement" },
            totalImpressions: { $sum: "$latestSnapshot.metrics.impressions" },
            avgEngagementRate: { $avg: "$latestSnapshot.derived.engagementRate" },
          },
        },
      ]);

      // 2. Get TOTAL lifetime completed posts count across the platform (independent of period)
      // This counts each platform completion as a "post"
      const totalPostsCount = await PostModel.aggregate([
        { $match: { userId: new Types.ObjectId(userId) } },
        { $unwind: "$platformStatuses" },
        { $match: { "platformStatuses.status": "completed" } },
        { $count: "total" },
      ]);

      const stats = snapshotStats[0] || {
        totalEngagement: 0,
        totalImpressions: 0,
        avgEngagementRate: 0,
      };

      return {
        totalPosts: totalPostsCount[0]?.total || 0,
        totalEngagement: stats.totalEngagement,
        totalImpressions: stats.totalImpressions,
        avgEngagementRate: stats.avgEngagementRate,
      };
    },
    300, // 5 minutes
  );
};

/**
 * Get latest follower counts per platform
 */
export const getLatestFollowerCounts = async (userId: string) => {
  return cacheAside(
    `analytics:followers:${userId}`,
    async () => {
      const result = await AccountSnapshotModel.aggregate([
        {
          $match: {
            userId: new Types.ObjectId(userId),
          },
        },
        {
          $sort: { snapshotAt: -1 },
        },
        {
          $group: {
            _id: "$platform",
            followers: { $first: "$metrics.followers" },
            snapshotAt: { $first: "$snapshotAt" },
          },
        },
      ]);

      const counts: Record<string, number> = {};
      result.forEach((item) => {
        counts[item._id] = item.followers;
      });

      return counts;
    },
    600, // 10 minutes
  );
};

/**
 * Get engagement timeline (aggregated by day)
 */
export const getEngagementTimeline = async (
  userId: string,
  startDate: Date,
  endDate: Date,
  platform?: string,
) => {
  const dateStr = startDate.toISOString().split("T")[0];
  return cacheAside(
    `analytics:timeline:${userId}:${platform || "all"}:${dateStr}`,
    async () => {
      const baselineDate = new Date(startDate);
      baselineDate.setDate(baselineDate.getDate() - 1);

      const postMatch: any = {
        userId: new Types.ObjectId(userId),
        "platformStatuses.status": "completed",
        "platformStatuses.completedAt": { $gte: startDate, $lte: endDate },
      };

      if (platform && platform !== "all") {
        postMatch["platformStatuses.platform"] = platform;
      }

      const postsData = await PostModel.aggregate([
        { $match: { userId: new Types.ObjectId(userId) } },
        { $unwind: "$platformStatuses" },
        { $match: postMatch },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$platformStatuses.completedAt" },
            },
            postCount: { $sum: 1 },
          },
        },
      ]);

      const snapshotMatch: any = {
        userId: new Types.ObjectId(userId),
        snapshotAt: { $gte: baselineDate, $lte: endDate },
      };

      if (platform && platform !== "all") {
        snapshotMatch.platform = platform;
      }

      const snapshotData = await AnalyticsSnapshotModel.aggregate([
        { $match: snapshotMatch },
        { $sort: { snapshotAt: -1 } },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: "%Y-%m-%d", date: "$snapshotAt" } },
              postId: "$postId",
              platform: "$platform",
            },
            engagement: { $first: "$derived.totalEngagement" },
          },
        },
        {
          $group: {
            _id: "$_id.date",
            totalEngagement: { $sum: "$engagement" },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const postCountsMap = new Map(postsData.map((d) => [d._id, d.postCount]));
      const engagementTotalsMap = new Map(snapshotData.map((d) => [d._id, d.totalEngagement]));

      const timelineData = [];
      const current = new Date(startDate);
      const endLimit = new Date(endDate);

      while (current <= endLimit) {
        const todayStr = current.toISOString().split("T")[0];

        const yesterday = new Date(current);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        const todayTotal = engagementTotalsMap.get(todayStr);
        const yesterdayTotal = engagementTotalsMap.get(yesterdayStr);

        let gain = 0;
        if (todayTotal !== undefined) {
          const prevTotal = yesterdayTotal ?? 0;
          gain = Math.max(0, todayTotal - prevTotal);
        }

        timelineData.push({
          _id: todayStr,
          totalEngagement: gain,
          postCount: postCountsMap.get(todayStr) || 0,
        });

        current.setDate(current.getDate() + 1);
      }

      return timelineData;
    },
    300, // 5 minutes
  );
};

/**
 * Get follower growth over time
 */
export const getFollowerGrowth = async (
  userId: string,
  startDate: Date,
  endDate: Date,
  platform?: string,
) => {
  const dateStr = startDate.toISOString().split("T")[0];
  return cacheAside(
    `analytics:growth:${userId}:${platform || "all"}:${dateStr}`,
    async () => {
      const matchStage: any = {
        userId: new Types.ObjectId(userId),
        snapshotAt: { $gte: startDate, $lte: endDate },
      };

      if (platform && platform !== "all") {
        matchStage.platform = platform;
      }

      const data = await AccountSnapshotModel.aggregate([
        { $match: matchStage },
        { $sort: { snapshotAt: 1 } },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: "%Y-%m-%d", date: "$snapshotAt" } },
              platform: "$platform",
            },
            followers: { $last: "$metrics.followers" },
          },
        },
        {
          $group: {
            _id: "$_id.date",
            totalFollowers: { $sum: "$followers" },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      return fillTimelineGaps(data, startDate, endDate, { totalFollowers: 0 });
    },
    600, // 10 minutes
  );
};

/**
 * Get stats broke down by platform
 */
export const getPlatformStats = async (userId: string, startDate: Date, endDate: Date) => {
  const dateStr = startDate.toISOString().split("T")[0];
  return cacheAside(
    `analytics:platforms:${userId}:${dateStr}`,
    async () => {
      return await AnalyticsSnapshotModel.aggregate([
        {
          $match: {
            userId: new Types.ObjectId(userId),
            snapshotAt: { $gte: startDate, $lte: endDate },
          },
        },
        { $sort: { snapshotAt: -1 } },
        {
          $group: {
            _id: {
              postId: "$postId",
              platform: "$platform",
            },
            latestSnapshot: { $first: "$$ROOT" },
          },
        },
        {
          $group: {
            _id: "$latestSnapshot.platform",
            totalEngagement: { $sum: "$latestSnapshot.derived.totalEngagement" },
            totalImpressions: { $sum: "$latestSnapshot.metrics.impressions" },
            postCount: { $sum: 1 },
            avgEngagementRate: { $avg: "$latestSnapshot.derived.engagementRate" },
          },
        },
        { $sort: { totalEngagement: -1 } },
      ]);
    },
    600, // 10 minutes
  );
};

/**
 * Get posting activity heatmap
 */
export const getHeatmapData = async (userId: string, startDate: Date, endDate: Date) => {
  const dateStr = startDate.toISOString().split("T")[0];
  return cacheAside(
    `analytics:heatmap:${userId}:${dateStr}`,
    async () => {
      return await AnalyticsSnapshotModel.aggregate([
        {
          $match: {
            userId: new Types.ObjectId(userId),
            snapshotAt: { $gte: startDate, $lte: endDate },
          },
        },
        { $sort: { snapshotAt: -1 } },
        {
          $group: {
            _id: "$postId",
            latestSnapshot: { $first: "$$ROOT" },
          },
        },
        {
          $lookup: {
            from: "posts",
            localField: "_id",
            foreignField: "_id",
            as: "post",
          },
        },
        { $unwind: "$post" },
        {
          $project: {
            day: { $subtract: [{ $dayOfWeek: "$post.createdAt" }, 1] },
            hour: { $hour: "$post.createdAt" },
            engagement: "$latestSnapshot.derived.totalEngagement",
          },
        },
        {
          $group: {
            _id: { day: "$day", hour: "$hour" },
            value: { $avg: "$engagement" },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            day: "$_id.day",
            hour: "$_id.hour",
            value: { $round: ["$value", 0] },
          },
        },
        { $sort: { day: 1, hour: 1 } },
      ]);
    },
    3600, // 60 minutes
  );
};

/**
 * Get top performing posts
 */
export const getTopPosts = async (
  userId: string,
  limit: number = 5,
  sortBy: string = "totalEngagement",
  platform?: string,
) => {
  return cacheAside(
    `analytics:top-posts:${userId}:${platform || "all"}:${limit}:${sortBy}`,
    async () => {
      let sortField = "derived.totalEngagement";
      if (sortBy === "likes") sortField = "metrics.likes";
      if (sortBy === "comments") sortField = "metrics.comments";
      if (sortBy === "shares") sortField = "metrics.shares";
      if (sortBy === "impressions") sortField = "metrics.impressions";

      const matchStage: any = { userId: new Types.ObjectId(userId) };
      if (platform && platform !== "all") {
        matchStage.platform = platform;
      }

      return await AnalyticsSnapshotModel.aggregate([
        { $match: matchStage },
        { $sort: { snapshotAt: -1 } },
        {
          $group: {
            _id: { postId: "$postId", platform: "$platform" },
            doc: { $first: "$$ROOT" },
          },
        },
        { $replaceRoot: { newRoot: "$doc" } },
        { $sort: { [sortField]: -1, "_id.postId": -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: "posts",
            localField: "postId",
            foreignField: "_id",
            as: "postDetails",
          },
        },
        { $unwind: "$postDetails" },
        {
          $project: {
            platform: 1,
            metrics: 1,
            derived: 1,
            snapshotAt: 1,
            "postDetails.content": 1,
            "postDetails.platformSpecificContent": 1,
            "postDetails.platformStatuses": 1,
          },
        },
      ]);
    },
    900, // 15 minutes
  );
};

/**
 * Get latest analytics snapshots for a específicos post
 */
export const getLatestSnapshotsForPost = async (postId: string) => {
  if (!Types.ObjectId.isValid(postId)) return [];

  const result = await AnalyticsSnapshotModel.aggregate([
    { $match: { postId: new Types.ObjectId(postId) } },
    { $sort: { snapshotAt: -1 } },
    {
      $group: {
        _id: "$platform",
        latestSnapshot: { $first: "$$ROOT" },
      },
    },
    {
      $project: {
        _id: 0,
        platform: "$_id",
        metrics: "$latestSnapshot.metrics",
        derived: "$latestSnapshot.derived",
        snapshotAt: "$latestSnapshot.snapshotAt",
      },
    },
  ]);

  const analyticsByPlatform: Record<string, any> = {};
  result.forEach((item) => {
    analyticsByPlatform[item.platform] = {
      ...item.metrics,
      ...item.derived,
      snapshotAt: item.snapshotAt,
    };
  });

  return analyticsByPlatform;
};

export const createPostSnapshot = async (data: any) => {
  return await AnalyticsSnapshotModel.create(data);
};

export const createAccountSnapshot = async (data: any) => {
  return await AccountSnapshotModel.create(data);
};
