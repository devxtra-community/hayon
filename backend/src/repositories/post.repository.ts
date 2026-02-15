import PostModel from "../models/post.model";
import { Types } from "mongoose";
import { Post, PostStatus, PlatformType } from "../interfaces/post.interface";

export const createPost = async (data: Omit<Post, "_id" | "createdAt" | "updatedAt">) => {
  const post = await PostModel.create(data);
  return post;
};

export const findById = async (postId: string) => {
  const post = await PostModel.findById(postId);
  if (!post) {
    throw new Error("Post not found");
  }
  return post;
};

export const updatePlatformStatus = async (
  postId: string,
  platform: PlatformType,
  statusUpdate: {
    status: "pending" | "processing" | "completed" | "failed" | "deleted";
    platformPostId?: string;
    platformPostUrl?: string;
    error?: string;
    lastAttemptAt?: Date;
    completedAt?: Date;
  },
) => {
  if (!Types.ObjectId.isValid(postId)) {
    return null;
  }

  await PostModel.findOneAndUpdate(
    { _id: postId, "platformStatuses.platform": platform },
    {
      $set: {
        "platformStatuses.$.status": statusUpdate.status,
        "platformStatuses.$.platformPostId": statusUpdate.platformPostId,
        "platformStatuses.$.platformPostUrl": statusUpdate.platformPostUrl,
        "platformStatuses.$.error": statusUpdate.error,
        "platformStatuses.$.lastAttemptAt": statusUpdate.lastAttemptAt,
        "platformStatuses.$.completedAt": statusUpdate.completedAt,
      },
      $inc: {
        "platformStatuses.$.attemptCount": 1,
      },
    },
  );

  // Recalculate global status AFTER platform update
  return await updateOverallStatus(postId);
};

export const updateOverallStatus = async (postId: string) => {
  if (!Types.ObjectId.isValid(postId)) {
    return null;
  }

  const post = await PostModel.findById(postId);
  if (!post) {
    return null;
  }

  const statuses = post.platformStatuses.map((p) => p.status);

  let newStatus: PostStatus | null = null;

  if (statuses.includes("processing")) {
    newStatus = "PROCESSING";
  } else if (statuses.every((s) => s === "completed")) {
    newStatus = "COMPLETED";
  } else if (statuses.some((s) => s === "completed") && statuses.some((s) => s === "failed")) {
    newStatus = "PARTIAL_SUCCESS";
  } else if (statuses.every((s) => s === "failed")) {
    newStatus = "FAILED";
  }

  if (newStatus && post.status !== newStatus) {
    post.status = newStatus;
    await post.save();
  }

  return newStatus;
};
export const cancelPost = async (postId: string, userId: string) => {
  if (!Types.ObjectId.isValid(postId)) {
    return null;
  }

  return await PostModel.findOneAndUpdate(
    {
      _id: postId,
      userId: new Types.ObjectId(userId),
      status: { $in: ["PENDING", "SCHEDULED"] },
    },
    { status: "CANCELLED" },
    { new: true },
  );
};

export const updatePost = async (postId: string, userId: string, updates: Partial<Post>) => {
  if (!Types.ObjectId.isValid(postId)) {
    return null;
  }

  return await PostModel.findOneAndUpdate(
    {
      _id: postId,
      userId: new Types.ObjectId(userId),
    },
    { $set: updates },
    { new: true },
  );
};

export const deletePost = async (postId: string, userId: string) => {
  if (!Types.ObjectId.isValid(postId)) {
    return null;
  }

  return await PostModel.findOneAndDelete({
    _id: postId,
    userId: new Types.ObjectId(userId),
  });
};

// ============================================================================
// FIND BY USER (Paginated)
// ============================================================================

/*
 * Fetches paginated posts for a user.
 *
 * Parameters:
 * - userId: string
 * - options: { page, limit, status?, sortBy, sortOrder }
 *
 * Returns:
 * - { posts: Post[], total: number }
 *
 * Example Query:
 * const { posts, total } = await findByUserId(userId, {
 *   page: 1,
 *   limit: 20,
 *   status: "COMPLETED",
 *   sortBy: "createdAt",
 *   sortOrder: "desc"
 * });
 */

export const findByUserId = async (
  userId: string,
  options: {
    page?: number;
    limit?: number;
    status?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  } = {},
) => {
  const { page = 1, limit = 20, status, sortBy = "createdAt", sortOrder = "desc" } = options;

  const query: any = { userId: new Types.ObjectId(userId) };
  if (status) query.status = status;

  const [posts, total] = await Promise.all([
    PostModel.find(query)
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    PostModel.countDocuments(query),
  ]);

  return { posts, total };
};

// ============================================================================
// FIND BY CORRELATION ID
// ============================================================================

/*
 * Used by worker to find post from RabbitMQ message.
 */

export const findByCorrelationId = async (correlationId: string) => {
  return await PostModel.findOne({ correlationId });
};

// ============================================================================
// FIND SCHEDULED POSTS DUE
// ============================================================================

/*
 * Finds posts that are scheduled and past their scheduledAt time.
 * Used for backup processing if waiting room mechanism fails.
 *
 * Note: This shouldn't be needed if RabbitMQ waiting room works correctly,
 * but it's a safety net for edge cases.
 */

export const findScheduledPostsDue = async () => {
  // return await PostModel.find({
  //   status: "SCHEDULED",
  //   scheduledAt: { $lte: new Date() }
  // });
  return [];
};

// ============================================================================
// FIND FAILED PLATFORMS FOR RETRY
// ============================================================================

/*
 * Finds posts that have failed platforms below max retry attempts.
 * Used for automatic retry mechanism.
 */

export const findPostsWithFailedPlatforms = async (_maxAttempts: number = 3) => {
  // return await PostModel.find({
  //   "platformStatuses.attemptCount": { $lt: maxAttempts }
  // });
  return [];
};

// ============================================================================
// FIND POSTS NEEDING ANALYTICS UPDATE
// ============================================================================

/*
 * Finds posts that need their analytics refreshed based on "Smart Fetching" logic.
 *
 * Logic:
 * 1. Fresh (< 24h): Updates every 2 hours
 * 2. Recent (1-7 days): Updates every 12 hours
 * 3. Old (> 7 days): Updates every 24 hours
 * 4. Never fetched: Always
 */
export const findPostsNeedingAnalyticsUpdate = async () => {
  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const oneDayAgoThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgoThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  return await PostModel.find({
    "platformStatuses.status": "completed",
    $or: [
      // 1. FRESH POSTS (< 24h old): Update every 2 hours
      {
        createdAt: { $gte: oneDayAgoThreshold },
        "platformStatuses.lastAnalyticsFetch": { $lte: twoHoursAgo },
      },
      // 2. RECENT POSTS (1-7 days old): Update every 12 hours
      {
        createdAt: { $gte: sevenDaysAgoThreshold, $lt: oneDayAgoThreshold },
        "platformStatuses.lastAnalyticsFetch": { $lte: twelveHoursAgo },
      },
      // 3. OLD POSTS (> 7 days old): Update every 24 hours
      {
        createdAt: { $lt: sevenDaysAgoThreshold },
        "platformStatuses.lastAnalyticsFetch": { $lte: twentyFourHoursAgo },
      },
      // 4. NEWLY COMPLETED: Never fetched before
      {
        "platformStatuses.lastAnalyticsFetch": { $exists: false },
      },
    ],
  });
};
