# Hayon Social Posting - Implementation TODO & Learning Path

A step-by-step study guide for completing the social posting system.

---

## Phase 1: Database Foundation

### TODO 1.1: Implement Post Model
**File:** `backend/src/models/post.model.ts`
**What to do:**
- Uncomment the schema skeleton in the file.
- Define `mediaItemSchema`, `platformPostStatusSchema`, and `postSchema`.
- Add compound indexes for performance.
- Implement pre-save hook to auto-populate `platformStatuses` based on `selectedPlatforms`.

**Topics to learn:**
- Mongoose Schema Types (`ObjectId`, `Map`, `Mixed`)
- Mongoose Indexes and Compound Indexes
- Mongoose Pre/Post Hooks (Middleware)

**Flow:** Frontend sends post data → Controller calls `PostModel.create()` → Hook auto-generates status array → Document saved.

---

### TODO 1.2: Implement Post Repository
**File:** `backend/src/repositories/post.repository.ts`
**What to do:**
- `createPost(userId, content, platforms, scheduledAt)` → Returns `postId`.
- `findById(postId)` → Returns full document.
- `updatePlatformStatus(postId, platform, statusData)` → Updates one item in the `platformStatuses` array.
- `updateOverallStatus(postId)` → Calculates and sets `COMPLETED`, `PARTIAL_SUCCESS`, or `FAILED`.
- `cancelPost(postId)` → Sets `status: CANCELLED`.

**Topics to learn:**
- MongoDB `$set` and `$elemMatch` operators
- Mongoose `findOneAndUpdate` with array updates

**Flow:** Worker calls `updatePlatformStatus()` after each platform attempt → Then calls `updateOverallStatus()` to recalculate global status.

---

## Phase 2: Controller Integration

### TODO 2.1: Refactor Platform Controllers
**Files:** `backend/src/controllers/platforms/{platform}.controller.ts`
**What to do:**
- Inside `postTo{Platform}`: Before calling `Producer.queueSocialPost()`, create a DB record first.
- Pass the real `postId` (from MongoDB) to the Producer instead of `bluesky-${Date.now()}`.

**Flow:** Controller receives request → `postRepository.createPost()` → `Producer.queueSocialPost(postId)` → Returns `postId` to frontend.

---

### TODO 2.2: Implement Post Status Endpoint
**File:** `backend/src/controllers/post.controller.ts`
**What to do:**
- Implement `getPostStatus(postId)` → Returns `platformStatuses` array and overall `status`.

**Topics to learn:**
- RESTful API design (`GET /api/posts/:postId/status`)

**Flow:** Frontend polls this endpoint every 3 seconds → User sees "Processing...", "Completed ✅", or "Failed ❌".

---

## Phase 3: Worker Implementation

### TODO 3.1: Complete Worker Processing Logic
**File:** `backend/src/workers/post.worker.ts`
**What to do:**
- Uncomment and implement **Step 1**: Check if post was cancelled by querying DB.
- Uncomment and implement **Step 3**: Update platform status to `processing`.
- Uncomment and implement **Step 4**: Fetch credentials from `SocialAccountModel`.
- Uncomment and implement **Step 5**: Call `getPostingService(platform).execute()`. 
- Uncomment and implement **Step 6**: Use `handleDeadLetter()` for failures.

**Topics to learn:**
- Error handling strategies (Permanent vs Retryable errors)
- The Factory Pattern (`getPostingService`)

**Flow:** Message arrives → Check DB → Update to "processing" → Fetch tokens → Post to platform → Update to "completed" or "failed" → ACK message.

---

### TODO 3.2: Implement Credential Fetching
**File:** `backend/src/services/posting/index.ts`
**What to do:**
- Implement `getCredentialsForPlatform(userId, platform)`.
- Query `SocialAccountModel` by `userId`.
- Return the correct auth object (e.g., `bluesky.auth.accessJwt`).

**Topics to learn:**
- Mongoose `findOne` and projections
- Token structure per platform (JWT vs OAuth)

**Flow:** Worker calls `getCredentialsForPlatform()` → Returns tokens → Worker passes tokens to Posting Service.

---

## Phase 4: Platform Posting Services

### TODO 4.1: Implement Base Service Methods
**File:** `backend/src/services/posting/base.posting.service.ts`
**What to do:**
- Uncomment and implement `execute()` method (the Template Method).
- Implement `handleError()` to detect rate limiting (HTTP 429) and auth failure (HTTP 401).

**Topics to learn:**
- Object-Oriented Design: Template Method Pattern
- Abstract Classes in TypeScript

**Flow:** Worker calls `service.execute()` → Service validates → Uploads media → Creates post → Returns result.

---

### TODO 4.2: Implement Bluesky Posting Service
**File:** `backend/src/services/posting/bluesky.posting.service.ts`
**What to do:**
- Implement `validateContent()` (300 char limit, 4 image max).
- Implement `uploadMedia()` using `agent.uploadBlob()`.
- Implement `createPost()` using `agent.post()`.

**Topics to learn:**
- AT Protocol API (`@atproto/api` npm package)
- Bluesky Facets (for links, mentions, hashtags)

**Flow:** Validate → Download from S3 → Upload blob to Bluesky → Create post record → Return URL.

---

### TODO 4.3: Implement Other Platform Services
**Files:** `threads.posting.service.ts`, `mastodon.posting.service.ts`, `tumblr.posting.service.ts`, `facebook.posting.service.ts`, `instagram.posting.service.ts`
**What to do:**
- Follow the same pattern as Bluesky.
- Use each platform's specific SDK or API.

**Topics to learn (per platform):**
- **Meta (Threads/Instagram/Facebook):** Graph API, Media Containers, Long-Lived Tokens.
- **Mastodon:** REST API, Instance URLs, ActivityPub basics.
- **Tumblr:** OAuth 1.0a, NPF (Neue Post Format).

---

## Phase 5: S3 & Media Handling

### TODO 5.1: Implement Pre-signed Upload URLs
**File:** `backend/src/services/s3/s3.service.ts`
**What to do:**
- Add `getPresignedUploadUrl(key, contentType)` method.
- Use `@aws-sdk/s3-request-presigner`.

**Topics to learn:**
- AWS S3 Pre-signed URLs
- Security: Expiration times, Content-Type restrictions

**Flow:** Frontend requests URL → Backend generates signed URL → Frontend uploads directly to S3 → Frontend sends S3 key to backend.

---

### TODO 5.2: Implement Media Download in Worker
**File:** Inside each Posting Service's `uploadMedia()` method.
**What to do:**
- Use `axios` to download image from S3 URL.
- Convert response to `Buffer`.
- Pass buffer to platform's upload API.

**Topics to learn:**
- Axios `responseType: 'arraybuffer'`
- Node.js Buffers

**Flow:** Worker gets S3 URL → Downloads to memory → Uploads to Bluesky/Threads/etc.

---

## Phase 6: Frontend Integration

### TODO 6.1: Implement Status Polling
**File:** `frontend/src/hooks/useCreatePost.ts` or a new hook `usePostStatus.ts`
**What to do:**
- After `handlePostNow()` succeeds, start polling `GET /api/posts/:postId/status`.
- Update UI based on `platformStatuses`.
- Stop polling when all platforms are `completed` or `failed`.

**Topics to learn:**
- `setInterval` and cleanup in React `useEffect`
- Optimistic UI updates

**Flow:** User clicks Post → See "Pending" → Poll every 3s → Update each platform's badge → Show final result.

---

### TODO 6.2: Implement Platform-Specific Content Editing
**File:** `frontend/src/hooks/useCreatePost.ts`
**What to do:**
- When user edits a specific platform's preview, store changes in `platformPosts` state.
- Send `platformSpecificContent` object to backend on submit.

**Flow:** User opens Tumblr preview → Removes 2 images → State updates → On submit, Tumblr gets its own `mediaItems` array.

---

## Phase 7: Error Handling & Retries

### TODO 7.1: Wire Up DLX in Worker
**File:** `backend/src/workers/post.worker.ts`
**What to do:**
- In the `catch` block, call `handleDeadLetter()` from `dlx.setup.ts`.
- Pass original message, routing key, error, and headers.

**Topics to learn:**
- Exponential Backoff strategy
- Dead Letter Exchanges in RabbitMQ

**Flow:** Worker fails → Calls `handleDeadLetter()` → Message goes to Retry Queue → TTL expires → Message re-enters Main Queue.

---

### TODO 7.2: Implement Manual Retry from Dashboard
**File:** `backend/src/controllers/post.controller.ts`
**What to do:**
- Implement `retryPost(postId, platform)`.
- Reset `attemptCount` to 0 for that platform.
- Call `Producer.queueSocialPost()` again.

**Flow:** User sees "Failed" badge on Tumblr → Clicks "Retry" → New message queued for Tumblr only.

---

## Summary Flow Diagram

```
[User] → [Frontend] → [Backend Controller]
                           │
                           ├──→ [MongoDB: Create Post Record]
                           │
                           └──→ [RabbitMQ: Queue Message]
                                        │
                                        ▼
                              [Worker: Process Message]
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
             [Check DB]          [Fetch Tokens]      [Call Service]
                                                           │
                                                    [Platform API]
                                                           │
                                              ┌────────────┴────────────┐
                                         [Success]                  [Failure]
                                              │                         │
                                       [Update DB]               [DLX/Retry]
                                              │
                                       [ACK Message]
```

---

## Learning Priority (Suggested Order)

1.  Mongoose Schema Design & Indexes
2.  MongoDB Array Update Operators (`$set`, `$push`, `$elemMatch`)
3.  Factory Pattern in TypeScript
4.  Template Method Pattern (OOP)
5.  AWS S3 Pre-signed URLs
6.  Platform-specific APIs (Start with Bluesky, simplest)
7.  Error Handling: Permanent vs Retryable
8.  React Polling Patterns
