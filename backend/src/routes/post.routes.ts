import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { createPost, getPostStatus, getUploadUrls } from "../controllers/post.controller";

const router = Router();

router.use(authenticate);

router.get("/:postId/status", getPostStatus);
router.post("/", createPost);

router.post("/media/upload", getUploadUrls);

export default router;
