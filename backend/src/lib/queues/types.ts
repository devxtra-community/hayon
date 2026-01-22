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

// ============================================================================
// EXCHANGE AND QUEUE CONSTANTS
// ============================================================================

export const EXCHANGES = {
  // Main exchange for IMMEDIATE posts (topic type)
  POST_EXCHANGE: "post_exchange",

  // Delayed exchange for SCHEDULED posts (x-delayed-message type)
  // Requires: rabbitmq_delayed_message_exchange plugin
  POST_DELAYED_EXCHANGE: "post_delayed_exchange",

  // Dead letter exchange for failed messages
  DLX_EXCHANGE: "dlx_exchange",
} as const;

export const QUEUES = {
  // Main queue for post processing
  SOCIAL_POSTS: "hayon_social_posts",

  // REMOVED: WAITING_ROOM - no longer needed with delayed plugin

  // Retry queue (messages waiting for retry with TTL)
  RETRY_QUEUE: "hayon_retry_queue",

  // Parking lot for permanently failed messages
  PARKING_LOT: "hayon_parking_lot",

  // Dead letter queue for inspection
  DEAD_LETTERS: "hayon_dead_letters",
} as const;

export const ROUTING_KEYS = {
  POST_CREATE: "post.create",
  POST_CREATE_BLUESKY: "post.create.bluesky",
  POST_CREATE_INSTAGRAM: "post.create.instagram",
  POST_CREATE_THREADS: "post.create.threads",
  POST_CREATE_FACEBOOK: "post.create.facebook",
  POST_CREATE_MASTODON: "post.create.mastodon",
  POST_CREATE_TUMBLR: "post.create.tumblr",
} as const;

