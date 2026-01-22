import express from "express";
import { authenticate } from "../../middleware/auth.middleware";
import {
  connectMastodon,
  mastodonCallback,
  disconnectMastodon,
  refreshMastodonProfile,
  postToMastodon,
} from "../../controllers/platforms/mastodon.controller";

const router = express.Router();

router.get("/connect", authenticate, connectMastodon);
router.get("/callback", mastodonCallback);
router.delete("/disconnect", authenticate, disconnectMastodon);
router.get("/refresh", authenticate, refreshMastodonProfile);
router.post("/post", authenticate, postToMastodon);

export default router;
