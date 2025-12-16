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
} from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";
import { ENV } from "../config/env";


  const router = express.Router();

  router.post("/signup", signup);
  router.post("/login", login);
  router.post("/request-otp", requestOtp);
  router.post("/verify-otp", verifyOtp);
  router.post("/refresh", refresh);

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
  googleOAuthCallback
);


export default router;
