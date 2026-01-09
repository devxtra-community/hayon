import mongoose, { Schema, Model } from "mongoose";
import {
  SocialAccount,
  Profile,
  Health,
  Meta,
  MetaAuth,
  MetaIdentity,
  Bluesky,
  Mastodon,
  Tumblr,
} from "../interfaces/socialAccount.interface";

/* ---------- PROFILE ---------- */
const profileSchema = new Schema<Profile>(
  {
    handle: { type: String },
    displayName: { type: String },
    avatar: { type: String },
  },
  { _id: false },
);

/* ---------- HEALTH ---------- */
const healthSchema = new Schema<Health>(
  {
    status: {
      type: String,
      enum: ["active", "expired", "revoked", "error"],
      default: "active",
    },
    needsReconnection: { type: Boolean, default: false },
    lastSuccessfulRefresh: { type: Date },
    lastError: { type: String },
    consecutiveFailures: { type: Number, default: 0 },
  },
  { _id: false },
);

/* ---------- SHARED META AUTH ---------- */
const metaAuthSchema = new Schema<MetaAuth>(
  {
    accessToken: {
      type: String,
      required: function (this: any) {
        return this.parent()?.connected;
      },
    },
    refreshToken: {
      type: String,
      required: function (this: any) {
        return this.parent()?.connected;
      },
    },
    expiresAt: { type: Date },
    scopes: { type: [String], default: [] },
  },
  { _id: false },
);

/* ---------- META IDENTITY (NO AUTH HERE) ---------- */
const metaIdentitySchema = new Schema<MetaIdentity>(
  {
    platformId: { type: String }, // Page ID / IG User ID / Threads User ID
    profile: profileSchema,
  },
  { _id: false },
);

/* ---------- META ROOT ---------- */
const metaSchema = new Schema<Meta>(
  {
    connected: { type: Boolean, default: false },

    auth: metaAuthSchema,
    health: healthSchema,

    facebook: metaIdentitySchema,
    instagram: metaIdentitySchema,
    threads: metaIdentitySchema,

    platformMetadata: {
      linkedPageId: { type: String },
      businessId: { type: String },
    },
  },
  { _id: false },
);

/* ============================================================
   BLUESKY (AT PROTOCOL)
============================================================ */

const blueskySchema = new Schema<Bluesky>(
  {
    connected: { type: Boolean, default: false },

    did: { type: String, sparse: true },
    handle: { type: String },

    profile: profileSchema,

    auth: {
      accessJwt: { type: String },
      refreshJwt: { type: String },
      expiresAt: { type: Date },

      dpopKeyPair: { type: Schema.Types.Mixed },
    },

    repo: { type: String },

    health: healthSchema,
  },
  { _id: false },
);

/* ============================================================
   MASTODON (OAUTH + INSTANCE-BASED)
============================================================ */

const mastodonSchema = new Schema<Mastodon>(
  {
    connected: { type: Boolean, default: false },

    instanceUrl: {
      type: String,
      required: function (this: { connected?: boolean }) {
        return !!this.connected;
      },
    },

    accountId: { type: String },

    profile: profileSchema,

    auth: {
      accessToken: { type: String },
      accessTokenSecret: { type: String },
      expiresAt: { type: Date },
      scopes: { type: [String], default: [] },
    },

    health: healthSchema,
  },
  { _id: false },
);

/* ============================================================
   TUMBLR (BLOG-CENTRIC)
============================================================ */

const tumblrSchema = new Schema<Tumblr>(
  {
    connected: { type: Boolean, default: false },

    blogHostname: { type: String },

    profile: profileSchema,

    auth: {
      oauthToken: { type: String },
      oauthTokenSecret: { type: String },
    },

    health: healthSchema,
  },
  { _id: false },
);

/* ============================================================
   ROOT SOCIAL ACCOUNT
============================================================ */

const socialAccountSchema = new Schema<SocialAccount>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    meta: { type: metaSchema, default: () => ({}) },

    bluesky: { type: blueskySchema, default: () => ({}) },
    mastodon: { type: mastodonSchema, default: () => ({}) },
    tumblr: { type: tumblrSchema, default: () => ({}) },
  },
  { timestamps: true },
);

const SocialAccountModel: Model<SocialAccount> = mongoose.model<SocialAccount>(
  "SocialAccount",
  socialAccountSchema,
);

export default SocialAccountModel;
