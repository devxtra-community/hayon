import express from "express";
import {
  connectTumblr,
  tumblrCallback,
  disconnectTumblr,
} from "../../controllers/platforms/tumblr.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = express.Router();

// connection routes
router.get("/connect", authenticate, connectTumblr);
router.get("/callback", tumblrCallback);
router.delete("/disconnect", authenticate, disconnectTumblr);

export default router;
