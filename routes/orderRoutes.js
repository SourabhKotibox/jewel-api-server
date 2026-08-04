import { Router } from "express";
import {
  getOrders,
  getMyOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  trackOrder,
  confirmRazorpayPayment,
  cancelPendingOrder,
} from "../controllers/orderController.js";
import { protect, adminOnly, staffWrite, salesWrite, optionalProtect } from "../middleware/auth.js";

const router = Router();

router.get("/track", trackOrder);
router.get("/mine", protect, getMyOrders);
router.get("/", protect, adminOnly, getOrders);
router.get("/:id", protect, getOrder);
router.post("/", optionalProtect, createOrder);
router.post("/:id/confirm-payment", optionalProtect, confirmRazorpayPayment);
router.post("/:id/cancel-pending", optionalProtect, cancelPendingOrder);
router.put("/:id", protect, adminOnly, salesWrite, updateOrder);
router.delete("/:id", protect, adminOnly, staffWrite, deleteOrder);

export default router;
