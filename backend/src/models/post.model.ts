import mongoose, { Schema, Model, Types, Document } from "mongoose";
import { Post, ALL_PLATFORMS, PlatformStatus } from "../interfaces/post.interface";

export interface IPostDocument extends Post, Document {
  _id: Types.ObjectId;
}

const mediaItemSchema = new Schema(
  {
    // S3 storage path: "posts/user123/post456/image.jpg"
    s3Key: {
      type: String,
      required: true,
    },

    // Full URL to access the file: "https://cdn.example.com/posts/..."
    s3Url: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    originalFilename: String,
    sizeBytes: Number,
    width: Number,
    height: Number,

    // For videos only: length in seconds
    duration: Number,
  },
  {
    _id: false, // Don't create separate IDs for media items
  },
);

const platformPostStatusSchema = new Schema(
  {
    platform: {
      type: String,
      enum: [...ALL_PLATFORMS],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    platformPostId: String,
    platformPostUrl: String,
    error: String,
    attemptCount: {
      type: Number,
      default: 0,
    },
    lastAttemptAt: Date,
    completedAt: Date,
  },
  {
    _id: false,
  },
);

const postSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    content: {
      // The actual post text
      text: {
        type: String,
        required: true,
      },
      mediaItems: [mediaItemSchema],
    },

    platformSpecificContent: {
      type: Schema.Types.Mixed,
      default: {},
    },

    selectedPlatforms: [
      {
        type: String,
        enum: ALL_PLATFORMS,
      },
    ],

    platformStatuses: [platformPostStatusSchema],
    status: {
      type: String,
      enum: [
        "DRAFT",
        "PENDING",
        "SCHEDULED",
        "PROCESSING",
        "COMPLETED",
        "PARTIAL_SUCCESS",
        "FAILED",
        "CANCELLED",
      ],
      default: "DRAFT",
      index: true, // Index for fast status filtering
    },

    scheduledAt: {
      type: Date,
      index: true, // Index to quickly find posts ready to publish
    },

    correlationId: {
      type: String,
      unique: true,
      sparse: true,
    },

    timezone: {
      type: String,
      default: "UTC",
    },

    metadata: {
      source: {
        type: String,
        enum: ["web", "api"],
        default: "web",
      },

      userAgent: String,

      ipAddress: String,
    },
  },
  {
    timestamps: true,
  },
);

postSchema.index({ userId: 1, status: 1, createdAt: -1 });

postSchema.index({ status: 1, scheduledAt: 1 });

postSchema.index({
  "platformStatuses.status": 1,
  "platformStatuses.platform": 1,
});

postSchema.pre<IPostDocument>("save", function (next) {
  if (!this.isNew) {
    next();
    return;
  }

  // Initialize platformStatuses
  this.platformStatuses = this.selectedPlatforms.map((platform) => ({
    platform,
    status: "pending" as PlatformStatus,
    attemptCount: 0,
  })) as any; // Cast to any to satisfy Mongoose DocumentArray

  // Set initial overall status - respect DRAFT if explicitly set
  if (this.status !== "DRAFT") {
    this.status = this.scheduledAt ? "SCHEDULED" : "PENDING";
  }

  next();
});

const PostModel: Model<IPostDocument> = mongoose.model<IPostDocument>("Post", postSchema);

export default PostModel;
