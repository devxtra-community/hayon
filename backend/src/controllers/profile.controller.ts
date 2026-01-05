import s3Service from "../services/s3/s3.service";
import { parseBase64Image } from "../utils/bufferConvertion";
import { Request, Response } from "express";
import { SuccessResponse, ErrorResponse } from "../utils/responses";
import { updateAvatar, updateUserAvatar } from "../repositories/user.repository";

export async function updateProfileController(req: Request, res: Response): Promise<void> {
  try {
    const userId = req?.auth?.id as string;
    const { image } = req.body;
    const { buffer } = parseBase64Image(image);
    const uploadResult = await s3Service.updateFile(
      `users/${userId}/profile.png`,
      buffer,
      "image/png",
    );
    await updateUserAvatar(userId, uploadResult.location);
    new SuccessResponse("Profile image updated successfully", {
      data: {
        imageUrl: uploadResult.location,
      },
    }).send(res);
  } catch (err: any) {
    new ErrorResponse(err.message || "Failed to update profile image", { status: 400 }).send(res);
  }
}

export async function deleteProfileController(req: Request, res: Response): Promise<void> {
  try {
    const userId = req?.auth?.id as string;
    await s3Service.deleteFile(`users/${userId}/profile.png`);

    const min = 10000000;
    const max = 99999999;
    const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;

    console.log(req.auth);
    await updateAvatar(userId, `https://api.dicebear.com/7.x/identicon/svg?seed=/${randomNum}`);

    new SuccessResponse("avatart deleted successfully").send(res);
  } catch (err: any) {
    new ErrorResponse(err.message || "Failed to delete account", { status: 400 }).send(res);
  }
}
