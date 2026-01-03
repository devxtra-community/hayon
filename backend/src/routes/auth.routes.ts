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
} from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";
import { ENV } from "../config/env";
import logger from "../utils/logger";
// import { logoutAllService } from "../services/auth.service";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/request-otp", requestOtp);
router.post("/verify-otp", verifyOtp);
router.post("/refresh", refresh);

router.get("/me", authenticate, getCurrentUser);
router.post("/send-reset-email", sendRsetPasswordEmail);
router.post("/reset-password", resetPassword);

// Logout user
router.delete("/logout", logout);
router.delete("/logout/all", authenticate, logoutAll);

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



export default router;
