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
