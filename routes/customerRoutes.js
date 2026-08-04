import { Router } from "express";
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customerController.js";
import { protect, adminOnly, staffWrite, salesWrite } from "../middleware/auth.js";

const router = Router();

router.get("/", protect, adminOnly, getCustomers);
router.get("/:id", protect, adminOnly, getCustomer);
router.post("/", protect, adminOnly, salesWrite, createCustomer);
router.put("/:id", protect, adminOnly, salesWrite, updateCustomer);
router.delete("/:id", protect, adminOnly, staffWrite, deleteCustomer);

export default router;
