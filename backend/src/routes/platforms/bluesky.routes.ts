import express from "express";
import { validate } from "../../middleware/validate.middleware";
import { blueskyConnectSchema } from "@hayon/schemas";
import { authenticate } from "../../middleware/auth.middleware";
import { connectBluesky } from "../../controllers/platforms/bluesky.controller";

const router = express.Router();

// connection routes
router.post("/bluesky/connect", authenticate, validate(blueskyConnectSchema), connectBluesky);
router.delete("/bluesky/disconnect", authenticate);

export default router;
