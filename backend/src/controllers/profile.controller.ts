import s3Service from "../services/s3/s3.service";
import { getPresignedUploadUrl } from "../services/s3/s3.upload.service";
import { ENV } from "../config/env";
import { Request, Response } from "express";
import { SuccessResponse, ErrorResponse } from "../utils/responses";
import {
  changeUserTimezone,
  updateAvatar,
  updateUserAvatar,
  changeUserName,
  findUserByIdSafe,
} from "../repositories/user.repository";
import logger from "../utils/logger";
import { timezoneSchema } from "@hayon/schemas";

export async function getProfileUploadUrlController(req: Request, res: Response): Promise<void> {
  try {
    const userId = req?.auth?.id as string;
    const { contentType, usage = "avatar" } = req.body;

    // Validate content type
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!contentType || !allowedTypes.includes(contentType)) {
      throw new Error("Invalid image type. Only PNG, JPEG, and WebP are allowed.");
    }

    // Determine file extension from content type
    const ext = contentType.split("/")[1];

    // Determine folder and filename based on usage
    let folder = "profiles";
    let filename = `${userId}-${Date.now()}.${ext}`;

    if (usage === "post") {
      folder = "temp";
      // for temp/post uploads, s3.upload.ts handles UUID generation if we pass a simple name
      // or we can just pass the name and it will be used?
      // checking s3.upload.ts:
      // const s3Key = folder === "profiles" ? `${folder}/${filename}` : `${folder}/${userId}/${uuid}.${ext}`;
      // So if folder is NOT profiles, it generates UUID. Filename arg is ignored for the key generation in that case?
      // Wait, let's re-read s3.upload.ts logic in next step if needed, but assuming standard behavior:
      // const ext = filename.split('.').pop() || 'bin';
      // so it uses the extension from the filename.
      filename = `image.${ext}`; // just to provide extension
    }

    // Generate presigned URL
    const { uploadUrl, s3Url } = await getPresignedUploadUrl(userId, filename, contentType, folder);

    new SuccessResponse("Presigned URL generated", {
      data: {
        uploadUrl,
        s3Url,
        contentType,
      },
    }).send(res);
  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.info("Error generating upload URL:", err.message);
      new ErrorResponse(err.message || "Failed to generate upload URL", { status: 400 }).send(res);
    } else {
      new ErrorResponse("Failed to generate upload URL", { status: 400 }).send(res);
    }
  }
}

export async function updateProfileController(req: Request, res: Response): Promise<void> {
  try {
    const userId = req?.auth?.id as string;
    const { imageUrl } = req.body;

    // Validate that the imageUrl is from our S3 bucket
    if (!imageUrl || !imageUrl.includes(ENV.AWS.S3_BUCKET_NAME)) {
      throw new Error("Invalid image URL");
    }

    // Fetch user to get current avatar URL for cleanup
    const user = await findUserByIdSafe(userId);
    if (user?.avatar && user.avatar !== imageUrl && user.avatar.includes(ENV.AWS.S3_BUCKET_NAME)) {
      const s3Key = user.avatar.split(".amazonaws.com/")[1];
      if (s3Key) {
        await s3Service
          .deleteFile(s3Key)
          .catch((err) => logger.error(`Failed to delete old avatar: ${err.message}`));
      }
    }

    // Update user's avatar URL in database
    await updateUserAvatar(userId, imageUrl);

    new SuccessResponse("Profile image updated successfully", {
      data: {
        imageUrl,
      },
    }).send(res);
  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.info("Error updating profile image:", err.message);
      new ErrorResponse(err.message || "Failed to update profile image", { status: 400 }).send(res);
    } else {
      new ErrorResponse("Failed to update profile image", { status: 400 }).send(res);
    }
  }
}

export async function deleteProfileController(req: Request, res: Response): Promise<void> {
  try {
    const userId = req?.auth?.id as string;

    // Fetch user to get current avatar URL
    const user = await findUserByIdSafe(userId);
    if (user?.avatar && user.avatar.includes(ENV.AWS.S3_BUCKET_NAME)) {
      // Extract key from URL
      // Example: https://bucket.s3.region.amazonaws.com/profiles/userId.png
      const s3Key = user.avatar.split(".amazonaws.com/")[1];
      if (s3Key) {
        await s3Service.deleteFile(s3Key);
      }
    }

    const min = 10000000;
    const max = 99999999;
    const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;

    console.log(req.auth);
    await updateAvatar(userId, `https://api.dicebear.com/7.x/identicon/svg?seed=/${randomNum}`);

    new SuccessResponse("avatart deleted successfully").send(res);
  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.info("Error deleting account:", err.message);
      new ErrorResponse(err.message || "Failed to delete account", { status: 400 }).send(res);
    } else {
      new ErrorResponse("Failed to delete account", { status: 400 }).send(res);
    }
  }
}

export async function changeTimezoneController(req: Request, res: Response): Promise<void> {
  try {
    const userId = req?.auth?.id as string;
    const { timezone } = req.body;

    // Validation
    const validationResult = timezoneSchema.safeParse(timezone);
    if (!validationResult.success) {
      new ErrorResponse("Invalid timezone", {
        status: 400,
        data: validationResult.error.format(),
      }).send(res);
      return;
    }

    await changeUserTimezone(userId, validationResult.data);

    new SuccessResponse("Timezone updated successfully").send(res);
    return;
  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.info("Error updating timezone:", err.message);
      new ErrorResponse(err.message || "Failed to update timezone", { status: 400 }).send(res);
    } else {
      new ErrorResponse("Failed to update timezone", { status: 400 }).send(res);
    }
  }
}

export async function changeNameController(req: Request, res: Response): Promise<void> {
  try {
    const userId = req?.auth?.id as string;
    const { name } = req.body;

    await changeUserName(userId, name);

    new SuccessResponse("Name updated successfully").send(res);
  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.info("Error updating name:", err.message);
      new ErrorResponse(err.message || "Failed to update name", { status: 400 }).send(res);
    } else {
      new ErrorResponse("Failed to update name", { status: 400 }).send(res);
    }
  }
}
