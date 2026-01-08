import express from "express";
import { authenticate } from "../middleware/auth.middleware";
import { connectBluesky, findPlatformAccounts } from "../controllers/platform.controller";
import { validate } from "../middleware/validate.middleware";
import { blueskyConnectSchema } from "@hayon/schemas";
const router = express.Router();

router.post("/bluesky/connect", authenticate, validate(blueskyConnectSchema), connectBluesky);
router.delete("/bluesky/disconnect", authenticate);
router.get("/find", authenticate, findPlatformAccounts);

export default router;
