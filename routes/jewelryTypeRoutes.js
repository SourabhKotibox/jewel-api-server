import { Router } from "express";
import { createCrudRouter } from "../utils/crudFactory.js";
import JewelryType from "../models/JewelryType.js";

const router = createCrudRouter(JewelryType, {
  searchFields: ["name", "slug"],
});

export default router;
