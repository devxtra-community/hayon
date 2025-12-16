import dotenv from "dotenv";
dotenv.config();

/**
 * Enforce required env vars
 **/

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`😭 Missing environment variable: ${key}  ⚠️❗`);
  }
  return value;
};

export const ENV = {
  /** ======================
   *  APP / CORE
   *  ====================== */
  APP: {
    NODE_ENV: process.env.NODE_ENV ?? "development",
    PORT: Number(process.env.PORT ?? 3000),
    FRONTEND_URL: required("FRONTEND_URL"),
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
    WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || "",
  },

  /** ======================
   *  EMAIL
   *  ====================== */
  EMAIL: {
    USER: required("EMAIL_USER"),
    PASS: required("EMAIL_PASS"),
  },

} as const;
