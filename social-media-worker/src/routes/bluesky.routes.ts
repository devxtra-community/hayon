import express from "express";
import { postToBluesky,postToBlueskyWithImage } from "../controllers/bluesky.controller";
import multer from "multer";

const upload = multer({
  limits: { fileSize: 1 * 1024 * 1024 }, // 1MB (Bluesky limit)
});


const router = express.Router();

router.post("/post", upload.single("image"), postToBluesky);
router.post("/post-with-image", upload.single("image"), postToBlueskyWithImage);
    

export default router;