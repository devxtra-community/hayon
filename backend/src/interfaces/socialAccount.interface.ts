import { Document, Types } from "mongoose";

// Platform Types

export type SocialPlatform =
  | "mastodon"
  | "tumblr"
  | "bluesky"
  | "facebook"
  | "instagram"
  | "threads";

export type AccountHealthStatus = "active" | "expired" | "revoked" | "error";

// Profile Subdocument

export interface ISocialProfile {
  handle: string;
  displayName: string;
  avatarUrl: string;
  profileUrl: string;
}

// Platform Metadata Subdocument

export interface IPlatformMetadata {
  instanceUrl: string | null; // Mastodon Instance (e.g., https://mastodon.online)
  blogHostname: string | null; // Tumblr blog URL
  did: string | null; // Bluesky Decentralized Identifier
  linkedPageId: string | null; // Meta Page ID (required for FB/IG/Threads Insights)
}

// Auth Subdocument

export interface ISocialAuth {
  accessToken: string; // Encrypted
  refreshToken: string | null; // Encrypted
  expiresAt: Date | null;
  scopes: string[]; // Store scopes to know what you are allowed to poll
  dpopKeyPair: Record<string, unknown> | null; // REQUIRED for Bluesky OAuth security
}

// Health Subdocument

export interface ISocialHealth {
  status: AccountHealthStatus;
  needsReconnection: boolean;
  lastSuccessfulRefresh: Date | null;
  lastError: string | null;
  consecutiveFailures: number;
}

// Main Social Account Interface

export interface ISocialAccount extends Document {
  _id: Types.ObjectId;

  userId: Types.ObjectId; // ALWAYS REQUIRED: Links the account to your app's User

  platform: SocialPlatform;
  platformId: string; // Unique platform ID (DID for Bluesky, IGSID for Instagram)

  profile: ISocialProfile;

  platformMetadata: IPlatformMetadata;

  auth: ISocialAuth;

  health: ISocialHealth;

  createdAt: Date;
  updatedAt: Date;
}
