import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import http from "http";
import { fileURLToPath } from "url";
import fs from "fs";

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import shippingRoutes from "./routes/shippingRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import returnRoutes from "./routes/returnRoutes.js";
import addressRoutes from "./routes/addressRoutes.js";
import newsletterRoutes from "./routes/newsletterRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import { validateCoupon } from "./controllers/couponController.js";
import { getCatalogMeta } from "./controllers/catalogController.js";
import { listProductReviews, submitProductReview } from "./controllers/reviewPublicController.js";
import { protect } from "./middleware/auth.js";
import { attachSocket } from "./socket.js";
import {
  inventoryRoutes,
  attributeRoutes,
  invoiceRoutes,
  shipmentRoutes,
  refundRoutes,
  transactionRoutes,
  couponRoutes,
  campaignRoutes,
  reviewRoutes,
  cmsPageRoutes,
  faqRoutes,
  blogRoutes,
  taxRoutes,
  storeRoutes,
  testimonialRoutes,
  mediaRoutes,
  localeRoutes,
  channelRoutes,
  roleRoutes,
  jewelryTypeRoutes,
} from "./routes/entityRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { UPLOAD_DIR } from "./middleware/upload.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/madhu_jewellery";

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(UPLOAD_DIR));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "madhu-api",
    mongo: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    time: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/products", productRoutes);
app.get("/api/catalog/meta", getCatalogMeta);
app.use("/api/orders", orderRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/shipping", shippingRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/returns", returnRoutes);
app.use("/api/addresses", addressRoutes);
app.post("/api/coupons/validate", validateCoupon);

app.use("/api/inventory", inventoryRoutes);
app.use("/api/attributes", attributeRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/shipments", shipmentRoutes);
app.use("/api/refunds", refundRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/contact", contactRoutes);
app.get("/api/reviews/product/:productId", listProductReviews);
app.post("/api/reviews/submit", protect, submitProductReview);
app.use("/api/cms-pages", cmsPageRoutes);
app.use("/api/dynamic-pages", cmsPageRoutes);
app.use("/api/faqs", faqRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/taxes", taxRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/locales", localeRoutes);
app.use("/api/channels", channelRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/jewelry-types", jewelryTypeRoutes);

const frontendDist = path.join(__dirname, "..", "frontend", "dist");
if (fs.existsSync(frontendDist)) {
  app.use("/jewel", express.static(frontendDist));
  app.get("/jewel/*", (req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

app.use(errorHandler);

const httpServer = http.createServer(app);
attachSocket(httpServer, app);

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected:", MONGO_URI);
  } catch (err) {
    console.warn("⚠️  MongoDB not available — API will start but DB routes will fail until Mongo runs.");
    console.warn("   ", err.message);
  }

  httpServer.listen(PORT, () => {
    console.log(`🚀 Madhu API running on http://localhost:${PORT}`);
    console.log(`🔌 Socket.io ready`);
  });
}

start();

export default app;
