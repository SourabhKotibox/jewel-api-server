import { Router } from "express";
import {
  createReturn,
  myReturns,
  listReturns,
  updateReturn,
} from "../controllers/returnController.js";
import { protect, adminOnly, salesWrite } from "../middleware/auth.js";

const router = Router();

router.post("/", protect, createReturn);
router.get("/mine", protect, myReturns);
router.get("/", protect, adminOnly, listReturns);
router.put("/:id", protect, adminOnly, salesWrite, updateReturn);

export default router;
