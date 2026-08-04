import { Router } from "express";
import { createCrudRouter } from "../utils/crudFactory.js";
import Subscriber from "../models/Subscriber.js";
import { subscribeNewsletter } from "../controllers/newsletterController.js";

const router = Router();

/** Public — footer Exclusive Benefits signup */
router.post("/subscribe", subscribeNewsletter);

router.use(
  "/",
  createCrudRouter(Subscriber, {
    searchFields: ["email", "name"],
  })
);

export default router;
