import express from "express";
import passport from "passport";
import {
  signup,
  login,
  getCurrentUser,
  logout,
  requestOtp,
  verifyOtp,
} from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";
import { generateToken } from "../utils/jwt";
import cookieParser from "cookie-parser";
import { ENV } from "../config/env";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/request-otp", requestOtp);
router.post("/verify-otp", verifyOtp);

router.get("/me", authenticate, getCurrentUser);

// Logout user
router.delete("/logout", logout);

// Google OAuth Routes
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${ENV.APP.FRONTEND_URL}/login?error=google_auth_failed`,
  }),
  (req, res) => {
    try {
      const user = req.user as any;

      const token = generateToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      res.cookie("token", token, {
        httpOnly: true,
        secure: ENV.APP.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.redirect(`${ENV.APP.FRONTEND_URL}/auth/callback?success=true`);
    } catch (error) {
      res.redirect(
        `${ENV.APP.FRONTEND_URL}/login?error=token_generation_failed`
      );
    }
  }
);

export default router;
