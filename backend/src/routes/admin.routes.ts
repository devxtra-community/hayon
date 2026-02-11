import Router from "express";
import { isAdmin } from "../middleware/admin.middleware";
import {
  getAllUsers,
  updateUserPlan,
  updateUserActivity,
  getAnalytics,
} from "../controllers/admin.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();
router.use(authenticate);
router.use(isAdmin);

router.get("/get-all-users", getAllUsers);
router.patch("/update-user-plan/:id", updateUserPlan);
router.patch("/update-user-activity/:id", updateUserActivity);
router.get("/analytics", getAnalytics);

export default router;
