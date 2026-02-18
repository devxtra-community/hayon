import express from "express";
import { authenticate } from "../middleware/auth.middleware";
import * as analyticsController from "../controllers/analytics.controller";

import { rateLimiter } from "../utils/ratelimit";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticate);

router.get("/overview", analyticsController.getOverview);
router.get("/timeline", analyticsController.getTimeline);
router.get("/growth", analyticsController.getGrowth);
router.get("/posts/top", analyticsController.getTopPosts);

// Advanced routes
router.get("/platforms", analyticsController.getPlatformPerformance);
router.get("/heatmap", analyticsController.getHeatmap);

// Manual refresh (Rate limited: 1 request per 15 mins)
router.post(
  "/posts/:postId/refresh",
  rateLimiter("analytics_refresh", 1, 900),
  analyticsController.refreshPostAnalytics,
);

export default router;
