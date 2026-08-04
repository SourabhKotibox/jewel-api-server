import { Router } from "express";
import {
  getSettings,
  getSettingsAdmin,
  upsertSetting,
  bulkUpsertSettings,
  putMetalRates,
  deleteSetting,
} from "../controllers/settingsController.js";
import { protect, adminOnly, staffWrite } from "../middleware/auth.js";

const router = Router();

router.get("/", getSettings);
router.get("/admin", protect, adminOnly, getSettingsAdmin);
router.put("/", protect, adminOnly, staffWrite, upsertSetting);
router.put("/bulk", protect, adminOnly, staffWrite, bulkUpsertSettings);
router.put("/metal-rates", protect, adminOnly, staffWrite, putMetalRates);
router.delete("/:key", protect, adminOnly, staffWrite, deleteSetting);

export default router;
