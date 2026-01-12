import express from "express";
import { authenticate } from "../middleware/auth.middleware";
import { findPlatformAccounts } from "../controllers/platform.controller";
import tumblrRoutes from "./platforms/tumblr.routes";
import blueskyRoutes from "./platforms/bluesky.routes";
import facebookRoutes from "./platforms/facebook.routes";
import threadsRoutes from "./platforms/threads.routes";
import mastodonRoutes from "./platforms/mastodon.routes";

const router = express.Router();
router.use("/tumblr", tumblrRoutes);
router.use("/bluesky", blueskyRoutes);

router.get("/find", authenticate, findPlatformAccounts);

router.use("/facebook", facebookRoutes);
router.use("/threads", threadsRoutes);
router.use("/mastodon", mastodonRoutes);

export default router;
