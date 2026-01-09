import express from "express";
import { authenticate } from "../middleware/auth.middleware";
import { connectBluesky, disconnectBluesky, findPlatformAccounts } from "../controllers/platform.controller";
import { validate } from "../middleware/validate.middleware";
import { blueskyConnectSchema } from "@hayon/schemas";

import facebookRoutes from "./platforms/facebook.routes";
import threadsRoutes from "./platforms/threads.routes";

const router = express.Router();

router.post("/bluesky/connect", authenticate, validate(blueskyConnectSchema), connectBluesky);
router.delete("/bluesky/disconnect", authenticate, disconnectBluesky);
router.get("/find", authenticate, findPlatformAccounts);

// Use sub-routers
router.use("/facebook", facebookRoutes);
router.use("/threads", threadsRoutes);

export default router;