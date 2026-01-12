import express from "express";
import {
  connectTumblr,
  tumblrCallback,
  disconnectTumblr,
  refreshTumblrProfile,
} from "../../controllers/platforms/tumblr.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = express.Router();

// connection routes
router.get("/connect", authenticate, connectTumblr);
router.get("/callback", tumblrCallback);
router.delete("/disconnect", authenticate, disconnectTumblr);
router.get("/refresh", authenticate, refreshTumblrProfile);

export default router;
