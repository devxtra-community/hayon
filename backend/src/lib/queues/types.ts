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

// Analytics fetch payload
export interface AnalyticsFetchMessage extends BaseQueueMessage {
  type: "post" | "account";

  // When type = 'post'
  postId?: string;
  platform?: "bluesky" | "threads" | "tumblr" | "mastodon" | "facebook" | "instagram";

  // When type = 'account'
  userId?: string;
  platforms?: ("bluesky" | "threads" | "tumblr" | "mastodon" | "facebook" | "instagram")[];
}

export const EXCHANGES = {
  // Main exchange for IMMEDIATE posts (topic type)
  POST_EXCHANGE: "post_exchange",

  // Delayed exchange for SCHEDULED posts (x-delayed-message type)
  // Requires: rabbitmq_delayed_message_exchange plugin
  POST_DELAYED_EXCHANGE: "post_delayed_exchange",

  // Dead letter exchange for failed messages
  DLX_EXCHANGE: "dlx_exchange",

  // Analytics Exchange
  ANALYTICS_EXCHANGE: "analytics_exchange",
} as const;

export const QUEUES = {
  // Main queue for post processing
  SOCIAL_POSTS: "hayon_social_posts",

  // Retry queue (messages waiting for retry with TTL)
  RETRY_QUEUE: "hayon_retry_queue",

  // Parking lot for permanently failed messages
  PARKING_LOT: "hayon_parking_lot",

  // Dead letter queue for inspection
  DEAD_LETTERS: "hayon_dead_letters",

  // Analytics Queue
  ANALYTICS_FETCH: "hayon_analytics_fetch",
} as const;

export const ROUTING_KEYS = {
  POST_CREATE: "post.create",
  POST_CREATE_BLUESKY: "post.create.bluesky",
  POST_CREATE_INSTAGRAM: "post.create.instagram",
  POST_CREATE_THREADS: "post.create.threads",
  POST_CREATE_FACEBOOK: "post.create.facebook",
  POST_CREATE_MASTODON: "post.create.mastodon",
  POST_CREATE_TUMBLR: "post.create.tumblr",
  ANALYTICS_FETCH_POST: "analytics.fetch.post",
  ANALYTICS_FETCH_ACCOUNT: "analytics.fetch.account",
} as const;
