import express from "express";
import { authenticate } from "../middleware/auth.middleware";
import { connectBluesky, findPlatformAccounts } from "../controllers/platform.controller";
import { validate } from "../middleware/validate.middleware";
import { blueskyConnectSchema } from "@hayon/schemas";
import passport from "passport";
import { Strategy as TumblrStrategy } from "passport-tumblr";
import { ENV } from "../config/env";
import { tumblrCallback } from "../controllers/platform.controller";

const router = express.Router();

// MIDDLEWARES

// tumblr  strategy
passport.use(
  new TumblrStrategy(
    {
      consumerKey: ENV.TUMBLR.CONSUMER_KEY!,
      consumerSecret: ENV.TUMBLR.CONSUMER_SECRET!,
      callbackURL: `http://localhost:5000/api/platform/tumblr/callback`,
    },
    (token, tokenSecret, profile, done) => {
      return done(null, {
        tumblrId: profile.id,
        username: profile.username,
        accessToken: token,
        accessSecret: tokenSecret,
      });
    },
  ),
);

// common
router.get("/find", authenticate, findPlatformAccounts);

// bluesky
router.post("/bluesky/connect", authenticate, validate(blueskyConnectSchema), connectBluesky);
router.delete("/bluesky/disconnect", authenticate);

// tumblr
router.get("/tumblr/connect", passport.authenticate("tumblr"));
router.get("/tumblr/callback", passport.authenticate("tumblr", { session: false }), tumblrCallback);

export default router;
