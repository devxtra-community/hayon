import express from "express";
import { validate } from "../../middleware/validate.middleware";
import { blueskyConnectSchema } from "@hayon/schemas";
import { authenticate } from "../../middleware/auth.middleware";
import {
  connectBluesky,
  disconnectBluesky,
  postToBluesky,
  refreshBlueskyProfile,
} from "../../controllers/platforms/bluesky.controller";

const router = express.Router();

router.post("/connect", authenticate, validate(blueskyConnectSchema), connectBluesky);
router.get("/refresh", authenticate, refreshBlueskyProfile);
router.delete("/disconnect", authenticate, disconnectBluesky);
router.post("/post", postToBluesky);

export default router;
