import express from "express";
import {
  connectTumblr,
  tumblrCallback,
  disconnectTumblr,
} from "../../controllers/platforms/tumblr.controller";

const router = express.Router();

// connection routes
router.get("/tumblr/connect", connectTumblr);
router.get("/tumblr/callback", tumblrCallback);
router.delete("/tumblr/disconnect", disconnectTumblr);

export default router;
