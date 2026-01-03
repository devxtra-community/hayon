// src/models/refresh-token.model.ts
import mongoose, { Schema } from "mongoose";
import { IRefreshToken } from "../interfaces/refreshtoken.interface";

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    tokenId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    revoked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);


RefreshTokenSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

export const RefreshToken = mongoose.model<IRefreshToken>(
  "RefreshToken",
  RefreshTokenSchema
);
