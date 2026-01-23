// ============================================================================
// S3 SERVICE - ENHANCED WITH TODO COMMENTS FOR POSTING WORKFLOW
// ============================================================================
// File: src/services/s3/s3.upload.ts (NEW - dedicated for post media)
// Purpose: Handle media uploads for social media posts
// ============================================================================

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, CopyObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "../../config/env";
import crypto from "crypto";
import { Readable } from "stream";

const s3Client = new S3Client({
    region: ENV.AWS.REGION,
    credentials: {
        accessKeyId: ENV.AWS.ACCESS_KEY_ID,
        secretAccessKey: ENV.AWS.SECRET_ACCESS_KEY,
    },
});

export async function getPresignedUploadUrl(
    userId: string,
    filename: string,
    mimeType: string,
    folder: string = "temp"
): Promise<{ uploadUrl: string; s3Key: string; s3Url: string }> {
    const uuid = crypto.randomUUID();
    const ext = filename.split('.').pop() || 'bin';

    // If folder is "profiles", we use a fixed name instead of UUID to keep one image per user
    const s3Key = folder === "profiles"
        ? `${folder}/${filename}`
        : `${folder}/${userId}/${uuid}.${ext}`;

    const command = new PutObjectCommand({
        Bucket: ENV.AWS.S3_BUCKET_NAME,
        Key: s3Key,
        ContentType: mimeType,
        ACL: 'public-read', // Make uploaded files publicly accessible
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 }); // 15 min
    const s3Url = `https://${ENV.AWS.S3_BUCKET_NAME}.s3.${ENV.AWS.REGION}.amazonaws.com/${s3Key}`;

    return { uploadUrl, s3Key, s3Url };
}

export async function moveMediaToPermanent(
    tempKey: string,
    userId: string,
    postId: string
): Promise<string> {
    const filename = tempKey.split('/').pop();
    const newKey = `posts/${userId}/${postId}/${filename}`;

    // Copy
    await s3Client.send(new CopyObjectCommand({
        Bucket: ENV.AWS.S3_BUCKET_NAME,
        CopySource: `${ENV.AWS.S3_BUCKET_NAME}/${tempKey}`,
        Key: newKey,
    }));

    // Delete original
    await s3Client.send(new DeleteObjectCommand({
        Bucket: ENV.AWS.S3_BUCKET_NAME,
        Key: tempKey,
    }));

    return `https://${ENV.AWS.S3_BUCKET_NAME}.s3.${ENV.AWS.REGION}.amazonaws.com/${newKey}`;
}

export async function getPresignedDownloadUrl(
    s3Key: string,
    expiresIn: number = 3600  // 1 hour default
): Promise<string> {
    const command = new GetObjectCommand({
        Bucket: ENV.AWS.S3_BUCKET_NAME,
        Key: s3Key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
}

export async function downloadMedia(s3Key: string): Promise<Buffer> {
    const response = await s3Client.send(new GetObjectCommand({
        Bucket: ENV.AWS.S3_BUCKET_NAME,
        Key: s3Key,
    }));

    const stream = response.Body as Readable;
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
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
