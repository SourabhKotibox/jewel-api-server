import { Router } from "express";
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";
import { protect, adminOnly, staffWrite } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.get("/", getCategories);
router.get("/:id", getCategory);
router.post("/", protect, adminOnly, staffWrite, upload.single("img"), createCategory);
router.put("/:id", protect, adminOnly, staffWrite, upload.single("img"), updateCategory);
router.delete("/:id", protect, adminOnly, staffWrite, deleteCategory);

export default router;
