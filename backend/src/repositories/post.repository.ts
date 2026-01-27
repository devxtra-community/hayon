import PostModel from "../models/post.model";
import { Types } from "mongoose";
import { Post, PostStatus, PlatformType, PlatformStatus } from "../interfaces/post.interface";

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
    status: "pending" | "processing" | "completed" | "failed";
    platformPostId?: string;
    platformPostUrl?: string;
    error?: string;
    lastAttemptAt?: Date;
    completedAt?: Date;
  }
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
        "platformStatuses.$.completedAt": statusUpdate.completedAt
      },
      $inc: {
        "platformStatuses.$.attemptCount": 1
      }
    }
  );

  // Recalculate global status AFTER platform update
  await updateOverallStatus(postId);
};

export const updateOverallStatus = async (postId: string) => {
  if (!Types.ObjectId.isValid(postId)) {
    return null;
  }

  const post = await PostModel.findById(postId);
  if (!post) {
    return null;
  }

  const statuses = post.platformStatuses.map(p => p.status);

  let newStatus: PostStatus | null = null;

  if (statuses.includes("processing")) {
    newStatus = "PROCESSING";
  } else if (statuses.every(s => s === "completed")) {
    newStatus = "COMPLETED";
  } else if (
    statuses.some(s => s === "completed") &&
    statuses.some(s => s === "failed")
  ) {
    newStatus = "PARTIAL_SUCCESS";
  } else if (statuses.every(s => s === "failed")) {
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
      status: { $in: ["PENDING", "SCHEDULED"] }
    },
    { status: "CANCELLED" },
    { new: true }
  );
};

// ============================================================================
// FIND BY USER (Paginated)
// ============================================================================

/*
 * TODO: findByUserId
 * 
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
  }
) => {
  // TODO: Future Milestone - Implement User Post History

  // const { page = 1, limit = 20, status, sortBy = "createdAt", sortOrder = "desc" } = options;
  // 
  // const query: any = { userId: new Types.ObjectId(userId) };
  // if (status) query.status = status;
  // 
  // const [posts, total] = await Promise.all([
  //   PostModel.find(query)
  //     .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
  //     .skip((page - 1) * limit)
  //     .limit(limit),
  //   PostModel.countDocuments(query)
  // ]);
  // 
  // return { posts, total };
  return { posts: [], total: 0 };
};

// ============================================================================
// FIND BY CORRELATION ID
// ============================================================================

/*
 * TODO: findByCorrelationId
 * 
 * Used by worker to find post from RabbitMQ message.
 */

export const findByCorrelationId = async (correlationId: string) => {
  return await PostModel.findOne({ correlationId });
};




// ============================================================================
// FIND SCHEDULED POSTS DUE
// ============================================================================

/*
 * TODO: findScheduledPostsDue
 * 
 * Finds posts that are scheduled and past their scheduledAt time.
 * Used for backup processing if waiting room mechanism fails.
 * 
 * Note: This shouldn't be needed if RabbitMQ waiting room works correctly,
 * but it's a safety net for edge cases.
 */

export const findScheduledPostsDue = async () => {
  // TODO: Future Milestone - Implement Scheduled Post Safety Net
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
 * TODO: findPostsWithFailedPlatforms
 * 
 * Finds posts that have failed platforms below max retry attempts.
 * Used for automatic retry mechanism.
 */

export const findPostsWithFailedPlatforms = async (maxAttempts: number = 3) => {
  // TODO: Future Milestone - Implement Auto-Retry Logic
  // return await PostModel.find({
  //   "platformStatuses.status": "failed",
  //   "platformStatuses.attemptCount": { $lt: maxAttempts }
  // });
  return [];
};