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

export const findByTokenId = async (tokenId: string) => {
  return RefreshToken.findOne({ tokenId });
};

export const revokeToken = async (tokenId: string) => {
  return RefreshToken.updateOne({ tokenId }, { $set: { revoked: true } });
};

export const revokeAllForUser = async (userId: string) => {
  return RefreshToken.updateMany({ userId, revoked: false }, { $set: { revoked: true } });
};

export const findActiveByUserId = async (userId: string) => {
  return RefreshToken.find({
    userId,
    revoked: false,
    expiresAt: { $gt: new Date() },
  })
    .select("tokenId ipAddress userAgent lastActive createdAt")
    .lean();
};
