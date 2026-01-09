import express from "express";
import { authenticate } from "../../middleware/auth.middleware";
import {
    connectFacebook,
    facebookCallback,
    disconnectFacebook
} from "../../controllers/platforms/facebook.controller";

const router = express.Router();

router.get("/connect", authenticate, connectFacebook);
router.get("/callback", facebookCallback);
router.delete("/disconnect", authenticate, disconnectFacebook);

export default router;
