import { RefreshToken } from "../models/refreshToken.model";
import { Types } from "mongoose";

export const createRefreshToken = async (data: {
  tokenId: string;
  userId: Types.ObjectId;
  role: "user" | "admin";
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}) => {
  return RefreshToken.create(data);
};
