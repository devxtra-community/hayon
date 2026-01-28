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
