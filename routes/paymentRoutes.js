import { Router } from "express";
import {
  getRazorpayConfig,
  createRazorpayOrder,
  verifyRazorpayPayment,
} from "../controllers/paymentController.js";
import { optionalProtect } from "../middleware/auth.js";

const router = Router();

router.get("/razorpay/config", getRazorpayConfig);
router.post("/razorpay/order", optionalProtect, createRazorpayOrder);
router.post("/razorpay/verify", optionalProtect, verifyRazorpayPayment);

export default router;
