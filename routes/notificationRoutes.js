import { Router } from "express";
import { getAdminNotifications } from "../controllers/notificationController.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = Router();
router.get("/", protect, adminOnly, getAdminNotifications);
export default router;
