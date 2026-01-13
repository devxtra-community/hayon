import mongoose, { Schema, Model } from "mongoose";
import {
  SocialAccount,
  Profile,
  Health,
  MetaAuth,
  Facebook,
  Instagram,
  Threads,
  Bluesky,
  Mastodon,
  Tumblr,
} from "../interfaces/socialAccount.interface";

const profileSchema = new Schema<Profile>(
  {
    handle: { type: String },
    displayName: { type: String },
    avatar: { type: String },
  },
  { _id: false },
);

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

const metaAuthSchema = new Schema<MetaAuth>(
  {
    accessToken: {
      type: String,
      required: function (this: { parent: () => { connected?: boolean } }) {
        return this.parent()?.connected;
      },
    },
    refreshToken: {
      type: String,

      required: false,
    },
    expiresAt: { type: Date },
    scopes: { type: [String], default: [] },
  },
  { _id: false },
);

const facebookSchema = new Schema<Facebook>(
  {
    connected: { type: Boolean, default: false },
    platformId: { type: String }, // Page ID
    profile: profileSchema,
    auth: metaAuthSchema,
    health: healthSchema,
  },
  { _id: false },
);

const instagramSchema = new Schema<Instagram>(
  {
    connected: { type: Boolean, default: false },
    platformId: { type: String }, // User ID
    profile: profileSchema,
    auth: metaAuthSchema,
    health: healthSchema,

    linkedPageId: { type: String },
    businessId: { type: String },
  },
  { _id: false },
);

const threadsSchema = new Schema<Threads>(
  {
    connected: { type: Boolean, default: false },
    platformId: { type: String }, // User ID
    profile: profileSchema,
    auth: metaAuthSchema,
    health: healthSchema,
  },
  { _id: false },
);

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

const socialAccountSchema = new Schema<SocialAccount>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    facebook: { type: facebookSchema, default: () => ({}) },
    instagram: { type: instagramSchema, default: () => ({}) },
    threads: { type: threadsSchema, default: () => ({}) },

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
