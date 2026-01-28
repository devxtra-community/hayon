# Social Media Posting System - Complete Masterclass

A zero-to-hero guide for understanding RabbitMQ, queues, workers, and social media posting.

---

## Table of Contents
1. [The Big Picture](#1-the-big-picture)
2. [RabbitMQ Fundamentals](#2-rabbitmq-fundamentals)
3. [Your Current Setup](#3-your-current-setup)
4. [The Complete Posting Flow](#4-the-complete-posting-flow)
5. [Code Deep Dive](#5-code-deep-dive)
6. [Platform Behaviors](#6-platform-behaviors)
7. [S3 Media Handling](#7-s3-media-handling)
8. [Database Design](#8-database-design)
9. [What You Need to Implement](#9-what-you-need-to-implement)
10. [Running & Testing](#10-running--testing)

---

## 1. The Big Picture

### Why Do We Need Queues?

Imagine a user clicks "Post Now" for 5 platforms. Without queues:

```
User clicks → Server waits for Bluesky API (3s)
           → Server waits for Threads API (2s)  
           → Server waits for Instagram API (4s)
           → Server waits for Mastodon API (2s)
           → Server waits for Tumblr API (3s)
           → Finally responds after 14 seconds ❌
```

With queues:

```
User clicks → Server queues 5 messages (50ms)
           → Responds immediately ✅
           
[Meanwhile, in the background...]
Worker processes Bluesky...
Worker processes Threads...
Worker processes Instagram...
(Workers process all 5 in parallel or sequentially)
```

**Benefits:**
- **Instant response** to users
- **Retry failed posts** automatically
- **Schedule posts** for future times
- **Handle rate limits** gracefully
- **Scale workers** independently

---

## 2. RabbitMQ Fundamentals

### Core Concepts

Think of RabbitMQ like a **post office**:

| RabbitMQ Term | Post Office Analogy | Your Implementation |
|--------------|---------------------|---------------------|
| **Producer** | Person mailing letters | Your backend API |
| **Exchange** | Sorting facility | Routes messages to queues |
| **Queue** | Mailbox | Holds messages for workers |
| **Consumer/Worker** | Mail carrier | Processes messages |
| **Message** | The letter | Post job (JSON data) |

### Exchanges Explained

An **Exchange** receives messages and routes them to queues based on rules.

```
Producer → Exchange → Queue(s) → Consumer
```

**Exchange Types:**

| Type | How it Routes | Your Usage |
|------|--------------|------------|
| `direct` | Exact match on routing key | DLX for failures |
| `topic` | Pattern match (`*.create.*`) | Main posts |
| `fanout` | Broadcasts to all queues | Not used |
| `x-delayed-message` | Holds until delay expires | Scheduled posts |

### Routing Keys

Routing keys are like **address labels**. They tell exchanges where to send messages.

```typescript
// Your routing keys pattern: post.create.{platform}
"post.create.bluesky"    // → Goes to Bluesky worker
"post.create.threads"    // → Goes to Threads worker
"post.create.*"          // → Pattern matches ALL platforms
```

### Queue Bindings

**Binding** connects a queue to an exchange with a routing key pattern:

```typescript
// "Send all messages matching 'post.create.*' to SOCIAL_POSTS queue"
channel.bindQueue(QUEUES.SOCIAL_POSTS, EXCHANGES.POST_EXCHANGE, "post.create.*");
```

### Message Acknowledgment (ACK/NACK)

| Action | Meaning | When to Use |
|--------|---------|-------------|
| `channel.ack(msg)` | "Job done, delete message" | Success or permanent failure |
| `channel.nack(msg, false, false)` | "Job failed, discard" | Unrecoverable error |
| `channel.nack(msg, false, true)` | "Job failed, requeue" | Retry immediately (risky!) |

**Important:** Always ACK messages! Unacked messages stay in queue forever.

---

## 3. Your Current Setup

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                              │
│         handlePostNow() → calls /api/{platform}/post for each          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         BACKEND (Express)                               │
│   /api/bluesky/post  ─┐                                                 │
│   /api/threads/post  ─┼──▶ Producer.queueSocialPost()                   │
│   /api/mastodon/post ─┤                                                 │
│   /api/tumblr/post   ─┤                                                 │
│   /api/facebook/post ─┘                                                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
            (immediate)                     (scheduled)
                    │                               │
                    ▼                               ▼
    ┌───────────────────────────┐   ┌───────────────────────────────────┐
    │       POST_EXCHANGE       │   │    POST_DELAYED_EXCHANGE          │
    │         (topic)           │   │     (x-delayed-message)           │
    └─────────────┬─────────────┘   └────────────────┬──────────────────┘
                  │                                  │
                  │                           [Plugin holds message]
                  │                           [Delay expires]
                  │                                  │
                  └────────────────┬─────────────────┘
                                   │
                                   ▼
                     ┌───────────────────────────┐
                     │    hayon_social_posts     │
                     │      (main queue)         │
                     └─────────────┬─────────────┘
                                   │
                                   ▼
                     ┌───────────────────────────┐
                     │         WORKER            │
                     │   PostWorker.process()    │
                     └─────────────┬─────────────┘
                                   │
          ┌────────────────────────┼────────────────────────┐
       success                  failure                max retries
          │                        │                        │
          ▼                        ▼                        ▼
        ACK                  RETRY_QUEUE              PARKING_LOT
                             (exponential)            (dead forever)
```

### Your Exchanges

| Exchange | Type | Purpose |
|----------|------|---------|
| `post_exchange` | topic | Immediate posts |
| `post_delayed_exchange` | x-delayed-message | Scheduled posts |
| `dlx_exchange` | direct | Failed message handling |

### Your Queues

| Queue | Purpose |
|-------|---------|
| `hayon_social_posts` | Main processing queue |
| `hayon_retry_queue` | Failed messages waiting for retry |
| `hayon_parking_lot` | Permanently failed (max retries exceeded) |
| `hayon_dead_letters` | For inspection/debugging |

### File Structure

```
backend/src/
├── config/
│   └── rabbitmq.ts          # Connection setup
├── lib/queues/
│   ├── types.ts             # Constants, interfaces
│   ├── producer.ts          # Sends messages to queue
│   ├── dlx.setup.ts         # Retry/failure handling
│   └── ARCHITECTURE.md      # Architecture docs
├── workers/
│   ├── index.ts             # Worker startup, queue setup
│   └── post.worker.ts       # Message processing logic
└── services/posting/
    ├── index.ts             # Factory function
    ├── base.posting.service.ts  # Abstract base class
    ├── bluesky.posting.service.ts
    ├── threads.posting.service.ts
    └── ... (one per platform)
```

---

## 4. The Complete Posting Flow

### Step-by-Step Flow

#### Phase 1: User Initiates Post

```typescript
// Frontend: useCreatePost.ts
const handlePostNow = async () => {
  for (const platformId of selectedPlatforms) {
    await api.post(`/${platformId}/post`, {
      text: content.text,
      scheduledAt: scheduledAt  // Optional
    });
  }
};
```

#### Phase 2: Backend Receives Request (DB-First)

```typescript
// Backend: post.controller.ts
export const createPost = async (req: Request, res: Response) => {
  const { content, platformSpecificContent, selectedPlatforms, scheduledAt, timezone } = req.body;
  const userId = req.auth.id;

  // STEP 1: Create DB record FIRST
  const post = await postRepository.createPost({
    userId,
    content,
    platformSpecificContent,
    selectedPlatforms,
    scheduledAt,
    timezone,
    status: scheduledAt ? "SCHEDULED" : "PENDING"
  });

  // STEP 2: Queue ONE message per platform
  for (const platform of selectedPlatforms) {
    await Producer.queueSocialPost({
      postId: post._id,  // Real MongoDB ID
      userId,
      platform,
      scheduledAt
    });
  }

  return res.json({ postId: post._id });  // Return DB ID for status polling
};
```

#### Phase 3: Producer Queues Message

```typescript
// lib/queues/producer.ts
static async queueSocialPost(data) {
  const correlationId = uuidv4();
  const message = { ...data, timestamp: new Date(), correlationId };
  const routingKey = `post.create.${data.platform}`;  // e.g., "post.create.bluesky"

  // Calculate delay
  let delay = 0;
  if (data.scheduledAt) {
    delay = new Date(data.scheduledAt).getTime() - Date.now();
  }

  if (delay > 0) {
    // SCHEDULED: Use delayed exchange
    await this.publishDelayed(routingKey, message, delay);
  } else {
    // IMMEDIATE: Use regular exchange
    await this.publish(EXCHANGES.POST_EXCHANGE, routingKey, message);
  }

  return correlationId;
}
```

#### Phase 4: Message Sits in Queue

For **immediate posts**: Message goes directly to `hayon_social_posts` queue.

For **scheduled posts**: Plugin holds message internally. When delay expires, routes to queue.

#### Phase 5: Worker Consumes Message

```typescript
// workers/index.ts
channel.consume(QUEUES.SOCIAL_POSTS, async (msg) => {
  if (msg) {
    await PostWorker.processMessage(msg, channel);
  }
});
```

The `consume()` function:
- Registers a callback for incoming messages
- RabbitMQ calls this function whenever a message arrives
- Worker processes one message at a time (based on prefetch)

#### Phase 6: Worker Processes Message

```typescript
// workers/post.worker.ts
static async processMessage(msg: ConsumeMessage, channel: Channel) {
  const payload = JSON.parse(msg.content.toString());
  
  // Step 1: Check if cancelled in DB
  // Step 2: Validate credentials
  // Step 3: Get posting service
  // Step 4: Execute the post
  // Step 5: Update DB with result
  
  channel.ack(msg);  // Tell RabbitMQ we're done
}
```

#### Phase 7: Post to Platform

```typescript
// services/posting/bluesky.posting.service.ts
async createPost(payload, credentials, mediaBlobs) {
  const agent = new AtpAgent({ service: "https://bsky.social" });
  await agent.resumeSession(credentials.session);
  
  const { data } = await agent.post({
    $type: "app.bsky.feed.post",
    text: payload.content.text,
    createdAt: new Date().toISOString()
  });
  
  return {
    success: true,
    platformPostId: data.uri,
    platformPostUrl: `https://bsky.app/profile/${credentials.handle}/post/...`
  };
}
```

---

## 5. Code Deep Dive

### Understanding `channel.consume()`

```typescript
channel.consume(QUEUES.SOCIAL_POSTS, async (msg) => {
  // This is the callback function
  // Called EVERY TIME a message arrives in the queue
  
  if (msg) {  // msg can be null if consumer is cancelled
    await PostWorker.processMessage(msg, channel);
  }
});
```

**What's in `msg`?**

```typescript
msg.content         // Buffer containing your JSON message
msg.fields          // Routing info (exchange, routingKey, etc.)
msg.properties      // Headers, correlationId, etc.
```

### Understanding `channel.ack()`

```typescript
// ✅ CORRECT: ACK after successful processing
try {
  await processPost(payload);
  channel.ack(msg);  // "Done! Delete this message"
} catch (error) {
  // Handle failure...
}

// ❌ WRONG: Forgetting to ACK
// Message stays in queue forever
// Eventually causes memory issues
```

### Understanding Prefetch

```typescript
await channel.prefetch(1);
```

**What it means:** "Only give me 1 unacked message at a time."

| Prefetch | Behavior | Use Case |
|----------|----------|----------|
| `1` | Process one-by-one | Default, safe |
| `5` | Get 5 messages in advance | Higher throughput |
| `0` | Unlimited (dangerous!) | Never use |

### Dead Letter Exchange (DLX)

When a message fails:

```typescript
// dlx.setup.ts
export async function handleDeadLetter(options) {
  const retryCount = (headers["x-retry-count"] || 0) + 1;

  if (retryCount <= MAX_RETRIES) {
    // Retry with exponential backoff
    const delay = RETRY_DELAYS[retryCount - 1];  // 5s, 30s, 2min
    
    channel.publish(EXCHANGES.DLX_EXCHANGE, "retry", message, {
      expiration: delay.toString(),  // TTL for retry queue
      headers: { "x-retry-count": retryCount }
    });
  } else {
    // Max retries exceeded → park forever
    channel.publish(EXCHANGES.DLX_EXCHANGE, "parking", message);
  }
}
```

---

## 6. Platform Behaviors

Each platform has unique requirements:

| Platform | Auth Type | Media Upload | Character Limit | Special Notes |
|----------|-----------|--------------|-----------------|---------------|
| **Bluesky** | JWT Session | Blob API → embed | 300 | Facets for links/mentions |
| **Threads** | OAuth + Long Token | Container → publish | 500 | 2-step video process |
| **Instagram** | OAuth + Long Token | Container → publish | 2200 | Image required |
| **Facebook** | Page Token | Direct with URL | 63,206 | Uses Page, not user |
| **Mastodon** | OAuth Token | Upload → status | 500 | Instance-specific |
| **Tumblr** | OAuth 1.0a | NPF content | 4096 | Uses blog hostname |

### Bluesky Specifics

```typescript
// Session-based auth (JWT tokens expire every ~2 hours)
const agent = new AtpAgent({ service: "https://bsky.social" });
await agent.resumeSession(session);  // Resume from stored tokens

// Post structure
{
  $type: "app.bsky.feed.post",
  text: "Hello!",
  createdAt: new Date().toISOString(),
  facets: [...],  // For links, mentions, hashtags
  embed: {        // For images
    $type: "app.bsky.embed.images",
    images: [{ alt: "", image: blobRef }]
  }
}
```

### Meta Platforms (Threads/Instagram)

```typescript
// Long-lived token (~60 days)
// Image upload is 2-step for Instagram/Threads:

// Step 1: Create container (tells platform about the media)
const container = await createMediaContainer(imageUrl);

// Step 2: Wait for processing
await waitForReady(container.id);  // Poll until status = "FINISHED"

// Step 3: Publish
await publishContainer(container.id);
```

### Mastodon

```typescript
// Instance-specific (user picks their server)
const mastodon = new Mastodon({
  url: instanceUrl,  // e.g., "https://mastodon.social"
  accessToken
});

// Simple status post
await mastodon.statuses.create({ status: text });
```

---

## 7. S3 Media Handling

### Current S3 Service

```typescript
// services/s3/s3.service.ts
class S3Service {
  async uploadFile(key, fileBuffer, fileType) {
    await this.s3Client.send(new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: fileType
    }));
    
    return {
      location: `https://${bucketName}.s3.amazonaws.com/${key}`
    };
  }
}
```

### Media Upload Flow (To Implement)

```
Frontend                     Backend                      S3                Platform
   │                            │                         │                     │
   ├── Request upload URL ────▶│                         │                     │
   │                            ├── Generate presigned ─▶│                     │
   │◀── Return presigned URL ──┤                         │                     │
   │                            │                         │                     │
   ├── Upload file directly ──────────────────────────▶│                     │
   │                            │                         │                     │
   ├── Submit post ───────────▶│                         │                     │
   │                            ├── Queue message ───────▶│ (RabbitMQ)         │
   │                            │                         │                     │
   │                            │       [Worker picks up] │                     │
   │                            │                         │                     │
   │                            │◀── Download from S3 ───┤                     │
   │                            ├── Upload to platform ──────────────────────▶│
   │                            │                         │                     │
```

### S3 Key Structure

```
temp/{userId}/{uuid}.jpg      # Temporary uploads (auto-delete after 24h)
posts/{userId}/{postId}/1.jpg # Permanent storage after post created
```

---

## 8. Database Design

### SocialAccount Model

Each user has one `SocialAccount` document containing all platforms:

```typescript
{
  userId: ObjectId,
  
  bluesky: {
    connected: true,
    did: "did:plc:abc123",
    handle: "user.bsky.social",
    auth: {
      accessJwt: "eyJ...",
      refreshJwt: "eyJ..."
    },
    profile: {
      displayName: "John Doe",
      avatar: "https://..."
    },
    health: {
      status: "active",    // active | expired | revoked | error
      needsReconnection: false
    }
  },
  
  threads: { ... },
  mastodon: { ... },
  // etc.
}
```

### Post Model (Implemented)

```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  
  // 🌍 GLOBAL CONTENT (Default for all platforms)
  content: {
    text: "Check out my new project! 🚀 #marketing",
    mediaItems: [
      { s3Url: "https://bucket.s3.com/img1.jpg", mimeType: "image/jpeg" },
      { s3Url: "https://bucket.s3.com/img2.jpg", mimeType: "image/jpeg" }
    ]
  },
  
  // 🎯 PER-PLATFORM OVERRIDES (Custom captions/images per platform)
  platformSpecificContent: {
    "bluesky": { text: "Short 300 char version for Bluesky 🦋" },
    "tumblr": {
      text: "Aesthetic version for Tumblr #vaporwave",
      mediaItems: [{ s3Url: "https://bucket.s3.com/img1.jpg" }]  // Only 1 image
    }
  },
  
  selectedPlatforms: ["bluesky", "threads", "tumblr"],
  
  // 📊 PER-PLATFORM STATUS TRACKING
  platformStatuses: [
    { platform: "bluesky", status: "completed", platformPostUrl: "https://bsky.app/..." },
    { platform: "threads", status: "processing", attemptCount: 1 },
    { platform: "tumblr", status: "failed", error: "Rate limited", attemptCount: 3 }
  ],
  
  status: "PARTIAL_SUCCESS",  // PENDING | SCHEDULED | PROCESSING | COMPLETED | PARTIAL_SUCCESS | FAILED | CANCELLED
  
  // ⏰ SCHEDULING (Stored in UTC, display using timezone)
  scheduledAt: Date,          // Always stored in UTC
  timezone: "Asia/Kolkata",   // Original user timezone for display
  
  correlationId: "uuid-for-tracking",
  createdAt: Date,
  updatedAt: Date
}
```

---

## 9. What You Need to Implement

### High Priority

1. **Post Model & Repository**
   ```typescript
   // models/post.model.ts - Create the schema
   // repositories/post.repository.ts - CRUD operations
   ```

2. **Complete PostWorker**
   ```typescript
   // Uncomment and implement the TODO sections in post.worker.ts
   // - Check if cancelled
   // - Validate credentials
   // - Get posting service
   // - Execute & update DB
   // - Handle failures with DLX
   ```

3. **Implement Posting Services**
   ```typescript
   // Each platform service needs:
   // - validateContent()
   // - uploadMedia()
   // - createPost()
   ```

4. **Credential Fetching**
   ```typescript
   // services/posting/index.ts
   // Implement getCredentialsForPlatform()
   ```

### Medium Priority

5. **Pre-signed Upload URLs**
   ```typescript
   // Add getPresignedUploadUrl() to s3.service.ts
   ```

6. **Post Status Endpoints**
   ```typescript
   // GET /api/posts/:postId/status - For frontend polling
   ```

### Lower Priority

7. **Retry Handling** - Use DLX properly
8. **Notifications** - Notify user of success/failure
9. **Rate Limit Tracking** - Per-platform rate limits

---

## 10. Running & Testing

### Prerequisites

1. **RabbitMQ with Plugin**
   ```bash
   # Check if plugin is enabled
   rabbitmq-plugins list | grep delayed
   # Should show: [E*] rabbitmq_delayed_message_exchange
   
   # If not enabled:
   rabbitmq-plugins enable rabbitmq_delayed_message_exchange
   sudo systemctl restart rabbitmq-server
   ```

2. **Dashboard Access**
   - URL: http://localhost:15672
   - Default: guest / guest

### Running the Worker

```bash
# Terminal 1: Start backend
cd backend && pnpm run dev

# Terminal 2: Start worker
cd backend && npx ts-node src/workers/index.ts
```

### Testing the Flow

1. Connect a platform (e.g., Bluesky) via Settings
2. Go to Create Post
3. Enter text, select platforms
4. Click "Post Now"
5. Watch worker terminal for output:

```
📤 Published to post_exchange/post.create.bluesky
🚀 Post bluesky-1705678123456 queued for immediate processing
═══════════════════════════════════════════════════════════════
📨 MESSAGE RECEIVED FROM QUEUE
═══════════════════════════════════════════════════════════════
   Post ID:        bluesky-1705678123456
   Platform:       bluesky
   Content:        Hello world!...
═══════════════════════════════════════════════════════════════
🦋 [TEST] Would post to Bluesky
✅ Message processed successfully!
```

### Monitoring Queues

Open RabbitMQ Dashboard → Queues tab:
- **hayon_social_posts**: Messages waiting/being processed
- **hayon_retry_queue**: Failed messages waiting for retry
- **hayon_parking_lot**: Permanently failed messages

---

## Quick Reference

### Key Functions

| Function | Location | Purpose |
|----------|----------|---------|
| `Producer.queueSocialPost()` | producer.ts | Queue a post message |
| `PostWorker.processMessage()` | post.worker.ts | Process queue message |
| `getPostingService()` | posting/index.ts | Get platform-specific service |
| `handleDeadLetter()` | dlx.setup.ts | Handle failed messages |

### Message Structure

```typescript
{
  postId: "bluesky-1705678123456",
  userId: "user-mongo-id",
  platform: "bluesky",
  content: {
    text: "Hello world!",
    mediaUrls: ["https://s3..."]
  },
  scheduledAt: "2024-01-20T10:00:00Z",  // Optional
  timestamp: "2024-01-19T14:30:00Z",
  correlationId: "uuid-for-tracking"
}
```

---

**You now have the complete knowledge to build and extend this system!** 🚀
