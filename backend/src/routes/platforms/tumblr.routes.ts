import express from "express";
import {
  connectTumblr,
  tumblrCallback,
  disconnectTumblr,
  refreshTumblrProfile,
  postToTumblr,
} from "../../controllers/platforms/tumblr.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = express.Router();

router.get("/connect", authenticate, connectTumblr);
router.get("/callback", tumblrCallback);
router.delete("/disconnect", authenticate, disconnectTumblr);
router.get("/refresh", authenticate, refreshTumblrProfile);
router.post("/post", authenticate, postToTumblr);

export default router;
