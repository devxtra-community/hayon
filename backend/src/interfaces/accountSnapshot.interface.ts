import { Document, Types } from "mongoose";

export interface AccountMetrics {
  followers: number;
  totalPosts?: number;
}

export interface IAccountSnapshot extends Document {
  userId: Types.ObjectId;
  platform: string;
  snapshotAt: Date;
  metrics: AccountMetrics;
  createdAt: Date;
  updatedAt: Date;
}
