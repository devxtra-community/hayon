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
