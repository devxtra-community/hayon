import express from "express";
import passport from "../config/passport";
import { googleOAuthCallback } from "../controllers/oauth.controller";
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
import { ENV } from "../config/env";
import logger from "../utils/logger";
import { Request, Response, NextFunction } from "express";
// import { AuthenticateCallback } from "passport";
import { connectBluesky } from "../controllers/blueSky.controller";
import { SuccessResponse } from "../utils/responses";

// import { logoutAllService } from "../services/auth.service";

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

// Logout user
router.delete("/logout", logout);
router.delete("/logout/all", authenticate, logoutAll);

// Device management
router.get("/devices", authenticate, getDevices);
router.delete("/devices/:tokenId", authenticate, logoutDevice);

// Google OAuth Routes
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);

router.get(
  "/google/callback",
  (req, res, next) => {
    passport.authenticate("google", { session: false }, (err, user, info) => {
      // ✅ Custom callback to handle errors
      if (err) {
        logger.error("Google OAuth error:", err);
        return res.redirect(`${ENV.APP.FRONTEND_URL}/login?error=google_auth_failed`);
      }

      if (!user) {
        // ✅ Handle specific error messages
        const errorMessage = info?.message || "google_auth_failed";
        return res.redirect(`${ENV.APP.FRONTEND_URL}/login?error=${errorMessage}`);
      }

      req.user = user;
      return next();
    })(req, res, next);
  },
  googleOAuthCallback,
);

router.get(
  "/facebook",
  passport.authenticate("facebook", {
    scope: [
      "pages_show_list",
      "pages_read_engagement",
      "pages_manage_posts",
      "instagram_basic",
      "instagram_content_publish",
    ],
  }),
);

/* FACEBOOK CALLBACK */

router.get(
  "/facebook/callback",
  (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("facebook", { session: false }, (err: any, user: any, info: any) => {
      console.log("🔥 FACEBOOK CALLBACK:", { err, user, info });

      if (err) {
        return res.redirect(`${ENV.APP.FRONTEND_URL}/login?error=facebook_auth_error`);
      }
      if (!info) {
        return res.redirect(`${ENV.APP.FRONTEND_URL}/login?error=got_no_infos`);
      }

      return next();
    });
  },
  (req: Request, res: Response) => {
    console.log("✅ Facebook login success");
    new SuccessResponse("Facebook login successful").send(res);
  },
);

router.post("/bluesky/connect", connectBluesky);

export default router;
