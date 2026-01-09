export interface Profile {
  handle?: string;
  displayName?: string;
  avatar?: string;
}

export type HealthStatus = "active" | "expired" | "revoked" | "error";

export interface Health {
  status?: HealthStatus;
  needsReconnection?: boolean;
  lastSuccessfulRefresh?: Date;
  lastError?: string;
  consecutiveFailures?: number;
}

export interface MetaAuth {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  scopes?: string[];
}

export interface MetaIdentity {
  platformId?: string; // Page ID / IG User ID / Threads User ID
  profile?: Profile;
}

export interface MetaPlatformMetadata {
  linkedPageId?: string;
  businessId?: string;
}

export interface Meta {
  connected?: boolean;

  auth?: MetaAuth;
  health?: Health;

  facebook?: MetaIdentity;
  instagram?: MetaIdentity;
  threads?: MetaIdentity;

  platformMetadata?: MetaPlatformMetadata;
}

export interface BlueskyAuth {
  accessJwt?: string;
  refreshJwt?: string;
  expiresAt?: Date;
  dpopKeyPair?: any; // you can replace `any` with a stricter type later
}

export interface Bluesky {
  connected?: boolean;

  did?: string;
  handle?: string;

  profile?: Profile;

  auth?: BlueskyAuth;
  repo?: string;

  health?: Health;
}

export interface MastodonAuth {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  scopes?: string[];
}

export interface Mastodon {
  connected?: boolean;

  instanceUrl?: string;
  accountId?: string;

  profile?: Profile;

  auth?: MastodonAuth;
  health?: Health;
}

export interface TumblrAuth {
  oauthToken?: string;
  oauthTokenSecret?: string;
}

export interface Tumblr {
  connected?: boolean;

  blogHostname?: string;

  profile?: Profile;

  auth?: TumblrAuth;
  health?: Health;
}

import { Types } from "mongoose";

export interface SocialAccount {
  _id?: Types.ObjectId;

  userId: Types.ObjectId;

  meta?: Meta;
  bluesky?: Bluesky;
  mastodon?: Mastodon;
  tumblr?: Tumblr;

  createdAt?: Date;
  updatedAt?: Date;
}
