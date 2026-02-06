import { Router } from "express";
import {
  generateCaptions,
  generateCaptionsForSpecificPlatform,
} from "../controllers/generative.controller";
import { authenticate } from "../middleware/auth.middleware";
const router = Router();
router.use(authenticate);

router.post("/captions", generateCaptions);
router.post("/captions/:platform", generateCaptionsForSpecificPlatform);

export default router;
