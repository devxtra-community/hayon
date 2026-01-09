import express from "express";
import { validate } from "../../middleware/validate.middleware";
import { blueskyConnectSchema } from "@hayon/schemas";
import { authenticate } from "../../middleware/auth.middleware";
import { connectBluesky, disconnectBluesky } from "../../controllers/platforms/bluesky.controller";

const router = express.Router();

// connection routes
router.post("/connect", authenticate, validate(blueskyConnectSchema), connectBluesky);
router.delete("/disconnect", authenticate, disconnectBluesky);

export default router;
