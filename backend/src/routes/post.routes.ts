import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  createPost,
  getPostStatus,
  getUploadUrls,
  getUserPosts,
  getPostById,
  updatePost,
  deletePost,
  retryPost,
  cancelPost,
} from "../controllers/post.controller";
import { checkUserPostLimit } from "../middleware/limitChecker.middleware";

const router = Router();

router.use(authenticate);

router.get("/", getUserPosts);
router.get("/:postId", getPostById);
router.get("/:postId/status", getPostStatus);
router.post("/", checkUserPostLimit, createPost);
router.put("/:postId", updatePost);
router.delete("/:postId", deletePost);
router.post("/:postId/retry", retryPost);
router.post("/:postId/cancel", cancelPost);
router.post("/media/upload", getUploadUrls);

export default router;
