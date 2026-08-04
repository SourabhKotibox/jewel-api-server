import { Router } from "express";
import {
  listMessages,
  postMessage,
  listConversations,
} from "../controllers/chatController.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = Router();

router.get("/conversations", protect, adminOnly, listConversations);
router.get("/:orderNumber", protect, listMessages);
router.post("/:orderNumber", protect, postMessage);

export default router;
