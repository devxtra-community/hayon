import mongoose, { Schema, Model } from "mongoose";
import { IAccountSnapshot } from "../interfaces/accountSnapshot.interface";
import { ALL_PLATFORMS } from "../interfaces/post.interface";

const accountSnapshotSchema = new Schema<IAccountSnapshot>(
  {
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
      index: -1,
    },

    metrics: {
      followers: { type: Number, required: true, default: 0 },
      totalPosts: { type: Number },
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
// 1. "Get history of followers for this platform" (Growth chart)
accountSnapshotSchema.index({ userId: 1, platform: 1, snapshotAt: -1 });

// 2. TTL Index (Optional/Future): Automatically delete snapshots older than 1 year (start with no expiry)
// accountSnapshotSchema.index({ snapshotAt: 1 }, { expireAfterSeconds: 31536000 });

const AccountSnapshotModel: Model<IAccountSnapshot> = mongoose.model<IAccountSnapshot>(
  "AccountSnapshot",
  accountSnapshotSchema,
);

export default AccountSnapshotModel;
