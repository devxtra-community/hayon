export {
  // Base schemas
  emailSchema,
  passwordSchema,
  otpSchema,
  nameSchema,
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
  // Platform schemas
  blueskyConnectSchema,
} from "./platform.schema";

// Re-export zod for convenience
export { z } from "zod";

export * from "./types";
