// src/lib/queue/types.ts

// Base interface for all queue messages
export interface BaseQueueMessage {
  timestamp: Date;
  correlationId: string; // For tracking/debugging
}

// Specific payload for social media posts
export interface PostQueueMessage extends BaseQueueMessage {
  postId: string;
  userId: string;
  platform: "bluesky" | "threads" | "tumblr" | "mastodon" | "facebook" | "instagram";
  content: {
    text: string;
    mediaUrls?: string[];
  };
  scheduledAt?: Date; // Optional: for scheduled posts
}

// Response after processing
export interface PostResultMessage {
  postId: string;
  status: "COMPLETED" | "FAILED";
  platformPostId?: string; // ID returned by the social network
  error?: string;
}

// Exchange and Queue names (constants)
export const EXCHANGES = {
  POST_EXCHANGE: "post_exchange",
  POST_DELAYED_EXCHANGE: "post_delayed_exchange",
} as const;

export const QUEUES = {
  SOCIAL_POSTS: "hayon_social_posts",
} as const;

export const ROUTING_KEYS = {
  POST_CREATE: "post.create",
  POST_CREATE_FACEBOOK: "post.create.facebook",
  POST_CREATE_TWITTER: "post.create.twitter",
} as const;
