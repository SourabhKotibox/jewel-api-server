import { Router } from "express";
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { protect, adminOnly, staffWrite } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.get("/", getProducts);
router.get("/:id", getProduct);
router.post("/", protect, adminOnly, staffWrite, upload.array("images", 8), createProduct);
router.put("/:id", protect, adminOnly, staffWrite, upload.array("images", 8), updateProduct);
router.delete("/:id", protect, adminOnly, staffWrite, deleteProduct);

export default router;
