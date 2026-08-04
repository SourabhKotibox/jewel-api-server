import { Router } from "express";
import { getWishlist, saveWishlist } from "../controllers/wishlistController.js";
import { protect } from "../middleware/auth.js";

const router = Router();
router.get("/", protect, getWishlist);
router.put("/", protect, saveWishlist);
export default router;
