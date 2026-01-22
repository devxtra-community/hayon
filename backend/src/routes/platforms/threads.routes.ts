import express from "express";
import { authenticate } from "../../middleware/auth.middleware";
import {
  connectThreads,
  threadsCallback,
  disconnectThreads,
  refreshThreadsProfile,
  postToThreads,
} from "../../controllers/platforms/threads.controller";

const router = express.Router();

router.get("/connect", authenticate, connectThreads);
router.get("/callback", threadsCallback);
router.delete("/disconnect", authenticate, disconnectThreads);
router.get("/refresh", authenticate, refreshThreadsProfile);
router.post("/post", authenticate, postToThreads);

export default router;
