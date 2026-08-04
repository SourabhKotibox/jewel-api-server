import { Router } from "express";
import {
  userRegister,
  userLogin,
  adminLogin,
  adminRegister,
  me,
  updateProfile,
  listUsers,
  updateUser,
  deleteUser,
  login,
  register,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import { protect, adminOnly, superadminOnly, staffWrite } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

/* —— Storefront (customers) —— */
router.post("/user/register", upload.single("avatar"), userRegister);
router.post("/user/login", userLogin);
router.post("/user/forgot-password", forgotPassword);
router.post("/user/reset-password", resetPassword);
router.get("/user/me", protect, me);
router.put("/user/profile", protect, upload.single("avatar"), updateProfile);

/* —— Admin panel (staff) —— */
router.post("/admin/login", adminLogin);
router.post("/admin/register", protect, adminOnly, superadminOnly, upload.single("avatar"), adminRegister);
router.get("/admin/me", protect, adminOnly, me);
router.put("/admin/profile", protect, adminOnly, upload.single("avatar"), updateProfile);
router.get("/admin/users", protect, adminOnly, listUsers);
router.put("/admin/users/:id", protect, adminOnly, staffWrite, upload.single("avatar"), updateUser);
router.delete("/admin/users/:id", protect, adminOnly, superadminOnly, deleteUser);

/* —— Legacy (auto-detect portal) —— */
router.post("/register", upload.single("avatar"), register);
router.post("/login", login);
router.get("/me", protect, me);
router.put("/profile", protect, upload.single("avatar"), updateProfile);
router.get("/users", protect, adminOnly, listUsers);

export default router;
