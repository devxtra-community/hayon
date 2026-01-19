// ============================================================================
// S3 SERVICE - ENHANCED WITH TODO COMMENTS FOR POSTING WORKFLOW
// ============================================================================
// File: src/services/s3/s3.upload.ts (NEW - dedicated for post media)
// Purpose: Handle media uploads for social media posts
// ============================================================================

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "../../config/env";

// ============================================================================
// S3 KEY STRUCTURE
// ============================================================================

/*
 * KEY NAMING CONVENTION:
 * 
 * Temporary uploads (before post created):
 *   temp/{userId}/{uuid}.{ext}
 *   - Used for draft media
 *   - S3 lifecycle rule: delete after 24 hours
 * 
 * Permanent uploads (after post created):
 *   posts/{userId}/{postId}/{uuid}.{ext}
 *   - Moved from temp/ when post is submitted
 *   - Retained as long as post exists
 * 
 * Example:
 *   temp/user123/550e8400-e29b-41d4-a716-446655440000.jpg
 *   posts/user123/post456/550e8400-e29b-41d4-a716-446655440000.jpg
 */

// ============================================================================
// PRESIGNED URL GENERATION
// ============================================================================

/*
 * TODO: getPresignedUploadUrl
 * 
 * Generates a pre-signed PUT URL for direct frontend upload.
 * 
 * Parameters:
 * - userId: string
 * - filename: string
 * - mimeType: string
 * 
 * Returns:
 * - uploadUrl: Pre-signed URL for PUT request
 * - s3Key: The key where file will be stored
 * - s3Url: Final public URL after upload
 * 
 * Flow:
 * 1. Frontend calls POST /api/posts/media/upload with file metadata
 * 2. Backend generates pre-signed URL (expires in 15 min)
 * 3. Frontend uploads directly to S3 using PUT request
 * 4. Frontend sends s3Url in createPost request
 */

export async function getPresignedUploadUrl(
    userId: string,
    filename: string,
    mimeType: string
): Promise<{ uploadUrl: string; s3Key: string; s3Url: string }> {
    // TODO: Implement

    // const s3Client = new S3Client({
    //   region: ENV.AWS.REGION,
    //   credentials: {
    //     accessKeyId: ENV.AWS.ACCESS_KEY_ID,
    //     secretAccessKey: ENV.AWS.SECRET_ACCESS_KEY,
    //   },
    // });
    // 
    // // Generate unique key
    // const uuid = crypto.randomUUID();
    // const ext = filename.split('.').pop() || 'bin';
    // const s3Key = `temp/${userId}/${uuid}.${ext}`;
    // 
    // const command = new PutObjectCommand({
    //   Bucket: ENV.AWS.S3_BUCKET_NAME,
    //   Key: s3Key,
    //   ContentType: mimeType,
    // });
    // 
    // const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 }); // 15 min
    // const s3Url = `https://${ENV.AWS.S3_BUCKET_NAME}.s3.amazonaws.com/${s3Key}`;
    // 
    // return { uploadUrl, s3Key, s3Url };

    return { uploadUrl: "", s3Key: "", s3Url: "" };
}

// ============================================================================
// MOVE MEDIA FROM TEMP TO PERMANENT
// ============================================================================

/*
 * TODO: moveMediaToPermanent
 * 
 * Called when post is created - moves media from temp/ to posts/
 * 
 * This is important because:
 * - temp/ has lifecycle rule (auto-delete)
 * - posts/ is permanent storage
 * - Maintains clean organization
 * 
 * Flow:
 * 1. Copy object to new key
 * 2. Delete old object
 * 3. Return new URL
 */

export async function moveMediaToPermanent(
    tempKey: string,
    userId: string,
    postId: string
): Promise<string> {
    // TODO: Implement

    // const s3Client = new S3Client({...});
    // 
    // // Extract filename from temp key
    // const filename = tempKey.split('/').pop();
    // const newKey = `posts/${userId}/${postId}/${filename}`;
    // 
    // // Copy
    // await s3Client.send(new CopyObjectCommand({
    //   Bucket: ENV.AWS.S3_BUCKET_NAME,
    //   CopySource: `${ENV.AWS.S3_BUCKET_NAME}/${tempKey}`,
    //   Key: newKey,
    // }));
    // 
    // // Delete original
    // await s3Client.send(new DeleteObjectCommand({
    //   Bucket: ENV.AWS.S3_BUCKET_NAME,
    //   Key: tempKey,
    // }));
    // 
    // return `https://${ENV.AWS.S3_BUCKET_NAME}.s3.amazonaws.com/${newKey}`;

    return "";
}

// ============================================================================
// GET PRESIGNED DOWNLOAD URL
// ============================================================================

/*
 * TODO: getPresignedDownloadUrl
 * 
 * For private buckets - generate signed URL for reading.
 * 
 * IMPORTANT FOR INSTAGRAM/THREADS:
 * Instagram requires PUBLIC URLs for media.
 * Options:
 * A) Make bucket public (security concern)
 * B) Use signed URL with LONG expiry (1+ hour) - recommended
 * C) Use CloudFront with signed URLs
 * 
 * For posting workflow:
 * - Generate signed URL with 1 hour expiry
 * - Instagram container creation takes time
 * - URL must remain valid during processing
 */

export async function getPresignedDownloadUrl(
    s3Key: string,
    expiresIn: number = 3600  // 1 hour default
): Promise<string> {
    // TODO: Implement for private buckets

    // const s3Client = new S3Client({...});
    // 
    // const command = new GetObjectCommand({
    //   Bucket: ENV.AWS.S3_BUCKET_NAME,
    //   Key: s3Key,
    // });
    // 
    // return await getSignedUrl(s3Client, command, { expiresIn });

    return "";
}

// ============================================================================
// DOWNLOAD MEDIA (For worker - platform upload)
// ============================================================================

/*
 * TODO: downloadMedia
 * 
 * Downloads media from S3 for uploading to platforms.
 * 
 * Needed by platforms that require direct upload:
 * - Bluesky: uploadBlob() needs buffer
 * - Mastodon: /api/v2/media needs multipart
 * 
 * NOT needed by:
 * - Instagram: accepts public URLs
 * - Facebook: accepts public URLs
 * - Threads: accepts public URLs
 */

export async function downloadMedia(s3Key: string): Promise<Buffer> {
    // TODO: Implement

    // const s3Client = new S3Client({...});
    // 
    // const response = await s3Client.send(new GetObjectCommand({
    //   Bucket: ENV.AWS.S3_BUCKET_NAME,
    //   Key: s3Key,
    // }));
    // 
    // const stream = response.Body as Readable;
    // const chunks: Buffer[] = [];
    // for await (const chunk of stream) {
    //   chunks.push(chunk);
    // }
    // return Buffer.concat(chunks);

    return Buffer.from([]);
}

// ============================================================================
// S3 LIFECYCLE RULES (Configure in AWS Console or Terraform)
// ============================================================================

/*
 * TODO: Configure these lifecycle rules in S3:
 *
 * Rule 1: Delete temp files after 24 hours
 * {
 *   Filter: { Prefix: "temp/" },
 *   Expiration: { Days: 1 },
 *   Status: "Enabled"
 * }
 *
 * Rule 2: Move old posts to cheaper storage (optional)
 * {
 *   Filter: { Prefix: "posts/" },
 *   Transitions: [
 *     { Days: 90, StorageClass: "STANDARD_IA" },
 *     { Days: 365, StorageClass: "GLACIER" }
 *   ],
 *   Status: "Enabled"
 * }
 */

// ============================================================================
// BUCKET CORS CONFIGURATION
// ============================================================================

/*
 * TODO: Configure CORS for direct browser upload:
 *
 * {
 *   "CORSRules": [
 *     {
 *       "AllowedOrigins": ["https://hayon.site", "https://dev.hayon.site"],
 *       "AllowedMethods": ["PUT", "GET"],
 *       "AllowedHeaders": ["*"],
 *       "MaxAgeSeconds": 3000
 *     }
 *   ]
 * }
 */

// ============================================================================
// EDGE CASES
// ============================================================================

/*
 * 1. LARGE FILE UPLOADS
 *    - Use multipart upload for files > 5MB
 *    - @aws-sdk/lib-storage provides Upload class
 * 
 * 2. UPLOAD PROGRESS
 *    - Frontend can't easily track presigned URL upload progress
 *    - Consider: direct upload with progress vs presigned URL simplicity
 * 
 * 3. FILE TYPE VALIDATION
 *    - Validate mimeType on backend before generating URL
 *    - S3 doesn't validate content matches Content-Type
 * 
 * 4. DUPLICATE UPLOADS
 *    - Same file uploaded multiple times = multiple S3 objects
 *    - Consider: hash-based deduplication (complex)
 * 
 * 5. CLEANUP ON FAILED POSTS
 *    - If post creation fails, media in temp/ auto-deletes (lifecycle)
 *    - If post succeeds but some platforms fail, keep media
 */
