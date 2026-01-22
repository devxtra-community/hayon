import express from "express";
import { authenticate } from "../../middleware/auth.middleware";
import {
  connectFacebook,
  disconnectFacebook,
  facebookCallback,
  refreshFacebookProfile,
  postToFacebook,
} from "../../controllers/platforms/facebook.controller";

const router = express.Router();

router.get("/connect", authenticate, connectFacebook);
router.get("/callback", facebookCallback);
router.delete("/disconnect", authenticate, disconnectFacebook);
router.get("/refresh", authenticate, refreshFacebookProfile);
router.post("/post", authenticate, postToFacebook);

export default router;
