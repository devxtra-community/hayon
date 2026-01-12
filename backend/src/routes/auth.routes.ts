import express from "express";
import {
  googleOAuthCallback,
  initiateGoogleLogin,
  handleGoogleCallback,
} from "../controllers/oauth.controller";
import {
  signup,
  login,
  getCurrentUser,
  logout,
  requestOtp,
  verifyOtp,
  refresh,
  logoutAll,
  sendRsetPasswordEmail,
  resetPassword,
  adminLogin,
  getDevices,
  logoutDevice,
} from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

import { validate } from "../middleware/validate.middleware";
import {
  requestOtpSchema,
  verifyOtpSchema,
  signupSchema,
  loginSchema,
  adminLoginSchema,
  sendResetEmailSchema,
  resetPasswordSchema,
} from "@hayon/schemas";

const router = express.Router();

router.post("/signup", validate(signupSchema), signup);
router.post("/login", validate(loginSchema), login);
router.post("/admin-login", validate(adminLoginSchema), adminLogin);
router.post("/request-otp", validate(requestOtpSchema), requestOtp);
router.post("/verify-otp", validate(verifyOtpSchema), verifyOtp);
router.post("/refresh", refresh);

router.get("/me", authenticate, getCurrentUser);
router.post("/send-reset-email", validate(sendResetEmailSchema), sendRsetPasswordEmail);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);

router.delete("/logout", logout);
router.delete("/logout/all", authenticate, logoutAll);

router.get("/devices", authenticate, getDevices);
router.delete("/devices/:tokenId", authenticate, logoutDevice);

router.get("/google", initiateGoogleLogin);

router.get("/google/callback", handleGoogleCallback, googleOAuthCallback);

export default router;
