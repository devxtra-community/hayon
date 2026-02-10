import { Document, Types } from "mongoose";

export interface AnalyticsMetrics {
  likes: number;
  shares: number; // reblogs, reposts, etc.
  comments: number; // replies
  impressions?: number; // Optional: Only for FB, IG, Threads
  reach?: number; // Optional: Only for FB, IG
  saved?: number; // Optional: Only for IG
}

export interface DerivedMetrics {
  totalEngagement: number;
  engagementRate: number;
  virality: number;
}

export interface IAnalyticsSnapshot extends Document {
  postId: Types.ObjectId;
  userId: Types.ObjectId;
  platform: string;
  snapshotAt: Date;
  metrics: AnalyticsMetrics;
  derived: DerivedMetrics;
  followerCountAtSnapshot: number;
  createdAt: Date;
  updatedAt: Date;
}
