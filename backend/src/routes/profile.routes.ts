import express from "express";
import {
  changeNameController,
  changeTimezoneController,
  deleteProfileController,
  getProfileUploadUrlController,
  updateProfileController,
} from "../controllers/profile.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = express.Router();

router.post("/upload-url", authenticate, getProfileUploadUrlController);
router.put("/update-avatar", authenticate, updateProfileController);
router.delete("/delete-avatar", authenticate, deleteProfileController);
router.put("/change-timezone", authenticate, changeTimezoneController);
router.patch("/change-name", authenticate, changeNameController);

export default router;
