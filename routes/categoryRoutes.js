import { Router } from "express";
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleHidden,
} from "../controllers/categoryController.js";

router.get("/", getCategories);
router.get("/:id", getCategory);
router.post("/", protect, adminOnly, staffWrite, upload.single("img"), createCategory);
router.put("/:id", protect, adminOnly, staffWrite, upload.single("img"), updateCategory);
router.delete("/:id", protect, adminOnly, staffWrite, deleteCategory);
router.patch("/:id/hidden", protect, adminOnly, staffWrite, toggleHidden);

export default router;
