// src/types/refresh-token.ts
import { Types } from "mongoose";

export interface IRefreshToken {
  _id: Types.ObjectId;

  tokenId: string;            // UUID referenced in JWT
  userId: Types.ObjectId;     // Owner
  expiresAt: Date;            // Absolute expiry
  revoked: boolean;           // Manual invalidation

  createdAt: Date;
  updatedAt: Date;
}
