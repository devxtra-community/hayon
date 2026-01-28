import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";
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
  folder: string = "temp",
): Promise<{ uploadUrl: string; s3Key: string; s3Url: string }> {
  const uuid = crypto.randomUUID();
  const ext = filename.split(".").pop() || "bin";

  // If folder is "profiles", we use a fixed name instead of UUID to keep one image per user
  const s3Key =
    folder === "profiles" ? `${folder}/${filename}` : `${folder}/${userId}/${uuid}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: ENV.AWS.S3_BUCKET_NAME,
    Key: s3Key,
    ContentType: mimeType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 }); // 15 min
  const s3Url = `https://${ENV.AWS.S3_BUCKET_NAME}.s3.${ENV.AWS.REGION}.amazonaws.com/${s3Key}`;

  return { uploadUrl, s3Key, s3Url };
}

export async function moveMediaToPermanent(
  tempKey: string,
  userId: string,
  postId: string,
): Promise<string> {
  const filename = tempKey.split("/").pop();
  const newKey = `posts/${userId}/${postId}/${filename}`;

  // Copy
  await s3Client.send(
    new CopyObjectCommand({
      Bucket: ENV.AWS.S3_BUCKET_NAME,
      CopySource: `${ENV.AWS.S3_BUCKET_NAME}/${tempKey}`,
      Key: newKey,
    }),
  );

  // Delete original
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: ENV.AWS.S3_BUCKET_NAME,
      Key: tempKey,
    }),
  );

  return `https://${ENV.AWS.S3_BUCKET_NAME}.s3.${ENV.AWS.REGION}.amazonaws.com/${newKey}`;
}

export async function getPresignedDownloadUrl(
  s3Key: string,
  expiresIn: number = 3600, // 1 hour default
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: ENV.AWS.S3_BUCKET_NAME,
    Key: s3Key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

export async function downloadMedia(s3Key: string): Promise<Buffer> {
  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: ENV.AWS.S3_BUCKET_NAME,
      Key: s3Key,
    }),
  );

  const stream = response.Body as Readable;
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export function extractS3Key(s3Url: string): string {
  if (!s3Url) return "";

  const s3DomainMatch =
    s3Url.match(/\.s3[.-][^/]+\.amazonaws\.com\/(.+)$/) ||
    s3Url.match(/\.s3\.amazonaws\.com\/(.+)$/);

  if (s3DomainMatch && s3DomainMatch[1]) {
    // Remove any query parameters (like presigned URL parts)
    return s3DomainMatch[1].split("?")[0];
  }

  // Fallback: try to split by .amazonaws.com/
  const parts = s3Url.split(".amazonaws.com/");
  if (parts.length > 1) {
    return parts[1].split("?")[0];
  }

  return s3Url; // Return as is if no match
}
