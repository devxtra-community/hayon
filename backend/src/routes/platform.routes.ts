import express from "express";
import { authenticate } from "../middleware/auth.middleware";
import { findPlatformAccounts } from "../controllers/platform.controller";
import tumblrRoutes from "./platforms/tumbler.routes";
import blueskyRoutes from "./platforms/bluesky.routes";

const router = express.Router();

// MIDDLEWARES
router.use("/tumblr", tumblrRoutes);
router.use("/bluesky", blueskyRoutes);

// common
router.get("/find", authenticate, findPlatformAccounts);

export default router;
