import { Router } from "express";
import { getToken, saveToken, sendPushToUser } from "../controllers/firebase.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate);
router.post("/save-token", saveToken);
router.get("/get-token", getToken);
router.post("/send-to-all-users", sendPushToUser);

export default router;
