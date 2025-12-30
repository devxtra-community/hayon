import { ENV } from "../../config/env";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { UploadResponse } from "../../types/s3.types";

class S3Service {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.s3Client = new S3Client({
      region: ENV.AWS.REGION || "ap-south-1",
      credentials: {
        accessKeyId: ENV.AWS.ACCESS_KEY_ID,
        secretAccessKey: ENV.AWS.SECRET_ACCESS_KEY,
      },
    });
    this.bucketName = ENV.AWS.S3_BUCKET_NAME;
  }

  // upload file
  async uploadFile(key: string, fileBuffer: Buffer, fileType: string): Promise<UploadResponse> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: fileType,
      });

      const result = await this.s3Client.send(command);

      return {
        success: true,
        key,
        etag: result.ETag || "",
        location: `https://${this.bucketName}.s3.amazonaws.com/${key}`,
      };
    } catch (error) {
      throw new Error(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}

export default new S3Service();
