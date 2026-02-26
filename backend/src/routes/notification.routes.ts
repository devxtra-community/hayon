import { Router } from "express";
import NotificationController from "../controllers/notification.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate);

router.get("/", NotificationController.getNotifications);
router.patch("/:id/read", NotificationController.markRead);
router.patch("/read-all", NotificationController.markAllRead);

export default router;
