import Router from "express";
import { isAdmin } from "../middleware/admin.middleware";
import { getAllUsers, updateUserPlan } from "../controllers/admin.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();
router.use(authenticate);
router.use(isAdmin);

router.get("/get-all-users", getAllUsers);
router.patch("/update-user-plan/:id", updateUserPlan);

export default router;
