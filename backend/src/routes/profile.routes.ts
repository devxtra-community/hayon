import express from "express";
import {
  changeTimezoneController,
  deleteProfileController,
  updateProfileController,
} from "../controllers/profile.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = express.Router();

router.put("/update-avatar", authenticate, updateProfileController);
router.delete("/delete-avatar", authenticate, deleteProfileController);
router.put("/change-timezone", authenticate, changeTimezoneController);

export default router;
