import mongoose, { Schema } from "mongoose";
import {
  ISocialAccount,
  ISocialAuth,
  ISocialHealth,
  ISocialProfile,
  IPlatformMetadata,
} from "../interfaces/socialAccount.interface";

// Profile Subdocument Schema

const profileSchema = new Schema<ISocialProfile>(
  {
    handle: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    avatarUrl: {
      type: String,
      required: true,
    },
    profileUrl: {
      type: String,
      required: true,
    },
  },
  { _id: false },
);

// Platform Metadata Subdocument Schema

const platformMetadataSchema = new Schema<IPlatformMetadata>(
  {
    instanceUrl: {
      type: String,
      default: null, // Mastodon Instance (e.g., https://mastodon.online)
    },
    blogHostname: {
      type: String,
      default: null, // Tumblr blog URL
    },
    did: {
      type: String,
      default: null, // Bluesky Decentralized Identifier
    },
    linkedPageId: {
      type: String,
      default: null, // Meta Page ID (required for FB/IG/Threads Insights)
    },
  },
  { _id: false },
);

// Auth Subdocument Schema

const authSchema = new Schema<ISocialAuth>(
  {
    accessToken: {
      type: String,
      required: true, // Encrypted
    },
    refreshToken: {
      type: String,
      default: null, // Encrypted
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    scopes: {
      type: [String], // Store scopes to know what you are allowed to poll
      default: [],
    },
    dpopKeyPair: {
      type: Schema.Types.Mixed, // REQUIRED for Bluesky OAuth security
      default: null,
    },
  },
  { _id: false },
);

// Health Subdocument Schema

const healthSchema = new Schema<ISocialHealth>(
  {
    status: {
      type: String,
      enum: ["active", "expired", "revoked", "error"],
      default: "active",
    },
    needsReconnection: {
      type: Boolean,
      default: false,
    },
    lastSuccessfulRefresh: {
      type: Date,
      default: null,
    },
    lastError: {
      type: String,
      default: null,
    },
    consecutiveFailures: {
      type: Number,
      default: 0,
    },
  },
  { _id: false },
);

// Main Social Account Schema

const socialAccountSchema = new Schema<ISocialAccount>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true, // ALWAYS REQUIRED: Links the account to your app's User
    },

    platform: {
      type: String,
      enum: ["mastodon", "tumblr", "bluesky", "facebook", "instagram", "threads"],
      required: true,
    },

    platformId: {
      type: String,
      required: true, // Unique platform ID (DID for Bluesky, IGSID for Instagram)
    },

    profile: {
      type: profileSchema,
      required: true,
    },

    platformMetadata: {
      type: platformMetadataSchema,
      default: () => ({}),
    },

    auth: {
      type: authSchema,
      required: true,
    },

    health: {
      type: healthSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  },
);

// Indexes

socialAccountSchema.index({ userId: 1, platform: 1 }, { unique: true });

socialAccountSchema.index({ platform: 1, platformId: 1 }, { unique: true });

export default mongoose.model<ISocialAccount>("SocialAccount", socialAccountSchema);
