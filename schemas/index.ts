export {
  // Base schemas
  emailSchema,
  passwordSchema,
  otpSchema,
  nameSchema,
  timezoneSchema,
  // Auth schemas
  requestOtpSchema,
  verifyOtpSchema,
  signupSchema,
  loginSchema,
  adminLoginSchema,
  sendResetEmailSchema,
  resetPasswordSchema,
  // Types
  type RequestOtpInput,
  type VerifyOtpInput,
  type SignupInput,
  type LoginInput,
  type AdminLoginInput,
  type SendResetEmailInput,
  type ResetPasswordInput,
} from "./auth.schema";

export {
  // Constants
  PLATFORMS,
  PLATFORM_CONSTRAINTS,
  GLOBAL_CONSTRAINTS,
  type PlatformType,
  type PlatformConstraints,
} from "./constants";

export {
  // Platform schemas
  blueskyConnectSchema,
  postContentSchema,
  platformSpecificPostSchema,
  createPlatformPostSchema,
} from "./platform.schema";

// Re-export zod for convenience
export { z } from "zod";

export * from "./types";
