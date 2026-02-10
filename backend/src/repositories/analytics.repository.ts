import AnalyticsSnapshotModel from "../models/analyticsSnapshot.model";
import AccountSnapshotModel from "../models/accountSnapshot.model";
import { Types } from "mongoose";

/**
 * Fill gaps in timeline data with zero values for missing dates
 * Ensures continuous data for charts even when no activity occurred
 */
export const fillTimelineGaps = <T extends { _id: string }>(
  data: T[],
  startDate: Date,
  endDate: Date,
  defaultValues: Omit<T, "_id">,
): T[] => {
  // Create a map of existing data by date
  const dataMap = new Map<string, T>();
  data.forEach((item) => {
    dataMap.set(item._id, item);
  });

  // Generate all dates in range using UTC to avoid timezone shifts
  const result: T[] = [];
  const current = new Date(startDate);
  current.setUTCHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setUTCHours(23, 59, 59, 999);

  while (current <= end) {
    const dateStr = current.toISOString().split("T")[0]; // YYYY-MM-DD (UTC based)

    if (dataMap.has(dateStr)) {
      result.push(dataMap.get(dateStr)!);
    } else {
      // Fill with default values
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
 * - Total Posts tracked (Sum of posts across all platforms)
 * - Total Engagement (derived.totalEngagement)
 */
export const getOverviewStats = async (userId: string, startDate: Date, endDate: Date) => {
  const result = await AnalyticsSnapshotModel.aggregate([
    {
      $match: {
        userId: new Types.ObjectId(userId),
        snapshotAt: { $gte: startDate, $lte: endDate },
      },
    },
    // Sort to get the latest snapshot for each post-platform pair
    {
      $sort: { snapshotAt: -1 },
    },
    {
      $group: {
        _id: {
          postId: "$postId",
          platform: "$platform",
        },
        latestSnapshot: { $first: "$$ROOT" },
      },
    },
    // Sum up the metrics from the combined latest snapshots
    {
      $group: {
        _id: null,
        totalPosts: { $sum: 1 },
        totalEngagement: { $sum: "$latestSnapshot.derived.totalEngagement" },
        totalImpressions: { $sum: "$latestSnapshot.metrics.impressions" },
        avgEngagementRate: { $avg: "$latestSnapshot.derived.engagementRate" },
      },
    },
  ]);

  return (
    result[0] || { totalPosts: 0, totalEngagement: 0, totalImpressions: 0, avgEngagementRate: 0 }
  );
};

/**
 * Get latest follower counts per platform
 */
export const getLatestFollowerCounts = async (userId: string) => {
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
        _id: "$platform", // Group by platform
        followers: { $first: "$metrics.followers" }, // Get most recent count
        snapshotAt: { $first: "$snapshotAt" },
      },
    },
  ]);

  // Convert array to object map: { instagram: 500, facebook: 200 }
  const counts: Record<string, number> = {};
  result.forEach((item) => {
    counts[item._id] = item.followers;
  });

  return counts;
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
  const matchStage: any = {
    userId: new Types.ObjectId(userId),
    snapshotAt: { $gte: startDate, $lte: endDate },
  };

  if (platform && platform !== "all") {
    matchStage.platform = platform;
  }

  const data = await AnalyticsSnapshotModel.aggregate([
    {
      $match: matchStage,
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$snapshotAt" },
        },
        totalEngagement: { $sum: "$derived.totalEngagement" },
        postCount: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Fill gaps with zeros for missing dates
  return fillTimelineGaps(data, startDate, endDate, { totalEngagement: 0, postCount: 0 });
};

/**
 * Get follower growth over time (daily snapshots)
 */
export const getFollowerGrowth = async (
  userId: string,
  startDate: Date,
  endDate: Date,
  platform?: string,
) => {
  const matchStage: any = {
    userId: new Types.ObjectId(userId),
    snapshotAt: { $gte: startDate, $lte: endDate },
  };

  if (platform && platform !== "all") {
    matchStage.platform = platform;
  }

  const data = await AccountSnapshotModel.aggregate([
    {
      $match: matchStage,
    },
    { $sort: { snapshotAt: 1 } },
    // Group by Date and Platform to get latest snapshot per platform per day
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$snapshotAt" } },
          platform: "$platform",
        },
        followers: { $last: "$metrics.followers" },
      },
    },
    // Re-group by Date to sum up followers across platforms (if 'all' selected) OR just list them
    {
      $group: {
        _id: "$_id.date",
        totalFollowers: { $sum: "$followers" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Fill gaps with zeros for missing dates
  return fillTimelineGaps(data, startDate, endDate, { totalFollowers: 0 });
};

/**
 * Get stats broke down by platform
 */
export const getPlatformStats = async (userId: string, startDate: Date, endDate: Date) => {
  return await AnalyticsSnapshotModel.aggregate([
    {
      $match: {
        userId: new Types.ObjectId(userId),
        snapshotAt: { $gte: startDate, $lte: endDate },
      },
    },
    // Sort to get latest snapshot
    {
      $sort: { snapshotAt: -1 },
    },
    // Get latest snapshot per post-platform pair (handles multi-platform posts)
    {
      $group: {
        _id: {
          postId: "$postId",
          platform: "$platform",
        },
        latestSnapshot: { $first: "$$ROOT" },
      },
    },
    // Group by platform
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
};

/**
 * Get posting activity heatmap (by day of week and hour)
 * Using AnalyticsSnapshot creation time to approximate "Active" times
 * Or could use Post creation time if we link it.
 * For now, let's track "Engagement Checks" volume or use Post creation via Lookup.
 * Let's switch to using PostModel for "Posting Activity" heatmap.
 */
// Moved to PostRepository as it relates to Post creation, OR
// calculate "Engagement Heatmap" here (when did engagement happen?)
// Let's stick to Post Creation in PostRepository usually,
// Let's do Posting Volume from AnalyticsSnapshot (unique posts detected) for simplicity in this file,
// OR import PostModel. Let's use AnalyticsSnapshot timestamps to show "Data Collection" activity
// which proxies for "Content Liveness".
// ACTUALLY: User asked for "Activity Heatmap".
// Let's return daily volume.
/**
 * Get posting activity heatmap (Best Time to Post)
 *
 * Logic:
 * 1. Find latest snapshot for each post (to get final engagement).
 * 2. Lookup Post creation time.
 * 3. Group by Day/Hour of creation.
 * 4. Calculate Average Engagement for posts created in that slot.
 */
export const getHeatmapData = async (userId: string, _startDate: Date, _endDate: Date) => {
  // Note: We ignore date range filter for "Best Time" usually, as we want historical patterns.
  // But we can respect it if needed. Let's look at all-time history for better accuracy.

  return await AnalyticsSnapshotModel.aggregate([
    // 1. Filter by user
    { $match: { userId: new Types.ObjectId(userId) } },

    // 2. Get latest snapshot per post
    { $sort: { snapshotAt: -1 } },
    {
      $group: {
        _id: "$postId",
        latestSnapshot: { $first: "$$ROOT" },
      },
    },

    // 3. Lookup Post to get Creation Date
    {
      $lookup: {
        from: "posts",
        localField: "_id",
        foreignField: "_id",
        as: "post",
      },
    },
    { $unwind: "$post" },

    // 4. Project Day/Hour from CreatedAt
    {
      $project: {
        day: { $subtract: [{ $dayOfWeek: "$post.createdAt" }, 1] }, // Convert 1-7 to 0-6
        hour: { $hour: "$post.createdAt" }, // 0 - 23
        engagement: "$latestSnapshot.derived.totalEngagement",
      },
    },

    // 5. Group by Day/Hour and Avg Engagement
    {
      $group: {
        _id: { day: "$day", hour: "$hour" },
        value: { $avg: "$engagement" },
        count: { $sum: 1 },
      },
    },

    // 6. Flatten the response for frontend: {day, hour, value}
    {
      $project: {
        _id: 0,
        day: "$_id.day",
        hour: "$_id.hour",
        value: { $round: ["$value", 0] },
      },
    },

    // 7. Sort for easier reading
    { $sort: { day: 1, hour: 1 } },
  ]);
};

/**
 * Get top performing posts with advanced filtering
 */
export const getTopPosts = async (
  userId: string,
  limit: number = 5,
  sortBy: string = "totalEngagement", // 'likes', 'shares', 'comments', 'totalEngagement'
  platform?: string,
) => {
  const sortStage: any = {};

  // map generic sort keys to DB fields
  if (sortBy === "likes") sortStage["derived.metrics.likes"] = -1; // Note: metrics are inside doc root in some aggregations, check structure
  // In our schema: metrics.likes. But in lookup generic structure:
  // We need to be careful. The Snapshot has `metrics.likes`.

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
    {
      $match: matchStage,
    },
    {
      $sort: { snapshotAt: -1 },
    },
    {
      $group: {
        _id: { postId: "$postId", platform: "$platform" },
        doc: { $first: "$$ROOT" },
      },
    },
    {
      $replaceRoot: { newRoot: "$doc" },
    },
    {
      $sort: { [sortField]: -1, "_id.postId": -1 },
    },
    {
      $limit: limit,
    },
    // Lookup post details (image, text)
    {
      $lookup: {
        from: "posts",
        localField: "postId",
        foreignField: "_id",
        as: "postDetails",
      },
    },
    {
      $unwind: "$postDetails",
    },
    {
      $project: {
        platform: 1,
        metrics: 1,
        derived: 1,
        snapshotAt: 1,
        "postDetails.content": 1,
        "postDetails.platformSpecificContent": 1,
        "postDetails.platformStatuses": 1, // To get specific platform URL
      },
    },
  ]);
};

/**
 * Get the latest analytics snapshot for each platform for a specific post
 */
export const getLatestSnapshotsForPost = async (postId: string) => {
  if (!Types.ObjectId.isValid(postId)) {
    return [];
  }

  const result = await AnalyticsSnapshotModel.aggregate([
    {
      $match: {
        postId: new Types.ObjectId(postId),
      },
    },
    // Sort by snapshotAt desc to get latest first
    {
      $sort: { snapshotAt: -1 },
    },
    // Group by platform and take the first (latest) document
    {
      $group: {
        _id: "$platform",
        latestSnapshot: { $first: "$$ROOT" },
      },
    },
    // Project only the necessary fields
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

  // Convert array to object map: { facebook: { ...metrics }, instagram: { ...metrics } }
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
