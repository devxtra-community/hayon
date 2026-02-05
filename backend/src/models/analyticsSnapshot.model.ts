import mongoose, { Schema, Model } from "mongoose";
import { IAnalyticsSnapshot } from "../interfaces/analyticsSnapshot.interface";
import { ALL_PLATFORMS } from "../interfaces/post.interface";

const analyticsSnapshotSchema = new Schema<IAnalyticsSnapshot>(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    platform: {
      type: String,
      enum: ALL_PLATFORMS,
      required: true,
    },
    snapshotAt: {
      type: Date,
      required: true,
      index: -1, // Descending index for time-series queries
    },

    metrics: {
      likes: { type: Number, required: true, default: 0 },
      shares: { type: Number, required: true, default: 0 },
      comments: { type: Number, required: true, default: 0 },
      impressions: { type: Number },
      reach: { type: Number },
      saved: { type: Number },
    },

    derived: {
      totalEngagement: { type: Number, required: true, default: 0 },
      engagementRate: { type: Number, required: true, default: 0 },
      virality: { type: Number, required: true, default: 0 },
    },

    followerCountAtSnapshot: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// 1. "Get me metrics for this post, sorted by time" (Timeline view for a post)
analyticsSnapshotSchema.index({ postId: 1, snapshotAt: -1 });

// 2. "Get me all analytics for this user for this platform" (Platform performance)
analyticsSnapshotSchema.index({ userId: 1, platform: 1, snapshotAt: -1 });

// 3. "Get analytics for this user within a date range" (Dashboard overview)
analyticsSnapshotSchema.index({ userId: 1, snapshotAt: -1 });

const AnalyticsSnapshotModel: Model<IAnalyticsSnapshot> = mongoose.model<IAnalyticsSnapshot>(
  "AnalyticsSnapshot",
  analyticsSnapshotSchema,
);

export default AnalyticsSnapshotModel;
