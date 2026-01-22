import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { createPost, getPostStatus } from "../controllers/post.controller";

const router = Router();

router.use(authenticate);

// Status tracking
router.get("/:postId/status", getPostStatus);
// router.get("/", getUserPosts);
// router.delete("/:postId", cancelPost);
// router.post("/:postId/retry", retryPost);
// router.post("/media/upload", getUploadUrls);
// router.delete("/media/:s3Key", deleteMedia);

export default router;
