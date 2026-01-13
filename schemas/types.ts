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

export interface Facebook {
  connected?: boolean;
  platformId?: string; // Page ID
  profile?: Profile;
  auth?: MetaAuth;
  health?: Health;
}

export interface Instagram {
  connected?: boolean;
  platformId?: string; // IG User ID
  profile?: Profile;
  auth?: MetaAuth;
  health?: Health;

  // Specific metadata for IG linking
  linkedPageId?: string;
  businessId?: string;
}

export interface Threads {
  connected?: boolean;
  platformId?: string; // Threads User ID
  profile?: Profile;
  auth?: MetaAuth;
  health?: Health;
}

export interface BlueskyAuth {
  accessJwt?: string;
  refreshJwt?: string;
  expiresAt?: Date;
  dpopKeyPair?: unknown;
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

export interface SocialAccount {
  _id?: string;
  userId: string;

  // Flattened structure
  facebook?: Facebook;
  instagram?: Instagram;
  threads?: Threads;

  bluesky?: Bluesky;
  mastodon?: Mastodon;
  tumblr?: Tumblr;

  createdAt?: Date;
  updatedAt?: Date;
}
