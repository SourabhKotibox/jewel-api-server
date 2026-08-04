import { Router } from "express";
import {
  shiprocketStatus,
  trackShipment,
  createShiprocketOrder,
} from "../controllers/shippingController.js";
import { protect, adminOnly, staffWrite } from "../middleware/auth.js";

const router = Router();

router.get("/shiprocket/status", protect, adminOnly, shiprocketStatus);
router.get("/track", trackShipment);
router.post(
  "/shiprocket/orders/:id",
  protect,
  adminOnly,
  staffWrite,
  createShiprocketOrder
);

export default router;
