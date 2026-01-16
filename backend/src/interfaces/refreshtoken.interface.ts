import { Types } from "mongoose";

export interface IRefreshToken {
  _id: Types.ObjectId;

  tokenId: string; // UUID referenced in JWT
  userId: Types.ObjectId; // Owner
  expiresAt: Date; // Absolute expiry
  revoked: boolean; // Manual invalidation

  ipAddress?: string;
  userAgent?: string;
  lastActive: Date;

  createdAt: Date;
  updatedAt: Date;
}
