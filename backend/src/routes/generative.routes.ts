import { Router } from "express";
import {
  generateCaptions,
  generateCaptionsForSpecificPlatform,
} from "../controllers/generative.controller";
import { authenticate } from "../middleware/auth.middleware";
import { checkUserGenerationLimit } from "../middleware/limitChecker.middleware";
import { rateLimiter } from "../utils/ratelimit";

const router = Router();

router.use(authenticate);
router.use(rateLimiter("ai_caption", 50, 3600));
router.use(checkUserGenerationLimit);

router.post("/captions", generateCaptions);
router.post("/captions/:platform", generateCaptionsForSpecificPlatform);

export default router;
