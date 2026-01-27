import express from "express";
import { authenticate } from "../../middleware/auth.middleware";
import {
  connectFacebook,
  disconnectFacebook,
  facebookCallback,
  refreshFacebookProfile,
} from "../../controllers/platforms/facebook.controller";

const router = express.Router();

router.get("/connect", authenticate, connectFacebook);
router.get("/callback", facebookCallback);
router.delete("/disconnect", authenticate, disconnectFacebook);
router.get("/refresh", authenticate, refreshFacebookProfile);

export default router;
