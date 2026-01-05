import express from "express";
import {
  deleteProfileController,
  updateProfileController,
} from "../controllers/profile.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = express.Router();

router.put("/update-avatar", authenticate, updateProfileController);
router.delete("/delete-avatar", authenticate, deleteProfileController);

export default router;
