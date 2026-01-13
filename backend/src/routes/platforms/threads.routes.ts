import express from "express";
import { authenticate } from "../../middleware/auth.middleware";
import {
  connectThreads,
  threadsCallback,
  disconnectThreads,
  refreshThreadsProfile,
} from "../../controllers/platforms/threads.controller";

const router = express.Router();

router.get("/connect", authenticate, connectThreads);
router.get("/callback", threadsCallback);
router.delete("/disconnect", authenticate, disconnectThreads);
router.get("/refresh", authenticate, refreshThreadsProfile);

export default router;
