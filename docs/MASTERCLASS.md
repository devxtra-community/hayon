# Social Media Posting Masterclass - Index

A comprehensive technical guide to Hayon's social media posting architecture.

## Table of Contents

### [Part 1: Overview & User Flow](./MASTERCLASS_PART1.md)
- **Chapter 1**: System Overview - Architecture diagram
- **Chapter 2**: User Journey - Step-by-step from UI to backend
- **Chapter 3**: Backend Flow - Controller, validation, DB, queue

### [Part 2: RabbitMQ Deep Dive](./MASTERCLASS_PART2.md)
- **Chapter 4**: Core Concepts - Exchange, queue, binding, routing
- **Chapter 5**: Scheduling - TTL approach vs Delayed Plugin comparison
- **Chapter 6**: Worker Processing - Startup, message flow, status machine

### [Part 3: DLX, S3 & Platforms](./MASTERCLASS_PART3.md)
- **Chapter 7**: Dead Letter Exchange - Retry logic, exponential backoff
- **Chapter 8**: S3 Deep Dive - Current vs presigned URLs, bucket config
- **Chapter 9**: Platform APIs - Bluesky, Instagram, Mastodon specifics
- **Chapter 10**: Edge Cases - Cancellation, tokens, rate limits

---

## Quick Reference

### Key Files by Layer

| Layer | Files |
|-------|-------|
| Frontend | `useCreatePost.ts`, `CreatePostForm.tsx` |
| Routes | `post.routes.ts` |
| Controller | `post.controller.ts` |
| Repository | `post.repository.ts` |
| Queue | `producer.ts`, `types.ts`, `dlx.setup.ts` |
| Worker | `workers/index.ts`, `post.worker.ts` |
| Services | `services/posting/*.ts` |
| S3 | `s3.service.ts`, `s3.upload.ts` |

### Post Lifecycle

```
Draft → Pending/Scheduled → Processing → Completed/Partial/Failed
                  ↓
              Cancelled (user action)
```

### TTL vs Plugin (Quick)

| Aspect | TTL Approach | Plugin Approach |
|--------|--------------|-----------------|
| Setup | Native | Requires plugin |
| Head-of-line blocking | ❌ Yes | ✅ No |
| Cancel scheduled | ❌ Hard | ❌ Hard |
| Best for | Low volume | High volume |

### Platform Requirements

| Platform | Needs Image | Char Limit | Media Upload |
|----------|-------------|------------|--------------|
| Bluesky | No | 300 | `uploadBlob` |
| Instagram | **Yes** | 2200 | Public URL |
| Threads | No | 500 | Public URL |
| Facebook | No | 63206 | Public URL |
| Mastodon | No | 500 | `POST /api/v2/media` |
| Tumblr | No | 4096 | URL or base64 |

# Social Media Posting Masterclass - Part 1: Overview & User Flow

## Chapter 1: System Overview

### 1.1 The Big Picture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          HAYON POSTING SYSTEM                            │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────────────┐ │
│  │ Frontend│ ───▶ │ Backend │ ───▶ │RabbitMQ │ ───▶ │ Worker Process  │ │
│  │ Next.js │      │ Express │      │  Queue  │      │ (Separate Node) │ │
│  └─────────┘      └─────────┘      └─────────┘      └─────────────────┘ │
│       │               │                                     │           │
│       │               ▼                                     ▼           │
│       │          ┌─────────┐                          ┌──────────┐      │
│       │          │ MongoDB │ ◀────────────────────────│ Platform │      │
│       │          │  (Post) │                          │   APIs   │      │
│       │          └─────────┘                          └──────────┘      │
│       │               │                                                  │
│       │               ▼                                                  │
│       │          ┌─────────┐                                            │
│       └────────▶ │   S3    │                                            │
│                  │ (Media) │                                            │
│                  └─────────┘                                            │
└──────────────────────────────────────────────────────────────────────────┘
```

**Key Components:**
1. **Frontend (Next.js)**: User interface for creating posts
2. **Backend (Express)**: REST API, validation, queue publishing
3. **RabbitMQ**: Message broker for async processing
4. **Worker**: Separate Node.js process consuming queue
5. **MongoDB**: Stores post data and status
6. **S3**: Stores media files (images/videos)
7. **Platform APIs**: Bluesky, Instagram, Facebook, Threads, Mastodon, Tumblr

---

## Chapter 2: User Journey (Step by Step)

### 2.1 User Opens Create Post Page

```
User Action: Navigates to /create-post

What Happens:
1. CreatePostForm.tsx renders
2. useCreatePost hook initializes
3. API call: GET /api/auth/me → get user info
4. API call: GET /api/platform/find → get connected platforms
5. State populated: availablePlatforms = [{ id: "bluesky", connected: true }, ...]
6. UI shows connected platforms with checkmarks
```

**Frontend State at this point:**
```typescript
{
  postText: "",
  mediaFiles: [],
  selectedPlatforms: ["bluesky", "facebook"],  // All connected selected by default
  platformPosts: {},  // Empty until Generate
  scheduleDate: "",
  scheduleTime: ""
}
```

### 2.2 User Writes Content

```
User Action: Types in textarea "Check out my new project! 🚀"

What Happens:
1. setPostText("Check out my new project! 🚀")
2. Character counter updates
3. Platform constraint indicators update (dots turn red if over limit)
4. No API calls yet - all client-side
```

**Validation happening:**
- Bluesky: 300 chars max → ✅ OK
- Instagram: 2200 chars max → ✅ OK
- Threads: 500 chars max → ✅ OK

### 2.3 User Uploads Media

```
User Action: Selects 2 images from file picker

CURRENT IMPLEMENTATION (needs change):
1. Files stored in React state as File objects
2. Blob URLs created for preview

CORRECT IMPLEMENTATION:
1. For each file → call POST /api/posts/media/upload
2. Backend generates presigned S3 URL
3. Frontend uploads directly to S3
4. S3 URL stored in state (not File object)
```

**S3 Upload Flow (detailed in S3 chapter):**
```
Frontend                    Backend                      S3
   │                           │                          │
   ├── POST /media/upload ────▶│                          │
   │   {filename, mimeType}    │                          │
   │                           ├── Generate presigned ───▶│
   │                           │   PUT URL                │
   │◀── {uploadUrl, s3Url} ────┤                          │
   │                           │                          │
   ├── PUT uploadUrl ─────────────────────────────────────▶│
   │   [file bytes]            │                          │
   │◀── 200 OK ────────────────────────────────────────────┤
   │                           │                          │
   │  Store s3Url in state     │                          │
```

### 2.4 User Clicks "Generate Previews"

```
User Action: Clicks button to preview posts

What Happens:
1. validatePost() runs - checks all platform constraints
2. platformPosts state populated with copies:
   {
     bluesky: { text: "Check out...", mediaUrls: [...] },
     facebook: { text: "Check out...", mediaUrls: [...] }
   }
3. View switches from "create" to "preview"
4. PostPreview.tsx renders platform-specific previews
```

### 2.5 User Customizes Per-Platform (Optional)

```
User Action: Edits Bluesky text to be shorter (under 300 chars)

What Happens:
1. EditPlatformPostModal opens
2. User trims text for Bluesky only
3. updatePlatformPost("bluesky", { text: "shorter version" })
4. platformPosts.bluesky now differs from platformPosts.facebook
```

This is the **platformSpecificContent** feature - allows different captions per platform.

### 2.6 User Posts Immediately

```
User Action: Clicks "Post Now"

What Happens:
1. setIsSubmitting(true) - loading state
2. Prepare payload:
   {
     text: "Check out my new project! 🚀",
     mediaUrls: ["https://s3.../temp/user123/abc.jpg"],
     selectedPlatforms: ["bluesky", "facebook"],
     timezone: "Asia/Kolkata",
     platformSpecificContent: {
       bluesky: { text: "shorter version" }
     }
   }
3. POST /api/posts → Backend controller
4. Frontend starts polling GET /api/posts/:id/status
5. Shows progress per platform
6. On completion → success message + links to posts
```

### 2.7 User Schedules Post (Alternative Flow)

```
User Action: Clicks "Schedule" → Picks date/time → Confirms

What Happens:
Same as above, but payload includes:
{
  ...
  scheduledAt: "2024-12-25T10:00:00.000Z"
}

Backend:
- Creates Post with status: "SCHEDULED"
- Publishes to WAITING_ROOM queue with TTL
- Message waits until scheduled time
```

---

## Chapter 3: Developer View - Backend Flow

### 3.1 Request Arrives at Controller

**File: `src/controllers/post.controller.ts`**

```typescript
// POST /api/posts
export const createPost = async (req: Request, res: Response) => {
  // STEP 1: Extract user ID from JWT (set by authenticateToken middleware)
  const userId = req.auth.id;
  
  // STEP 2: Extract body
  const { text, mediaUrls, selectedPlatforms, scheduledAt, timezone, platformSpecificContent } = req.body;
```

### 3.2 Validation Chain

```
Validation Order:
1. Auth middleware → userId exists
2. Request body validation (Zod schema)
3. Platform validation → user has connected these platforms
4. Content validation → within platform limits
```

**Platform Validation (Critical!):**
```typescript
// Check each selected platform is connected
const socialAccount = await findPlatformAccountByUserId(userId);

for (const platform of selectedPlatforms) {
  if (!socialAccount[platform]?.connected) {
    throw new Error(`${platform} is not connected`);
  }
  if (socialAccount[platform]?.health?.status !== "active") {
    throw new Error(`${platform} needs reconnection`);
  }
}
```

### 3.3 Create Post Document

**File: `src/repositories/post.repository.ts`**

```typescript
const post = await PostModel.create({
  userId,
  content: { text, mediaItems: mediaUrls.map(url => ({ s3Url: url })) },
  platformSpecificContent,
  selectedPlatforms,
  status: scheduledAt ? "SCHEDULED" : "PENDING",
  scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
  timezone,
  platformStatuses: selectedPlatforms.map(platform => ({
    platform,
    status: "pending",
    attemptCount: 0
  }))
});
```

**Database document created:**
```json
{
  "_id": "post_123",
  "userId": "user_456",
  "content": {
    "text": "Check out my new project! 🚀",
    "mediaItems": [{ "s3Url": "https://s3.../abc.jpg" }]
  },
  "platformSpecificContent": {
    "bluesky": { "text": "shorter version" }
  },
  "selectedPlatforms": ["bluesky", "facebook"],
  "status": "PENDING",
  "platformStatuses": [
    { "platform": "bluesky", "status": "pending", "attemptCount": 0 },
    { "platform": "facebook", "status": "pending", "attemptCount": 0 }
  ],
  "createdAt": "2024-01-19T10:00:00Z"
}
```

### 3.4 Publish to RabbitMQ

**CRITICAL CONCEPT: One message PER PLATFORM**

```typescript
// Loop through selected platforms
for (const platform of selectedPlatforms) {
  const content = platformSpecificContent?.[platform] || post.content;
  
  await Producer.queueSocialPost({
    postId: post._id.toString(),
    userId,
    platform,  // "bluesky" or "facebook"
    content: {
      text: content.text,
      mediaUrls: content.mediaItems?.map(m => m.s3Url)
    },
    scheduledAt: post.scheduledAt
  });
}
```

**Why separate messages?**
- Each platform processes independently
- If Facebook fails, Bluesky still succeeds
- Retry logic per platform
- Different processing times (video transcoding)

### 3.5 Producer Logic

**File: `src/lib/queues/producer.ts`**

```typescript
static async queueSocialPost(data) {
  // Calculate delay if scheduled
  let delay = 0;
  if (data.scheduledAt) {
    delay = new Date(data.scheduledAt).getTime() - Date.now();
    if (delay < 0) delay = 0;  // Past time = immediate
  }

  if (delay > 0) {
    // SCHEDULED: Send to waiting room
    await channel.sendToQueue(QUEUES.WAITING_ROOM, buffer, {
      expiration: delay.toString(),  // TTL in milliseconds
      persistent: true
    });
  } else {
    // IMMEDIATE: Send directly to exchange
    await this.publish(EXCHANGES.POST_EXCHANGE, `post.create.${platform}`, message);
  }
}
```

---

*Continued in Part 2...*

# Social Media Posting Masterclass - Part 2: RabbitMQ Deep Dive

## Chapter 4: RabbitMQ Architecture

### 4.1 Core Concepts

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         RABBITMQ TERMINOLOGY                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PRODUCER: Code that sends messages (your backend controller)          │
│  CONSUMER: Code that receives messages (your worker process)           │
│  EXCHANGE: Router that decides where messages go                        │
│  QUEUE: Buffer that holds messages waiting to be processed              │
│  BINDING: Rule connecting exchange to queue (with routing key)          │
│  ROUTING KEY: Label on message used by exchange for routing             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Your Exchange Setup

**File: `src/lib/queues/types.ts`**

```typescript
export const EXCHANGES = {
  POST_EXCHANGE: "post_exchange",          // Main exchange for all post messages
  POST_DELAYED_EXCHANGE: "post_delayed_exchange",  // For delayed plugin (optional)
};

export const QUEUES = {
  SOCIAL_POSTS: "hayon_social_posts",      // Main processing queue
  WAITING_ROOM: "hayon_waiting_room",      // For scheduled posts (TTL-based)
};
```

**Exchange Type: TOPIC**

Topic exchanges route messages based on pattern matching:
- `post.create.bluesky` → matches `post.create.*`
- `post.create.facebook` → matches `post.create.*`
- `post.create.*` → catches ALL platforms

```
                           post_exchange (topic)
                                  │
                ┌─────────────────┼─────────────────┐
                │                 │                 │
           post.create.*     post.create.*     post.create.*
                │                 │                 │
                ▼                 ▼                 ▼
    ┌───────────────────────────────────────────────────────┐
    │              hayon_social_posts (queue)               │
    │  [msg1: bluesky] [msg2: facebook] [msg3: bluesky]    │
    └───────────────────────────────────────────────────────┘
```

### 4.3 Message Flow - Immediate Post

```
┌────────────────────────────────────────────────────────────────────────┐
│ IMMEDIATE POST FLOW                                                    │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  1. Backend publishes:                                                 │
│     channel.publish("post_exchange", "post.create.bluesky", message)   │
│                                                                        │
│  2. Exchange routes:                                                   │
│     post_exchange receives message with key "post.create.bluesky"      │
│     Matches binding pattern "post.create.*"                            │
│     Routes to hayon_social_posts queue                                 │
│                                                                        │
│  3. Queue stores:                                                      │
│     Message added to end of hayon_social_posts                         │
│     Persisted to disk (persistent: true)                               │
│                                                                        │
│  4. Worker consumes:                                                   │
│     channel.consume pulls one message                                  │
│     Worker processes (posts to Bluesky API)                            │
│     Worker ACKs on success                                             │
│                                                                        │
│  5. Queue removes:                                                     │
│     On ACK, message deleted from queue                                 │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Chapter 5: Scheduling - TTL vs Plugin

### 5.1 YOUR CURRENT APPROACH: TTL + Dead Letter

**How it works:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     TTL-BASED SCHEDULING                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                    Message with TTL=3600000 (1 hour)                    │
│                              │                                          │
│                              ▼                                          │
│            ┌──────────────────────────────────┐                        │
│            │     WAITING_ROOM Queue           │                        │
│            │  x-dead-letter-exchange: post_ex │ ◀─── Queue Config      │
│            │  x-dead-letter-routing-key: ...  │                        │
│            └──────────────────────────────────┘                        │
│                              │                                          │
│                       [Wait 1 hour]                                     │
│                       [TTL expires]                                     │
│                              │                                          │
│                              ▼                                          │
│                     Message "dies"                                      │
│                              │                                          │
│                              ▼                                          │
│            ┌──────────────────────────────────┐                        │
│            │       post_exchange              │                        │
│            │   (dead letter exchange)         │                        │
│            └──────────────────────────────────┘                        │
│                              │                                          │
│                   Routes normally                                       │
│                              │                                          │
│                              ▼                                          │
│            ┌──────────────────────────────────┐                        │
│            │     SOCIAL_POSTS Queue           │                        │
│            │   (ready for processing)         │                        │
│            └──────────────────────────────────┘                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Your Code (`producer.ts`):**
```typescript
// Setup waiting room with dead letter config
await channel.assertQueue(QUEUES.WAITING_ROOM, {
  durable: true,
  arguments: {
    "x-dead-letter-exchange": EXCHANGES.POST_EXCHANGE,
    "x-dead-letter-routing-key": `post.create.${data.platform}`,
  },
});

// Send with TTL (expiration)
channel.sendToQueue(QUEUES.WAITING_ROOM, buffer, {
  expiration: delay.toString(),  // Milliseconds until message expires
  persistent: true,
});
```

**PROS of TTL Approach:**
- ✅ No plugins needed - native RabbitMQ
- ✅ Simple to understand
- ✅ Works with any RabbitMQ installation

**CONS of TTL Approach:**
- ❌ **Head-of-line blocking**: If first message has TTL=1 hour, shorter TTL messages behind it WAIT
- ❌ Cannot easily cancel scheduled messages
- ❌ All messages must traverse waiting room

### 5.2 ALTERNATIVE: Delayed Message Exchange Plugin

**How it works:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DELAYED MESSAGE PLUGIN                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│     Message with header: x-delay=3600000                                │
│                              │                                          │
│                              ▼                                          │
│            ┌──────────────────────────────────┐                        │
│            │   post_delayed_exchange          │                        │
│            │   type: x-delayed-message        │ ◀─── Special type      │
│            │   (plugin handles delay)         │                        │
│            └──────────────────────────────────┘                        │
│                              │                                          │
│                       [Plugin waits]                                    │
│                       [1 hour passes]                                   │
│                              │                                          │
│                              ▼                                          │
│                     Message released                                    │
│                              │                                          │
│                              ▼                                          │
│            ┌──────────────────────────────────┐                        │
│            │     SOCIAL_POSTS Queue           │                        │
│            └──────────────────────────────────┘                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Code with Plugin:**
```typescript
// Setup delayed exchange
await channel.assertExchange(EXCHANGES.POST_DELAYED_EXCHANGE, "x-delayed-message", {
  durable: true,
  arguments: { "x-delayed-type": "topic" }
});

// Publish with delay header
channel.publish(EXCHANGES.POST_DELAYED_EXCHANGE, routingKey, buffer, {
  headers: { "x-delay": delayMs },
  persistent: true,
});
```

**PROS of Plugin Approach:**
- ✅ No head-of-line blocking
- ✅ Cleaner code
- ✅ Better for many scheduled messages

**CONS of Plugin Approach:**
- ❌ Requires plugin installation
- ❌ Not available on all managed RabbitMQ services
- ❌ Plugin stores delays in Mnesia (memory overhead)

**RECOMMENDATION:**
- For your current scale → TTL approach is fine
- If scheduling many posts (1000+/day) → consider plugin

---

## Chapter 6: Worker Processing

### 6.1 Worker Startup

**File: `src/workers/index.ts`**

```typescript
async function startWorker() {
  // 1. Connect to RabbitMQ
  await connectRabbitMQ();
  const channel = getChannel();

  // 2. Setup infrastructure
  await channel.assertExchange(POST_EXCHANGE, "topic", { durable: true });
  await channel.assertQueue(SOCIAL_POSTS, {
    durable: true,
    deadLetterExchange: "dlx_exchange",  // Failed messages go here
  });
  
  // 3. Bind queue to exchange
  await channel.bindQueue(SOCIAL_POSTS, POST_EXCHANGE, "post.create.*");

  // 4. Set prefetch (one at a time)
  await channel.prefetch(1);

  // 5. Start consuming
  channel.consume(SOCIAL_POSTS, async (msg) => {
    await PostWorker.processMessage(msg, channel);
  });
}
```

**Why prefetch(1)?**
- Ensures fair distribution across multiple workers
- If worker crashes, only one message lost
- Can increase for throughput (prefetch 5-10)

### 6.2 Message Processing Flow

**File: `src/workers/post.worker.ts`**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    WORKER PROCESS MESSAGE                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. PARSE MESSAGE                                                       │
│     const payload = JSON.parse(msg.content.toString());                 │
│     // { postId, userId, platform, content }                            │
│                                                                         │
│  2. CHECK CANCELLATION                                                  │
│     const post = await findById(payload.postId);                        │
│     if (post.status === "CANCELLED") {                                  │
│       channel.ack(msg);  // Remove from queue                           │
│       return;            // Skip processing                             │
│     }                                                                   │
│                                                                         │
│  3. VALIDATE CREDENTIALS                                                │
│     const creds = await getCredentialsForPlatform(userId, platform);    │
│     if (!creds || expired) {                                            │
│       updatePlatformStatus(postId, platform, { status: "failed" });     │
│       channel.ack(msg);                                                 │
│       return;                                                           │
│     }                                                                   │
│                                                                         │
│  4. UPDATE STATUS TO PROCESSING                                         │
│     updatePlatformStatus(postId, platform, { status: "processing" });   │
│                                                                         │
│  5. GET PLATFORM SERVICE                                                │
│     const service = getPostingService(platform);                        │
│     // Returns BlueskyPostingService, FacebookPostingService, etc.      │
│                                                                         │
│  6. EXECUTE POST                                                        │
│     const result = await service.execute(payload, creds);               │
│     // Calls platform API, uploads media, creates post                  │
│                                                                         │
│  7. UPDATE DATABASE                                                     │
│     if (result.success) {                                               │
│       updatePlatformStatus(postId, platform, {                          │
│         status: "completed",                                            │
│         platformPostId: result.platformPostId,                          │
│         platformPostUrl: result.platformPostUrl                         │
│       });                                                               │
│     } else {                                                            │
│       updatePlatformStatus(postId, platform, {                          │
│         status: "failed",                                               │
│         error: result.error                                             │
│       });                                                               │
│     }                                                                   │
│                                                                         │
│  8. ACKNOWLEDGE MESSAGE                                                 │
│     channel.ack(msg);  // Success - remove from queue                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.3 Post Status State Machine

```
                              ┌───────────┐
                              │   DRAFT   │
                              └─────┬─────┘
                                    │ (user submits)
                    ┌───────────────┴───────────────┐
                    │                               │
               (immediate)                    (scheduled)
                    │                               │
                    ▼                               ▼
              ┌─────────┐                    ┌───────────┐
              │ PENDING │                    │ SCHEDULED │
              └────┬────┘                    └─────┬─────┘
                   │                               │
                   │ (TTL expires / time reached)  │
                   │◀──────────────────────────────┘
                   │
                   │ (worker picks up)
                   ▼
            ┌────────────┐
            │ PROCESSING │
            └──────┬─────┘
                   │
     ┌─────────────┼─────────────┐
     │             │             │
   (all OK)    (partial)    (all fail)
     │             │             │
     ▼             ▼             ▼
┌─────────┐ ┌─────────────┐ ┌────────┐
│COMPLETED│ │PARTIAL_SUCCS│ │ FAILED │
└─────────┘ └─────────────┘ └────────┘
```

---

*Continued in Part 3...*
# Social Media Posting Masterclass - Part 3: DLX, S3 & Platform APIs

## Chapter 7: Dead Letter Exchange (DLX) & Retry Logic

### 7.1 Why DLX?

When message processing fails, you have three options:
1. **Discard** → Message lost forever ❌
2. **Requeue** → Infinite loop if message is bad ❌
3. **Dead Letter** → Route to special handling ✅

**Your DLX Setup:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│                          DLX FLOW                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Worker fails ──▶ handleDeadLetter() ──▶ Check retry count             │
│                                               │                         │
│                          ┌────────────────────┼────────────────────┐    │
│                          │                    │                    │    │
│                     (count < 3)          (count >= 3)              │    │
│                          │                    │                    │    │
│                          ▼                    ▼                    │    │
│              ┌──────────────────┐   ┌──────────────────┐          │    │
│              │   Retry Queue    │   │   Parking Lot    │          │    │
│              │  (with new TTL)  │   │  (dead forever)  │          │    │
│              └────────┬─────────┘   └──────────────────┘          │    │
│                       │                                            │    │
│                [TTL: 5s, 30s, 2min]                                │    │
│                [exponential backoff]                               │    │
│                       │                                            │    │
│                       ▼                                            │    │
│                  Back to POST_EXCHANGE                             │    │
│                  (retry processing)                                │    │
│                                                                    │    │
└────────────────────────────────────────────────────────────────────┘    │
```

### 7.2 Exponential Backoff

**File: `src/lib/queues/dlx.setup.ts`**

```typescript
export const DLX = {
  RETRY_DELAYS: [5000, 30000, 120000]  // 5s, 30s, 2min
};

// Retry 1: Wait 5 seconds  → Try again
// Retry 2: Wait 30 seconds → Try again
// Retry 3: Wait 2 minutes  → Try again
// Retry 4: → PARKING LOT (give up)
```

**Why exponential backoff?**
- Transient errors (network blip) → quick retry works
- Longer errors (rate limit) → need more time
- Gives platform APIs time to recover

---

## Chapter 8: S3 Deep Dive

### 8.1 Your Current S3 Service

**File: `src/services/s3/s3.service.ts`**

```typescript
class S3Service {
  async uploadFile(key: string, fileBuffer: Buffer, fileType: string) {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: fileType,
    });
    await this.s3Client.send(command);
    return {
      location: `https://${this.bucketName}.s3.amazonaws.com/${key}`
    };
  }
}
```

**How this works:**
1. Backend receives file from frontend (multipart)
2. Backend uploads file buffer to S3
3. Returns S3 URL to store in database

**Problems with this approach:**
- ❌ Large files timeout (backend is middleman)
- ❌ Memory pressure on backend server
- ❌ Double bandwidth (frontend→backend→S3)

### 8.2 Better Approach: Presigned URLs

**File: `src/services/s3/s3.upload.ts` (new)**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     PRESIGNED URL FLOW                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Frontend                     Backend                     S3            │
│     │                            │                        │             │
│     ├── POST /media/upload ─────▶│                        │             │
│     │   { filename, type }       │                        │             │
│     │                            ├── Generate PUT URL ───▶│             │
│     │                            │   (signed, expires 15m)│             │
│     │◀── { uploadUrl, s3Url } ───┤                        │             │
│     │                            │                        │             │
│     ├── PUT uploadUrl ───────────────────────────────────▶│             │
│     │   [raw file bytes]         │                        │             │
│     │◀── 200 OK ──────────────────────────────────────────┤             │
│     │                            │                        │             │
│     │   (file now in S3)         │                        │             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Presigned URL Code:**
```typescript
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

async function getPresignedUploadUrl(userId: string, filename: string) {
  const key = `temp/${userId}/${uuid()}.${ext}`;
  
  const command = new PutObjectCommand({
    Bucket: ENV.AWS.S3_BUCKET_NAME,
    Key: key,
    ContentType: mimeType,
  });
  
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
  const s3Url = `https://${bucket}.s3.amazonaws.com/${key}`;
  
  return { uploadUrl, s3Url, key };
}
```

### 8.3 S3 Bucket Configuration

**Required Settings:**

```json
// CORS Configuration (for browser uploads)
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://hayon.site", "https://dev.hayon.site"],
      "AllowedMethods": ["PUT", "GET"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}

// Lifecycle Rule (cleanup temp files)
{
  "Rules": [
    {
      "ID": "DeleteTempFiles",
      "Filter": { "Prefix": "temp/" },
      "Status": "Enabled",
      "Expiration": { "Days": 1 }
    }
  ]
}
```

### 8.4 S3 Key Structure

```
hayon-media-bucket/
├── temp/                    # Temporary uploads (auto-delete 24h)
│   └── {userId}/
│       └── {uuid}.jpg
│
└── posts/                   # Permanent storage
    └── {userId}/
        └── {postId}/
            └── {uuid}.jpg
```

**When post is created:**
1. Move files: `temp/{userId}/abc.jpg` → `posts/{userId}/{postId}/abc.jpg`
2. Update URLs in database
3. temp files auto-delete via lifecycle

---

## Chapter 9: Platform API Specifics

### 9.1 Bluesky (AT Protocol)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  BLUESKY POSTING FLOW                                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. Resume session with stored credentials                              │
│     agent.resumeSession({ did, accessJwt, refreshJwt })                 │
│                                                                         │
│  2. Upload media (if any)                                               │
│     const { data } = await agent.uploadBlob(buffer, { encoding: mime }) │
│     Returns: BlobRef object (NOT a URL!)                                │
│                                                                         │
│  3. Create post record                                                  │
│     await agent.post({                                                  │
│       text: "Hello world",                                              │
│       embed: {                                                          │
│         $type: "app.bsky.embed.images",                                 │
│         images: [{ image: blobRef, alt: "" }]                           │
│       },                                                                │
│       facets: [...]  // Rich text (links, mentions, hashtags)           │
│     });                                                                 │
│                                                                         │
│  Limits: 300 chars, 4 images, no videos yet                             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Instagram (Graph API)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  INSTAGRAM POSTING FLOW (2-step container process)                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  SINGLE IMAGE:                                                          │
│  1. Create container                                                    │
│     POST /{ig-user-id}/media?image_url=https://...&caption=...          │
│     Returns: { id: "container_id" }                                     │
│                                                                         │
│  2. Publish container                                                   │
│     POST /{ig-user-id}/media_publish?creation_id=container_id           │
│     Returns: { id: "media_id" }                                         │
│                                                                         │
│  CAROUSEL (multiple images):                                            │
│  1. Create container for EACH image (is_carousel_item=true)             │
│  2. Create carousel container (children=[id1, id2...])                  │
│  3. Publish carousel container                                          │
│                                                                         │
│  ⚠️ CRITICAL: image_url MUST be publicly accessible!                    │
│  ⚠️ S3 must be public OR use long-lived presigned URL                   │
│                                                                         │
│  Limits: 2200 chars, 10 images, requires at least 1 image               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 9.3 Mastodon (Federated)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  MASTODON POSTING                                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ⚠️ Each user is on different INSTANCE (server)!                        │
│  API endpoint varies: {instanceUrl}/api/v1/...                          │
│                                                                         │
│  1. Upload media (required before status)                               │
│     POST {instanceUrl}/api/v2/media                                     │
│     Body: multipart/form-data with file                                 │
│     Returns: { id: "media_id" }                                         │
│                                                                         │
│  2. Create status                                                       │
│     POST {instanceUrl}/api/v1/statuses                                  │
│     Body: { status: "text", media_ids: ["id1"], visibility: "public" }  │
│     Returns: { id: "status_id", url: "https://instance/..." }           │
│                                                                         │
│  Limits: 500 chars (configurable per instance), 4 media                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Chapter 10: Edge Cases & Solutions

### 10.1 Race Condition: Cancellation

**Problem:**
```
T0: User submits post → message in queue
T1: User cancels post → DB status = CANCELLED
T2: Worker picks up message → should it post?
```

**Solution:**
```typescript
// In worker, FIRST thing after parsing message:
const post = await findById(payload.postId);
if (post.status === "CANCELLED") {
  channel.ack(msg);  // Remove from queue
  return;            // Don't process
}
```

### 10.2 Token Expiry Mid-Processing

**Problem:** Access token expires while worker is processing

**Solution:**
```typescript
try {
  await service.execute(payload, credentials);
} catch (error) {
  if (error.status === 401) {
    // Try refresh
    const newCreds = await refreshToken(platform, userId);
    if (newCreds) {
      await service.execute(payload, newCreds);
    } else {
      // Mark account as needing reconnection
      await markForReconnection(userId, platform);
    }
  }
}
```

### 10.3 Partial Success

**Problem:** Bluesky succeeds, Facebook fails

**Solution:** Track per-platform status
```typescript
// After each platform completes:
await updatePlatformStatus(postId, platform, {
  status: result.success ? "completed" : "failed"
});

// Recalculate overall:
const statuses = post.platformStatuses.map(p => p.status);
if (statuses.every(s => s === "completed")) post.status = "COMPLETED";
else if (statuses.some(s => s === "completed")) post.status = "PARTIAL_SUCCESS";
else post.status = "FAILED";
```

### 10.4 Duplicate Messages

**Problem:** RabbitMQ redelivers if ACK times out

**Solution:** Check before processing
```typescript
const platformStatus = post.platformStatuses.find(p => p.platform === platform);
if (platformStatus.status === "completed") {
  console.log("Already processed, skipping duplicate");
  channel.ack(msg);
  return;
}
```

### 10.5 Rate Limiting

**Problem:** Platform returns 429 Too Many Requests

**Solution:** Use result.rateLimited in service
```typescript
if (result.rateLimited) {
  // Throw to trigger DLX retry with backoff
  throw new Error(`Rate limited, retry after ${result.retryAfter}s`);
}
```

---

## Quick Reference Tables

### Status Values

| Post Status | Meaning |
|-------------|---------|
| DRAFT | Saved, not submitted |
| PENDING | Submitted for immediate |
| SCHEDULED | Submitted for future |
| PROCESSING | Worker active |
| COMPLETED | All platforms done |
| PARTIAL_SUCCESS | Some succeeded |
| FAILED | All failed |
| CANCELLED | User cancelled |

### Platform Limits

| Platform | Chars | Images | Requires Image |
|----------|-------|--------|----------------|
| Bluesky | 300 | 4 | No |
| Instagram | 2200 | 10 | **Yes** |
| Threads | 500 | 20 | No |
| Facebook | 63206 | 10 | No |
| Mastodon | 500* | 4 | No |
| Tumblr | 4096 | 10 | No |

*Mastodon limit varies by instance

---

*End of Masterclass*
