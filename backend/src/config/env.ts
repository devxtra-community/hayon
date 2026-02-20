import dotenv from "dotenv";
dotenv.config();

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`😭😭😭😭😭😭😭😭😭 Missing environment variable ❗❗❗: ${key}  ⚠️❗`);
  }
  return value;
};

export const ENV = {
  /** ======================
   *  APP / CORE
   *  ====================== */
  APP: {
    NODE_ENV: required("NODE_ENV"),
    PORT: Number(process.env.PORT ?? 5000),
    FRONTEND_URL: required("FRONTEND_URL"),
    BACKEND_URL: required("BACKEND_URL"),
  },

  /** ======================
   *  DATABASE
   *  ====================== */
  DB: {
    MONGODB_URI: required("MONGODB_URI"),
  },

  /** ======================
   *  AUTH / JWT
   *  ====================== */
  AUTH: {
    ACCESS_TOKEN_SECRET: required("ACCESS_TOKEN_SECRET"),
    REFRESH_TOKEN_SECRET: required("REFRESH_TOKEN_SECRET"),
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d",
  },

  /** ======================
   *  GOOGLE OAUTH
   *  ====================== */
  GOOGLE: {
    CLIENT_ID: required("GOOGLE_CLIENT_ID"),
    CLIENT_SECRET: required("GOOGLE_CLIENT_SECRET"),
    CALLBACK_URL: required("GOOGLE_CALLBACK_URL"),
  },

  /** ======================
   *  STRIPE
   *  ====================== */
  STRIPE: {
    SECRET_KEY: required("STRIPE_SECRET_KEY"),
    PUBLISHABLE_KEY: required("STRIPE_PUBLISHABLE_KEY"),
    WEBHOOK_SECRET: required("STRIPE_WEBHOOK_SECRET"),
    PRO_PRICE_ID: required("STRIPE_PRO_PRICE_ID"),
  },

  /** ======================
   *  EMAIL
   *  ====================== */
  EMAIL: {
    USER: required("EMAIL_USER"),
    PASS: required("EMAIL_PASS"),
  },

  /** ======================
   *  AWS
   *  ====================== */

  AWS: {
    ACCESS_KEY_ID: required("AWS_ACCESS_KEY_ID"),
    SECRET_ACCESS_KEY: required("AWS_SECRET_ACCESS_KEY"),
    REGION: required("AWS_REGION"),
    S3_BUCKET_NAME: required("AWS_S3_BUCKET_NAME"),
  },

  /** ======================
   *  META OAUTH
   *  ====================== */
  META: {
    APP_ID: required("META_APP_ID"),
    APP_SECRET: required("META_APP_SECRET"),
    REDIRECT_URI: required("META_REDIRECT_URI"),
  },

  /** ======================
   *  THREADS OAUTH
   *  ====================== */

  THREADS: {
    APP_ID: required("THREADS_APP_ID"),
    APP_SECRET: required("THREADS_APP_SECRET"),
    REDIRECT_URI: required("THREADS_REDIRECT_URI"),
  },

  /** ======================
   *  TUMBLR OAUTH
   *  ====================== */

  TUMBLR: {
    CONSUMER_KEY: required("TUMBLR_CONSUMER_KEY"),
    CONSUMER_SECRET: required("TUMBLR_CONSUMER_SECRET"),
  },

  /** ======================
   *  MASTODON OAUTH (mastodon.social)
   *  ====================== */
  MASTODON: {
    CLIENT_KEY: required("MASTODON_CLIENT_KEY"),
    CLIENT_SECRET: required("MASTODON_CLIENT_SECRET"),
    CALLBACK_URL: required("MASTODON_CALLBACK_URL"),
    INSTANCE_URL: required("MASTODON_INSTANCE_URL"),
  },

  RABBITMQ: {
    URL: required("RABBITMQ_URL"),
  },

  GEMINI: {
    API_KEY: required("GEMINI_API_KEY"),
  },

  REDIS: {
    HOST: required("REDIS_HOST"),
    PORT: Number(process.env.REDIS_PORT),
    PASSWORD: process.env.REDIS_PASSWORD,
  },
} as const;
