# 🪣 AWS S3 — The Complete Masterclass
> **Project: Hayon** | Everything you need to know about S3, from zero to production

---

## Table of Contents

1. [What is AWS S3?](#1-what-is-aws-s3)
2. [Core S3 Concepts](#2-core-s3-concepts)
3. [IAM & Credentials — How AWS Knows Who You Are](#3-iam--credentials--how-aws-knows-who-you-are)
4. [Setting Up an S3 Bucket](#4-setting-up-an-s3-bucket)
5. [Bucket Policies & CORS — Controlling Access](#5-bucket-policies--cors--controlling-access)
6. [Presigned URLs — The Heart of Your Upload Strategy](#6-presigned-urls--the-heart-of-your-upload-strategy)
7. [How Files Are Stored (Key Structure)](#7-how-files-are-stored-key-structure)
8. [Your S3 Services — Full Line-by-Line Breakdown](#8-your-s3-services--full-line-by-line-breakdown)
9. [Upload Flow — Frontend to S3 to Database](#9-upload-flow--frontend-to-s3-to-database)
10. [Download Flow — How Images Are Viewed](#10-download-flow--how-images-are-viewed)
11. [Delete Flow — Cleaning Up Old Data](#11-delete-flow--cleaning-up-old-data)
12. [Where S3 Is Used in Hayon](#12-where-s3-is-used-in-hayon)
13. [Next.js & Image Optimization](#13-nextjs--image-optimization)
14. [Security Best Practices](#14-security-best-practices)
15. [Code Review — Mistakes & Improvements](#15-code-review--mistakes--improvements)

---

## 1. What is AWS S3?

**Amazon Simple Storage Service (S3)** is a cloud-based **object storage** service. Think of it like a hard drive on the internet, but with unlimited capacity, 99.999999999% (11 nines) durability, and global CDN support.

### Object Storage vs. File Storage vs. Block Storage

| Type | What it is | Example | Used for |
|------|-----------|---------|----------|
| **Block Storage** | Raw disk blocks, like a hard drive | AWS EBS | Databases, OS disks |
| **File Storage** | Folder/file hierarchy | NFS, Google Drive | Shared file systems |
| **Object Storage** | Flat key-value store (key → blob) | **AWS S3** | Images, videos, backups, static assets |

In S3, there are no actual "folders". What looks like `profiles/user123.jpg` is just a **key**. The `/` is part of the key name — S3 console just renders it as a folder for your convenience.

### Why Not Store Images in Your Database or EC2's Disk?

| Approach | Problem |
|----------|---------|
| **Store in MongoDB (base64)** | Documents balloon in size. BSON limit is 16MB per document. Extremely slow queries. |
| **Store on EC2 disk** | When your EC2 crashes or restarts, the disk content is gone (if ephemeral). No CDN. No replication. |
| **Store in S3** ✅ | Durable, cheap, fast, CDN-ready, secure, and infinitely scalable. |

---

## 2. Core S3 Concepts

### Bucket
A **bucket** is a top-level container for your objects. Think of it as a "root folder" in the cloud. Buckets have globally unique names — no two buckets in all of AWS can have the same name.

```
hayon-app-images   ← Bucket name
```

### Object
An **object** is anything stored in the bucket: a photo, video, PDF, JSON file. An object has:
- **Key**: The unique identifier (the "path")
- **Body**: The actual binary data
- **Metadata**: Extra info like `Content-Type`, `ETag`, etc.
- **ETag**: A hash of the object's content (like a fingerprint)

### Key
The **key** is treated like a file path. It's just a string. Example:

```
profiles/64abc123.jpg
posts/64abc123/post_uuid/post-media.jpg
temp/64abc123/uuid.png
```

### Region
AWS S3 buckets exist in a specific **region** (geographical data center). In Hayon, you use:
```
ap-south-1   ← Asia Pacific (Mumbai)
```

Keeping your bucket close to your EC2 instance reduces latency and eliminates data transfer costs.

### URL Structure
Once a file is uploaded, it can be accessed publicly (if allowed) via:
```
https://{bucket-name}.s3.{region}.amazonaws.com/{key}

# Example:
https://hayon-app-images.s3.ap-south-1.amazonaws.com/profiles/user123.jpg
```

---

## 3. IAM & Credentials — How AWS Knows Who You Are

**IAM (Identity and Access Management)** is AWS's permission system. Before your Node.js backend can do anything with S3, AWS needs to verify that your server is authorized.

### The Flow

```
Your EC2 / Local Server
        │
        ▼
   AWS SDK sends request
   with:
    - Access Key ID       ← "who am I"
    - Secret Access Key   ← "my password"
        │
        ▼
   AWS IAM checks:
   "Does this key have permission to do this action on this bucket?"
        │
        ├── YES → Request proceeds ✅
        └── NO  → 403 AccessDenied ❌
```

### Creating an IAM User for S3

1. Go to **IAM → Users → Create User**
2. Name it something like `hayon-s3-user`
3. Attach policy: `AmazonS3FullAccess` (or a custom restrictive policy — see security section)
4. Generate **Access Key** → download the `.csv`
5. Paste into your `.env`:
```env
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=abc123secret...
AWS_REGION=ap-south-1
AWS_S3_BUCKET_NAME=hayon-app-images
```

### In Your `env.ts`

```typescript
// backend/src/config/env.ts — Lines 70–75
AWS: {
  ACCESS_KEY_ID: required("AWS_ACCESS_KEY_ID"),     // Line 71: Reads from .env, throws if missing
  SECRET_ACCESS_KEY: required("AWS_SECRET_ACCESS_KEY"), // Line 72: Secret key for signing
  REGION: required("AWS_REGION"),                   // Line 73: e.g., "ap-south-1"
  S3_BUCKET_NAME: required("AWS_S3_BUCKET_NAME"),   // Line 74: Your bucket name
},
```

The `required()` helper (Lines 4–10) ensures your app **crashes at startup** if any env var is missing. This is brilliant — it's far better to fail fast than to have mysterious runtime errors 10 minutes into a request.

---

## 4. Setting Up an S3 Bucket

### Step-by-Step

1. **Create Bucket**:
   - Go to **S3 → Create Bucket**
   - Name: `hayon-app-images`
   - Region: `ap-south-1`
   - **Uncheck "Block all public access"** (if you want public profile images — explained below)

2. **Bucket Versioning**: Off (you don't need old versions for profile photos)

3. **Encryption**: Default (S3-managed keys — free)

### Public vs. Private Objects

| Type | Access | Use Case in Hayon |
|------|--------|-------------------|
| **Public** | Anyone with the URL can view | Profile avatars |
| **Private** | Only via presigned URL or server-side | Post media (debatable) |

> 🤔 **In Hayon's current setup**, files are uploaded with no explicit ACL, which means they inherit the bucket policy. If your bucket is configured to allow public reads (via bucket policy), then the plain `s3Url` returned by your functions works as a public URI. If the bucket is private (which is the secure default), then these plain URLs would return `403 Access Denied` when loaded in `<img>` tags — and you'd need presigned download URLs instead.

---

## 5. Bucket Policies & CORS — Controlling Access

### Bucket Policy (Public Read for Profile Images)

If you want profile images to be publicly accessible via their URL, you add a **Bucket Policy**:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadForProfiles",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::hayon-app-images/profiles/*"
    }
  ]
}
```

This says: "Allow ANYONE to `GetObject` (read) anything inside the `profiles/` prefix." The `*` in `Principal` means "all users — even unauthenticated ones."

For post media, you might want `posts/*` to be private (require presigned URLs), while `profiles/*` is public.

### CORS (Cross-Origin Resource Sharing)

When the **browser** sends a `PUT` request directly to S3 (using a presigned URL), S3 must allow requests from your frontend domain. Without CORS, the browser will block it.

Go to **S3 → Your Bucket → Permissions → CORS** and add:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://yourproductiondomain.com"
    ],
    "ExposeHeaders": ["ETag"]
  }
]
```

- `AllowedHeaders: ["*"]` — Allow any request header (like `Content-Type`)
- `AllowedMethods` — The HTTP methods S3 should allow
- `AllowedOrigins` — Which frontend domains can talk to S3
- `ExposeHeaders: ["ETag"]` — Expose the ETag back to the browser (useful for verifying uploads)

**Without this CORS config, your `uploadFiles()` function in `useCreatePost.ts` will fail with a CORS error** when the browser tries to `PUT` the file directly to S3.

---

## 6. Presigned URLs — The Heart of Your Upload Strategy

### The Problem Without Presigned URLs

If your backend received the file and then uploaded it to S3:

```
User selects file
      → sends file to your Express server (slow, wastes bandwidth)
      → your server receives the file into memory
      → your server uploads file to S3
      → slow, double bandwidth, server memory pressure
```

Your EC2 t2.micro would be crushed under video uploads.

### The Presigned URL Solution

A **presigned URL** is a temporary URL generated by your backend that allows the **browser to upload directly to S3**, bypassing your server for the actual file data:

```
User selects file
      ↓
Browser asks your backend: "I want to upload a 5MB JPG"
      ↓
Backend generates a pre-signed PUT URL (valid for 15 minutes)
Backend returns: { uploadUrl, s3Url, s3Key }
      ↓
Browser PUTs the file directly to that S3 URL
      ↓
Browser tells your backend: "I uploaded it, here's the s3Url"
      ↓
Backend saves the s3Url in MongoDB
```

**Your server never touches the file bytes.** This is the gold standard for file uploads in web applications.

### How the Signature Works (Simplified)

When you call `getSignedUrl()`, the AWS SDK:
1. Takes the S3 command parameters (bucket, key, content-type, expiry)
2. Signs them with your **secret access key** using HMAC-SHA256
3. Encodes those parameters + signature into query string parameters

The resulting URL looks like:
```
https://hayon-app-images.s3.ap-south-1.amazonaws.com/posts/abc123/uuid.jpg
  ?X-Amz-Algorithm=AWS4-HMAC-SHA256
  &X-Amz-Credential=AKID...
  &X-Amz-Date=20260221T000000Z
  &X-Amz-Expires=900
  &X-Amz-SignedHeaders=content-type%3Bhost
  &X-Amz-Signature=abc123signature...
```

AWS verifies this signature when the browser calls it. If the signature is valid and not expired, the upload is allowed — **without S3 ever contacting your backend**.

---

## 7. How Files Are Stored (Key Structure)

### Your Key Naming Strategy

```
profiles/{userId}-{timestamp}.{ext}    ← Profile pictures
temp/{userId}/{uuid}.{ext}             ← Temporary post media (uploaded, not yet confirmed)
posts/{userId}/{postId}/{uuid}.{ext}   ← Permanent post media (confirmed post)
```

### Why "temp" folder?

When a user selects images in the Create Post form, you upload them immediately (for a responsive UI). But what if the user never clicks "Post"? You'd have orphaned files in S3 that waste storage.

The `temp/` folder is meant to hold unconfirmed uploads. Ideally, you'd run a **lifecycle rule** or **S3 cleanup job** to delete files from `temp/` after 24–48 hours.

> ⚠️ **Currently in your code**, `moveMediaToPermanent()` exists in `s3.upload.service.ts` but is **not actually called** during post creation. The `s3Url` from the temp folder is saved directly to MongoDB without moving it. This means your "temp" folder semantic is misleading — files are never actually moved to `posts/`. More on this in the review section.

---

## 8. Your S3 Services — Full Line-by-Line Breakdown

### `s3.service.ts` — The Core CRUD Service

```typescript
// Line 1: Import the ENV config to get credentials/bucket name
import { ENV } from "../../config/env";

// Line 2: Import the AWS SDK v3 S3 client and commands
// SDK v3 uses a "command pattern": you create a command object and send it
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

// Line 3: Import our custom TypeScript type for the upload response shape
import { UploadResponse } from "../../types/s3.types";

// Line 5: Declare a class — this is a service object
class S3Service {
  // Line 6: Private field — the S3 client instance. Private means only this class can use it.
  private s3Client: S3Client;

  // Line 7: Private field — the bucket name from env
  private bucketName: string;

  // Lines 9–18: Constructor — runs when you do `new S3Service()`
  constructor() {
    // Lines 10–16: Create the S3Client with region and credentials
    // S3Client is stateless — it just holds configuration
    // It does NOT open a network connection here
    this.s3Client = new S3Client({
      region: ENV.AWS.REGION || "ap-south-1", // Which AWS region to talk to
      credentials: {
        accessKeyId: ENV.AWS.ACCESS_KEY_ID,       // "Who am I"
        secretAccessKey: ENV.AWS.SECRET_ACCESS_KEY, // "My secret"
      },
    });

    // Line 17: Store the bucket name so every method can use it
    this.bucketName = ENV.AWS.S3_BUCKET_NAME;
  }

  // Lines 21–41: Upload a file to S3
  async uploadFile(key: string, fileBuffer: Buffer, fileType: string): Promise<UploadResponse> {
    // key:        WHERE in S3 to store it, e.g. "profiles/user123.jpg"
    // fileBuffer: The actual binary content of the file
    // fileType:   MIME type like "image/jpeg" — tells S3 what kind of data it is

    try {
      // Lines 23–28: Create a PutObject command
      // PutObjectCommand is an instruction: "Upload this data to this bucket at this key"
      // It does NOT upload yet — it's just configuration
      const command = new PutObjectCommand({
        Bucket: this.bucketName, // Which bucket
        Key: key,                // "Filename" / path in S3
        Body: fileBuffer,        // The actual file data (bytes)
        ContentType: fileType,   // Tells browsers how to display/download the file
      });

      // Line 30: Actually SEND the command to AWS
      // this.s3Client.send() is what makes the HTTP request to AWS
      // It returns the AWS response (which has ETag etc.)
      const result = await this.s3Client.send(command);

      // Lines 32–37: Build and return a clean response object
      return {
        success: true,
        key,
        // ETag: A quoted MD5 hash of the uploaded content, like `"a1b2c3d4..."`
        // Used to verify the upload completed correctly
        etag: result.ETag || "",
        // Build the public URL for this file
        location: this.getS3Url(key),
      };
    } catch (error) {
      // Line 39: If upload fails, throw a descriptive error
      // The `error instanceof Error` check ensures we can safely access .message
      throw new Error(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  // Lines 43–47: Build the public URL for any S3 key
  private getS3Url(key: string): string {
    const region = ENV.AWS.REGION;
    // Standard S3 URL format: https://{bucket}.s3.{region}.amazonaws.com/{key}
    return `https://${this.bucketName}.s3.${region}.amazonaws.com/${key}`;
  }

  // Lines 49–75: updateFile — used to REPLACE an existing file at the same key
  // In S3, "update" = overwrite. Same key = same location = new data replaces old.
  async updateFile(
    key: string,
    fileBuffer: Buffer,
    fileType: string,
    metadata?: Record<string, string>, // Optional extra metadata (e.g., { "originalName": "cat.jpg" })
  ): Promise<UploadResponse> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: fileType,
        Metadata: metadata, // Stored as S3 object metadata, NOT in the file content itself
      });

      const result = await this.s3Client.send(command);

      return {
        success: true,
        key,
        etag: result.ETag || "",
        location: this.getS3Url(key),
      };
    } catch (error) {
      throw new Error(`Update failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  // Lines 77–88: Delete a file from S3
  async deleteFile(key: string): Promise<void> {
    // key: The S3 key of the file to delete, e.g. "profiles/user123.jpg"
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key, // The exact key to delete
        // Note: S3 delete does NOT throw an error if the key doesn't exist.
        // It silently succeeds. So you don't need to check if the file exists first.
      });

      await this.s3Client.send(command);
      // No return value — void. If it didn't throw, it worked.
    } catch (error) {
      throw new Error(`Delete failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}

// Line 91: Export a SINGLETON instance — one shared S3Service object for the whole app
// This is a common pattern: create once, reuse everywhere. The S3Client is stateless so it's safe.
export default new S3Service();
```

---

### `s3.upload.service.ts` — Presigned URLs & Advanced Operations

```typescript
// Lines 1–7: Import specific commands and the client
import {
  S3Client,
  PutObjectCommand,        // For generating presigned upload URLs
  GetObjectCommand,        // For generating presigned download URLs + downloading files
  DeleteObjectCommand,     // For deleting files directly
  CopyObjectCommand,       // For copying files within S3 (used in moveMediaToPermanent)
} from "@aws-sdk/client-s3";

// Line 8: getSignedUrl — the function that creates presigned URLs
// This is from a separate package: @aws-sdk/s3-request-presigner
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { ENV } from "../../config/env";

// Line 10: Node.js crypto module — used to generate random UUIDs
import crypto from "crypto";

// Line 11: Readable is a Node.js stream type
// S3's GetObject returns the file as a Node.js readable stream
import { Readable } from "stream";

// Lines 13–19: Create a MODULE-LEVEL s3Client
// Unlike s3.service.ts (which uses a class), this file uses a plain function pattern
// The client is created once when the module is first imported
const s3Client = new S3Client({
  region: ENV.AWS.REGION,
  credentials: {
    accessKeyId: ENV.AWS.ACCESS_KEY_ID,
    secretAccessKey: ENV.AWS.SECRET_ACCESS_KEY,
  },
});

// ────────────────────────────────────────────────────────────
// FUNCTION 1: getPresignedUploadUrl
// ────────────────────────────────────────────────────────────
//
// Lines 21–44: Generate a presigned PUT URL
// This lets the BROWSER upload a file directly to S3 without going through your server
//
// Parameters:
//   userId:   The user's MongoDB ID (used to namespace files)
//   filename: The original filename from the browser (e.g., "photo.jpg")
//   mimeType: The file's MIME type (e.g., "image/jpeg")
//   folder:   Where in S3 to store it — defaults to "temp"

export async function getPresignedUploadUrl(
  userId: string,
  filename: string,
  mimeType: string,
  folder: string = "temp",
): Promise<{ uploadUrl: string; s3Key: string; s3Url: string }> {

  // Line 27: Generate a RFC-4122 UUID (universally unique ID)
  // Example: "550e8400-e29b-41d4-a716-446655440000"
  // This ensures no two uploads ever collide, even simultaneously
  const uuid = crypto.randomUUID();

  // Line 28: Extract the file extension from the filename
  // "photo.jpeg".split(".") → ["photo", "jpeg"]
  // .pop() takes the last element → "jpeg"
  // || "bin" is a fallback if no extension exists
  const ext = filename.split(".").pop() || "bin";

  // Lines 30–32: Build the S3 key (the file's "path" in S3)
  // Special case: for "profiles" folder, use a fixed filename instead of UUID.
  // Why? Because each user should only have ONE profile picture.
  // If we used the UUID, every upload creates a new file. For profiles, we want
  // the new upload to OVERWRITE the same key (same location = same URL in DB stays valid).
  //
  // For all other folders (temp, posts), use UUID to guarantee uniqueness.
  //
  // Profile key example:  "profiles/64abc123-1708000000000.webp"
  // Post/temp key example: "temp/64abc123/550e8400-e29b-41d4-a716.jpg"
  const s3Key =
    folder === "profiles" ? `${folder}/${filename}` : `${folder}/${userId}/${uuid}.${ext}`;

  // Lines 34–38: Create a PutObjectCommand
  // Note: We don't pass a Body here — this command is ONLY used to generate the signature
  // The browser will supply the actual file bytes when it uses the presigned URL
  const command = new PutObjectCommand({
    Bucket: ENV.AWS.S3_BUCKET_NAME,
    Key: s3Key,
    ContentType: mimeType, // THIS IS IMPORTANT: the presigned URL will only accept this exact MIME type
  });

  // Line 40: Generate the presigned URL
  // getSignedUrl(client, command, options) → returns a URL string
  // expiresIn: 900 = 900 seconds = 15 minutes
  // After 15 minutes, this URL becomes invalid. The browser must use it before then.
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

  // Line 41: Build the permanent/public S3 URL for this key
  // This is DIFFERENT from the uploadUrl (which has expiry params)
  // This is the clean URL you save to MongoDB
  const s3Url = `https://${ENV.AWS.S3_BUCKET_NAME}.s3.${ENV.AWS.REGION}.amazonaws.com/${s3Key}`;

  // Line 43: Return all three values
  // uploadUrl → the browser uses this to PUT the file
  // s3Key     → you save this to find/delete the file later
  // s3Url     → the permanent URL you save to the database
  return { uploadUrl, s3Key, s3Url };
}

// ────────────────────────────────────────────────────────────
// FUNCTION 2: moveMediaToPermanent
// ────────────────────────────────────────────────────────────
//
// Lines 46–72: Move a file from temp/ to posts/ after the post is confirmed
// This is a two-step operation: COPY to new location, then DELETE the original
//
// Parameters:
//   tempKey: The current S3 key (in temp/)
//   userId:  User's ID
//   postId:  The confirmed Post ID (from MongoDB)

export async function moveMediaToPermanent(
  tempKey: string,
  userId: string,
  postId: string,
): Promise<string> {

  // Line 51: Extract just the filename from the full key
  // "temp/64abc123/uuid.jpg".split("/") → ["temp", "64abc123", "uuid.jpg"]
  // .pop() → "uuid.jpg"
  const filename = tempKey.split("/").pop();

  // Line 52: Build the new permanent key
  // Example: "posts/64abc123/507f1f77bcf86cd799439011/uuid.jpg"
  const newKey = `posts/${userId}/${postId}/${filename}`;

  // Lines 54–61: COPY the object to the new key
  // S3 CopyObject is a SERVER-SIDE operation — S3 copies the file internally
  // Your server does NOT download and re-upload it. Very efficient.
  await s3Client.send(
    new CopyObjectCommand({
      Bucket: ENV.AWS.S3_BUCKET_NAME,    // Destination bucket
      CopySource: `${ENV.AWS.S3_BUCKET_NAME}/${tempKey}`, // Source: "bucket/key"
      Key: newKey,                         // Destination key
    }),
  );

  // Lines 63–69: DELETE the original temp file
  // We only delete AFTER the copy succeeds (sequential, not parallel)
  // This prevents data loss if the copy fails halfway
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: ENV.AWS.S3_BUCKET_NAME,
      Key: tempKey,
    }),
  );

  // Line 71: Return the new permanent URL
  return `https://${ENV.AWS.S3_BUCKET_NAME}.s3.${ENV.AWS.REGION}.amazonaws.com/${newKey}`;
}

// ────────────────────────────────────────────────────────────
// FUNCTION 3: getPresignedDownloadUrl
// ────────────────────────────────────────────────────────────
//
// Lines 74–84: Generate a presigned GET URL
// Used when the S3 file is PRIVATE (no public bucket policy)
// This gives a temporary URL that allows the holder to download the file
//
// Parameters:
//   s3Key:    The file's key in S3
//   expiresIn: How many seconds the URL is valid (default: 1 hour = 3600 seconds)

export async function getPresignedDownloadUrl(
  s3Key: string,
  expiresIn: number = 3600,
): Promise<string> {

  // Create a GetObjectCommand — a "read" command
  const command = new GetObjectCommand({
    Bucket: ENV.AWS.S3_BUCKET_NAME,
    Key: s3Key,
  });

  // Generate and return the presigned URL
  // The URL will include your signature, expiry, etc.
  // Anyone with this URL can download the file for the next `expiresIn` seconds
  return await getSignedUrl(s3Client, command, { expiresIn });
}

// ────────────────────────────────────────────────────────────
// FUNCTION 4: downloadMedia
// ────────────────────────────────────────────────────────────
//
// Lines 86–100: Download a file from S3 and return it as a Buffer
// Used when your BACKEND needs the file bytes (e.g., to send to another API like Instagram)
// The posting workers use this to fetch media before uploading to social platforms

export async function downloadMedia(s3Key: string): Promise<Buffer> {

  // Send the GetObjectCommand — this downloads the file
  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: ENV.AWS.S3_BUCKET_NAME,
      Key: s3Key, // The file to download
    }),
  );

  // Line 94: Cast Body to Readable
  // response.Body is a Node.js Readable stream (data comes in chunks, not all at once)
  // This is memory efficient — S3 doesn't dump 100MB into memory at once
  const stream = response.Body as Readable;

  // Line 95: Array to collect binary chunks
  const chunks: Buffer[] = [];

  // Lines 96–98: Read all chunks from the stream
  // `for await...of` waits for each chunk from the stream
  // Each `chunk` is a Buffer (raw bytes)
  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  // Line 99: Concatenate all chunks into one Buffer
  // Buffer.concat takes an array of Buffers and merges them into one
  return Buffer.concat(chunks);
}

// ────────────────────────────────────────────────────────────
// FUNCTION 5: extractS3Key
// ────────────────────────────────────────────────────────────
//
// Lines 102–121: Parse an S3 URL and extract just the key part
// This is used everywhere you need to delete or reference a file by key
// given only its URL (e.g., from the database)
//
// Example:
// Input:  "https://hayon-app-images.s3.ap-south-1.amazonaws.com/profiles/user.jpg"
// Output: "profiles/user.jpg"

export function extractS3Key(s3Url: string): string {
  if (!s3Url) return "";

  // Lines 105–107: Try regex match for standard S3 URL formats
  // Pattern 1: .s3.{region}.amazonaws.com/{key}  (path-style with region)
  // Pattern 2: .s3.amazonaws.com/{key}            (legacy path-style)
  // The (.+)$ captures everything after the last "/" — that's our key
  const s3DomainMatch =
    s3Url.match(/\.s3[.-][^/]+\.amazonaws\.com\/(.+)$/) ||
    s3Url.match(/\.s3\.amazonaws\.com\/(.+)$/);

  if (s3DomainMatch && s3DomainMatch[1]) {
    // Lines 110–111: Strip query string parameters
    // Presigned URLs have parameters after "?", but the key is everything before "?"
    return s3DomainMatch[1].split("?")[0];
  }

  // Lines 114–118: Fallback — simpler split if regex didn't match
  const parts = s3Url.split(".amazonaws.com/");
  if (parts.length > 1) {
    return parts[1].split("?")[0];
  }

  // Line 120: Last resort — return the URL as-is
  // This prevents errors but might indicate a non-S3 URL was passed in
  return s3Url;
}
```

---

## 9. Upload Flow — Frontend to S3 to Database

### Flow Diagram

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Browser    │         │ Your Backend │         │    AWS S3    │
└──────┬───────┘         └──────┬───────┘         └──────┬───────┘
       │                        │                        │
       │  POST /posts/media/upload                       │
       │  { contentType: "image/jpeg" }                  │
       │ ──────────────────────>│                        │
       │                        │                        │
       │                        │  getPresignedUploadUrl()
       │                        │  (signs URL with secret key)
       │                        │◄───────────────────────┤
       │                        │                        │
       │  { uploadUrl, s3Url, s3Key }                    │
       │ <──────────────────────│                        │
       │                        │                        │
       │  PUT <uploadUrl>        │                        │
       │  body: <file bytes>     │                        │
       │ ────────────────────────────────────────────────>
       │                        │                        │
       │  200 OK (ETag: "abc")   │                        │
       │ <────────────────────────────────────────────────
       │                        │                        │
       │  POST /posts           │                        │
       │  { content: { mediaItems: [{ s3Url, s3Key }] } }
       │ ──────────────────────>│                        │
       │                        │                        │
       │                        │  Save post to MongoDB  │
       │                        │  { mediaItems: [s3Url] }
       │                        │                        │
       │  200 OK { postId }      │                        │
       │ <──────────────────────│                        │
```

### Your `uploadFiles()` in `useCreatePost.ts` — Line by Line

```typescript
// Lines 433–461 of useCreatePost.ts
const uploadFiles = async (files: File[]) => {
  // Guard: if no files, return empty array immediately
  if (files.length === 0) return [];

  // Create an array of upload promises — all files upload SIMULTANEOUSLY (parallel)
  const uploadPromises = files.map(async (file) => {
    // STEP 1: Ask your backend for a presigned URL
    // Your backend calls getPresignedUploadUrl() and returns:
    //   uploadUrl: the temporary S3 URL with embedded signature
    //   s3Url:     the permanent URL (what gets saved to DB)
    //   s3Key:     the S3 key (for future delete/reference)
    const { data } = await api.post("/posts/media/upload", {
      contentType: file.type, // e.g., "image/jpeg"
    });

    const { uploadUrl, s3Url, s3Key } = data.data;

    // STEP 2: Upload the file DIRECTLY to S3
    // Note: This is a BROWSER fetch() call — not going through your backend
    // method: "PUT" — S3 presigned PUT upload requires PUT (not POST)
    // body: file — the raw File object (browser handles binary encoding)
    // headers: Content-Type MUST match what you specified when generating the URL
    //          If they don't match, S3 returns 403 SignatureDoesNotMatch
    await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    // STEP 3: Return the metadata — the actual bytes are now in S3
    return {
      s3Url,    // The permanent URL (stored in DB)
      s3Key,    // The S3 key (for future operations)
      mimeType: file.type,
    };
  });

  // Wait for ALL uploads to complete (parallel execution)
  return Promise.all(uploadPromises);
};
```

---

## 10. Download Flow — How Images Are Viewed

### For Public Files (Profile Avatars)

Since your profile images are stored at `profiles/` and your bucket policy allows public reads:

```
Browser renders: <img src="https://hayon-app-images.s3.ap-south-1.amazonaws.com/profiles/user.jpg" />
                                     ↓
                         Browser sends GET request to S3
                                     ↓
               S3 checks bucket policy → "profiles/* is public → allow"
                                     ↓
                         S3 returns the image bytes
                                     ↓
                              Browser displays it
```

The URL is stored directly in MongoDB (in the user's `avatar` field). No backend involved in serving the image.

### For Private Files (Post Media, if protected)

```typescript
// Call getPresignedDownloadUrl to get a temporary viewable URL
const viewUrl = await getPresignedDownloadUrl("posts/userId/postId/uuid.jpg", 3600);
// This URL is valid for 1 hour
// Pass it to the frontend, which puts it in an <img src={viewUrl} />
```

### For Server-Side Downloads (Posting Workers)

When your `posting.worker.ts` needs to upload media to Instagram/Facebook, it downloads the file:

```typescript
const imageBuffer = await downloadMedia("posts/userId/postId/uuid.jpg");
// imageBuffer is a Buffer with the raw image bytes
// Now pass it to the Instagram API: formData.append("file", imageBuffer)
```

---

## 11. Delete Flow — Cleaning Up Old Data

### Avatar Deletion in `profile.controller.ts` — Line by Line

```typescript
// Lines 155–184: deleteProfileController

export async function deleteProfileController(req: Request, res: Response): Promise<void> {
  const userId = req?.auth?.id as string;

  // Line 160: Get the currently stored avatar URL from the JWT auth payload
  // req.auth is populated by your auth middleware after verifying the JWT
  // .avatar is the field you store the S3 URL in
  const currentAvatar = req.auth?.avatar;

  // Line 161: SANITY CHECK — only delete S3 files, not external avatars
  // A user might have a Google OAuth avatar (lh3.googleusercontent.com)
  // or a DiceBear avatar. We only call S3 delete if the URL contains our bucket name.
  if (currentAvatar && currentAvatar.includes(ENV.AWS.S3_BUCKET_NAME)) {
    
    // Line 163: Extract the S3 key from the full URL
    // "https://hayon-app-images.s3.ap-south-1.amazonaws.com/profiles/user.jpg"
    //                                                      split here ↑
    // .split(".amazonaws.com/") → ["https://hayon-app-images.s3.ap-south-1", "profiles/user.jpg"]
    // [1] → "profiles/user.jpg"  ← the key we need
    const s3Key = currentAvatar.split(".amazonaws.com/")[1];

    if (s3Key) {
      // Line 165: Delete the file from S3
      // If this fails, the file stays in S3 (a "ghost" file), but we don't crash the controller
      await s3Service.deleteFile(s3Key);
    }
  }

  // Lines 169–171: Generate a random DiceBear avatar URL
  // This replaces the deleted profile picture with a unique generated avatar
  const min = 10000000;
  const max = 99999999;
  const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;

  // Line 174: Update database with the new DiceBear URL
  await updateAvatar(userId, `https://api.dicebear.com/7.x/identicon/svg?seed=/${randomNum}`);

  new SuccessResponse("avatar deleted successfully").send(res);
}
```

### Update Avatar (Replace Existing) in `updateProfileController`

```typescript
// Lines 122–135 of profile.controller.ts
// When user uploads a NEW profile picture, delete the OLD one from S3

const currentAvatar = req.auth?.avatar; // Old avatar URL

// Three conditions before deleting old avatar:
// 1. There IS a current avatar
// 2. The new imageUrl is DIFFERENT from the old one (don't delete if same URL)
// 3. The current avatar is from our S3 bucket (not Google/DiceBear)
if (
  currentAvatar &&
  currentAvatar !== imageUrl &&
  currentAvatar.includes(ENV.AWS.S3_BUCKET_NAME)
) {
  const s3Key = currentAvatar.split(".amazonaws.com/")[1];
  if (s3Key) {
    // .catch() wraps the delete — if delete fails, we log the error but CONTINUE.
    // This is intentional: saving the new avatar URL matters more than cleaning up the old one.
    // The old file becomes a "ghost" — wasted storage, but the user experience is not broken.
    await s3Service
      .deleteFile(s3Key)
      .catch((err) => logger.error(`Failed to delete old avatar: ${err.message}`));
  }
}
```

---

## 12. Where S3 Is Used in Hayon

| Location | What it does | S3 Operation |
|----------|-------------|-------------|
| `getProfileUploadUrlController` | Generate presigned URL for avatar upload | `getPresignedUploadUrl` (PUT) |
| `updateProfileController` | Delete old avatar when user uploads new one | `s3Service.deleteFile()` |
| `deleteProfileController` | Delete avatar when user removes profile picture | `s3Service.deleteFile()` |
| `getUploadUrls` (post.controller) | Generate presigned URL for post media upload | `getPresignedUploadUrl` (PUT) |
| `createPost` (post.controller) | Saves s3Url in the post document | MongoDB save (URL only) |
| `downloadMedia` | Posting workers download media to upload to platforms | `GetObjectCommand` |
| `useCreatePost.ts` (frontend) | Browser uploads files directly to presigned URL | Browser `fetch PUT` |
| `loadDraft` (frontend) | Loads s3Urls from DB and uses them as `<img>` src | Plain URL read |
| `next.config.ts` | Allows Next.js `<Image>` to load from S3 domain | Image optimization config |
| Notification payload (post.controller L135) | Uses s3Url as notification thumbnail | URL reference |

---

## 13. Next.js & Image Optimization

When you use Next.js `<Image>` component, Next.js:
1. Intercepts the image request
2. Downloads the image from the remote source
3. Resizes/compresses/converts it to WebP
4. Serves the optimized version from its cache

But Next.js only does this for **whitelisted domains**. That's why `next.config.ts` has:

```typescript
// next.config.ts — Lines 16–22
{
  protocol: "https",
  hostname: "hayon-app-images.s3.amazonaws.com",
  // Allows: https://hayon-app-images.s3.amazonaws.com/**
},
{
  protocol: "https",
  hostname: "hayon-app-images.s3.ap-south-1.amazonaws.com",
  // Allows: https://hayon-app-images.s3.ap-south-1.amazonaws.com/**
},
```

**You have two separate entries** because:
- `s3.amazonaws.com` is the legacy global endpoint (used in older AWS SDK versions)
- `s3.ap-south-1.amazonaws.com` is the regional endpoint (what your current code generates)

Both are needed for safety, as different parts of your code or older saved URLs might use either format.

> ⚠️ Without these entries, `<Image src={s3Url} />` would throw: `Error: Invalid src prop: hostname not configured under images in next.config.ts`

---

## 14. Security Best Practices

### ✅ Things You're Doing Right

1. **Presigned URLs for upload** — Browser never gets your AWS credentials
2. **Validating content-type before generating URLs** — Prevents users from uploading `.exe` or `.php` files
3. **Validating the imageUrl contains your bucket name** before saving it to DB — Prevents storing arbitrary external URLs as "profile pictures"
4. **Deleting old avatars from S3** before replacing — No orphaned files
5. **Using `required()` for env vars** — App crashes at startup if credentials are missing, not at runtime

### IAM — Minimum Privilege Policy

Instead of `AmazonS3FullAccess` for your IAM user, use a custom policy that restricts access to only your bucket and only the operations you need:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:CopyObject"
      ],
      "Resource": "arn:aws:s3:::hayon-app-images/*"
    },
    {
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::hayon-app-images"
    }
  ]
}
```

This means if your AWS credentials are ever leaked, the attacker can ONLY access `hayon-app-images`, and cannot create new buckets, access other services (EC2, RDS, etc.), or modify bucket settings.

---

## 15. Code Review — Mistakes & Improvements

### 🔴 Bug #1: `moveMediaToPermanent` is Never Called

**Location**: `s3.upload.service.ts` — Lines 46–72
**Problem**: The function `moveMediaToPermanent` was written to move files from `temp/` → `posts/` after post creation. But in `post.controller.ts`, after creating the post, this function is **never called**. The `s3Url` from the temp folder (e.g., `temp/userId/uuid.jpg`) is saved directly to MongoDB.

```typescript
// In post.controller.ts createPost() — what you DO:
const post = await postRepository.createPost(postData);
// postData.content.mediaItems[].s3Url still points to temp/ ← never moved

// What you SHOULD do:
const post = await postRepository.createPost(postData);
// Then move each temp file to permanent location
const movedMediaItems = await Promise.all(
  content.mediaItems.map(async (item) => {
    const permanentUrl = await moveMediaToPermanent(
      item.s3Key!,
      userId,
      post._id.toString()
    );
    return { ...item, s3Url: permanentUrl };
  })
);
// Then update the post with permanent URLs
```

**Impact**: Files sit in `temp/` forever. If you add an S3 lifecycle rule to delete `temp/` objects after 7 days, post media gets deleted.

---

### 🔴 Bug #2: `deleteMedia` Controller is Not Implemented

**Location**: `post.controller.ts` — Lines 384–395
**Problem**: The `deleteMedia` controller simply returns `501 Not Implemented`. This means when a post is deleted, the associated S3 media files are never cleaned up.

```typescript
// Current implementation:
export const deleteMedia = async (req: Request, res: Response) => {
  // ...
  return new ErrorResponse("Not implemented", { status: 501 }).send(res);
};

// Fix: In deletePost(), after deleting from MongoDB, also delete S3 files:
export const deletePost = async (req: Request, res: Response) => {
  const deletedPost = await postRepository.deletePost(postId, userId);
  
  // Clean up S3 media
  if (deletedPost?.content?.mediaItems?.length) {
    for (const item of deletedPost.content.mediaItems) {
      if (item.s3Key) {
        await s3Service.deleteFile(item.s3Key).catch((err) =>
          logger.error(`Failed to delete S3 media: ${err.message}`)
        );
      }
    }
  }
};
```

---

### 🟡 Issue #3: Duplicate S3 Client Initialization

**Location**: Both `s3.service.ts` and `s3.upload.service.ts`
**Problem**: You create two separate `S3Client` instances: one in the `S3Service` class, and one at module level in `s3.upload.service.ts`. These are configured identically. While S3Client is stateless (so creating two isn't catastrophically bad), it's wasteful and inconsistent.

**Fix**: Create one shared `s3Client` instance in a dedicated file, then import it both places:

```typescript
// backend/src/services/s3/s3.client.ts  (new file)
import { S3Client } from "@aws-sdk/client-s3";
import { ENV } from "../../config/env";

export const s3Client = new S3Client({
  region: ENV.AWS.REGION,
  credentials: {
    accessKeyId: ENV.AWS.ACCESS_KEY_ID,
    secretAccessKey: ENV.AWS.SECRET_ACCESS_KEY,
  },
});

// Then in both s3.service.ts and s3.upload.service.ts:
import { s3Client } from "./s3.client";
```

---

### 🟡 Issue #4: `extractS3Key` vs Manual `.split(".amazonaws.com/")[1]`

**Location**: `profile.controller.ts` — Lines 129, 163
**Problem**: You have a perfectly good `extractS3Key()` function in `s3.upload.service.ts`, but `profile.controller.ts` manually splits the URL using `.split(".amazonaws.com/")[1]` instead.

```typescript
// Current (fragile):
const s3Key = currentAvatar.split(".amazonaws.com/")[1];

// Better (use your existing utility):
import { extractS3Key } from "../services/s3/s3.upload.service";
const s3Key = extractS3Key(currentAvatar);
```

The manual split doesn't handle edge cases like presigned URLs with query parameters, which `extractS3Key` does handle.

---

### 🟡 Issue #5: Typo in Response Message

**Location**: `profile.controller.ts` — Line 176
```typescript
// Current (typo):
new SuccessResponse("avatart deleted successfully").send(res);
//                         ↑ extra 't'

// Fix:
new SuccessResponse("avatar deleted successfully").send(res);
```

---

### 🟡 Issue #6: Debug `console.log` Left in Production Code

**Location**: `profile.controller.ts` — Line 173
```typescript
console.log(req.auth); // ← This logs sensitive auth data to production logs!

// Remove this line entirely, or if you need to debug, use:
logger.debug("Auth data:", req.auth);
// And ensure debug logs are disabled in production via LOG_LEVEL env var
```

---

### 🟡 Issue #7: `getProfileUploadUrlController` — Post Usage is Broken

**Location**: `profile.controller.ts` — Lines 87–90
```typescript
if (usage === "post") {
  folder = "temp";
  filename = `image.${ext}`; // ← BUG: Every post image has the exact same key!
}
```

If `usage === "post"`, the key would be `temp/image.jpg` for every user — they'd overwrite each other's uploads. However, this code path doesn't appear to be used in the app (posts use `getUploadUrls` in `post.controller.ts` instead), but it's still a latent bug.

---

### 🟢 Improvement: Add S3 Lifecycle Rules

In the AWS S3 console, go to **Management → Lifecycle Rules → Create Rule**:

- **Rule 1**: Delete objects in `temp/` after 2 days
  - Filter: Prefix = `temp/`
  - Action: Expire after 2 days

This automatically cleans up files uploaded but never confirmed (abandoned uploads), preventing storage cost buildup.

---

### 🟢 Improvement: Use CloudFront for CDN

Instead of serving images directly from S3:
```
https://hayon-app-images.s3.ap-south-1.amazonaws.com/profiles/user.jpg
```

Set up a CloudFront distribution in front of your S3 bucket:
```
https://d1234abcd.cloudfront.net/profiles/user.jpg
```

Benefits:
- Images served from **edge locations worldwide** (much faster for users outside India)
- CloudFront caches images — reduced S3 GET requests → lower costs
- You can use a custom domain: `https://assets.hayon.app/profiles/user.jpg`
- Better security: keep bucket completely private, only CloudFront can read it

---

## Summary — The Complete S3 Journey in Hayon

```
User selects photo on frontend
          │
          ▼
useCreatePost.ts: uploadFiles()
  1. POST /posts/media/upload (contentType)
          │
          ▼
post.controller.ts: getUploadUrls()
  2. Validates mimeType is in allowedTypes
  3. Calls getPresignedUploadUrl(userId, filename, contentType, "posts")
          │
          ▼
s3.upload.service.ts: getPresignedUploadUrl()
  4. Generates UUID for uniqueness
  5. Builds s3Key: "posts/{userId}/{uuid}.{ext}"
  6. Creates PutObjectCommand (no Body yet)
  7. Signs it with AWS SDK → uploadUrl (valid 15 min)
  8. Builds permanent s3Url
  9. Returns { uploadUrl, s3Key, s3Url }
          │
          ▼
Back in frontend: useCreatePost.ts
  10. Browser fetch(uploadUrl, { method: "PUT", body: file })
  11. File bytes travel directly from browser → AWS S3
  12. S3 verifies signature, stores the file
          │
          ▼
Frontend collects { s3Url, s3Key, mimeType } per file
          │
          ▼
User clicks "Post Now"
  13. POST /posts with payload including mediaItems: [{ s3Url, s3Key, mimeType }]
          │
          ▼
post.controller.ts: createPost()
  14. Validates payload with Zod schema
  15. Creates post document in MongoDB with s3Url
  16. Queues posting jobs to RabbitMQ
          │
          ▼
posting.worker.ts picks up the job
  17. Reads mediaUrls (s3Url) from the job
  18. Calls downloadMedia(s3Key) to get file as Buffer
  19. Uploads buffer to Instagram/Facebook/etc. API
          │
          ▼
Platform posts the image
User's profile shows the post with the S3 image URL
```

---

*Last updated: 2026-02-21 | Project: Hayon*
