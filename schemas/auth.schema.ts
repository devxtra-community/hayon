import { z } from "zod";

// =============================================================================
// Base Schemas (Reusable)
// =============================================================================

/**
 * Email schema with normalization.
 * - Validates email format
 * - Transforms to lowercase
 * - Trims whitespace
 */
export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Please enter a valid email address")
  .toLowerCase()
  .trim();

/**
 * Password schema with minimum length requirement.
 * Used for both signup and password reset.
 */
export const passwordSchema = z
  .string()
  .min(1, "Password is required")
  .min(8, "Password must be at least 8 characters");

/**
 * OTP schema - exactly 6 digits.
 */
export const otpSchema = z
  .string()
  .min(1, "OTP is required")
  .length(6, "OTP must be exactly 6 digits")
  .regex(/^\d{6}$/, "OTP must contain only numbers");

/**
 * Name schema - user's display name.
 */
export const nameSchema = z
  .string()
  .min(1, "Name is required")
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name must be at most 100 characters")
  .trim();

/**
 * Validates that a string is a valid IANA timezone.
 * Uses Intl.DateTimeFormat to check if the timezone is valid.
 * This is more robust than supportedValuesOf as it handles aliases (e.g., Asia/Kolkata vs Asia/Calcutta).
 */
export const timezoneSchema = z.string().refine(
  (tz) => {
    try {
      // If the timezone is not valid, this will throw an error.
      Intl.DateTimeFormat(undefined, { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  },
  {
    message: "Invalid IANA timezone",
  },
);

// =============================================================================
// Auth Endpoint Schemas
// =============================================================================

/**
 * POST /auth/request-otp
 * Request OTP for email verification during signup.
 */
export const requestOtpSchema = z.object({
  email: emailSchema,
});

/**
 * POST /auth/verify-otp
 * Verify OTP sent to user's email.
 */
export const verifyOtpSchema = z.object({
  email: emailSchema,
  otp: otpSchema,
});

/**
 * POST /auth/signup
 * Complete user registration after OTP verification.
 */
export const signupSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
    name: nameSchema,
    avatar: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/**
 * POST /auth/login
 * User login with email and password.
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

/**
 * POST /auth/admin-login
 * Admin login with email and password.
 * Same validation as regular login.
 */
export const adminLoginSchema = loginSchema;

/**
 * POST /auth/send-reset-email
 * Request password reset email.
 */
export const sendResetEmailSchema = z.object({
  email: emailSchema,
});

/**
 * POST /auth/reset-password
 * Reset password using token from email.
 */
export const resetPasswordSchema = z.object({
  email: emailSchema,
  token: z.string().min(1, "Reset token is required"),
  password: passwordSchema,
});

/**
 * PATCH /profile/change-password
 * Change user password.
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  });

// =============================================================================
// Type Exports (for TypeScript consumers)
// =============================================================================

export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type SendResetEmailInput = z.infer<typeof sendResetEmailSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
