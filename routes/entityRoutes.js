import { createCrudRouter } from "../utils/crudFactory.js";
import { sendCampaign } from "../controllers/campaignController.js";
import { protect, adminOnly, staffWrite } from "../middleware/auth.js";
import Inventory from "../models/Inventory.js";
import Attribute from "../models/Attribute.js";
import Invoice from "../models/Invoice.js";
import Shipment from "../models/Shipment.js";
import Refund from "../models/Refund.js";
import Transaction from "../models/Transaction.js";
import Coupon from "../models/Coupon.js";
import Campaign from "../models/Campaign.js";
import Review from "../models/Review.js";
import CmsPage from "../models/CmsPage.js";
import Faq from "../models/Faq.js";
import BlogPost from "../models/BlogPost.js";
import TaxRate from "../models/TaxRate.js";
import StoreLocation from "../models/StoreLocation.js";
import Testimonial from "../models/Testimonial.js";
import MediaAsset from "../models/MediaAsset.js";
import Locale from "../models/Locale.js";
import Channel from "../models/Channel.js";
import Role from "../models/Role.js";

export const inventoryRoutes = createCrudRouter(Inventory, {
  searchFields: ["name", "sku", "source"],
});

export const attributeRoutes = createCrudRouter(Attribute, {
  searchFields: ["code", "name", "type"],
});

export const invoiceRoutes = createCrudRouter(Invoice, {
  searchFields: ["invoiceNumber", "orderId", "customer"],
  idField: "invoiceNumber",
  mapDoc: (o) => ({ ...o, id: o.invoiceNumber || String(o._id) }),
});

export const shipmentRoutes = createCrudRouter(Shipment, {
  searchFields: ["shipmentNumber", "orderId", "customer", "tracking"],
  idField: "shipmentNumber",
  mapDoc: (o) => ({ ...o, id: o.shipmentNumber || String(o._id) }),
});

export const refundRoutes = createCrudRouter(Refund, {
  searchFields: ["refundNumber", "orderId", "customer"],
  idField: "refundNumber",
  mapDoc: (o) => ({ ...o, id: o.refundNumber || String(o._id) }),
});

export const transactionRoutes = createCrudRouter(Transaction, {
  searchFields: ["txnNumber", "orderId", "gateway"],
  idField: "txnNumber",
  mapDoc: (o) => ({ ...o, id: o.txnNumber || String(o._id) }),
});

export const couponRoutes = createCrudRouter(Coupon, {
  searchFields: ["code", "type"],
});

export const campaignRoutes = createCrudRouter(Campaign, {
  searchFields: ["name", "channel", "audience"],
});
campaignRoutes.post("/:id/send", protect, adminOnly, staffWrite, sendCampaign);

export const reviewRoutes = createCrudRouter(Review, {
  searchFields: ["product", "customer", "title"],
  publicList: false,
});

export const cmsPageRoutes = createCrudRouter(CmsPage, {
  searchFields: ["title", "slug", "metaTitle", "metaKeywords"],
  publicList: true,
  publicGet: true,
  lookupFields: ["slug"],
  publicStatus: "Published",
});

export const faqRoutes = createCrudRouter(Faq, {
  searchFields: ["q", "a"],
  publicList: true,
  publicStatus: "Published",
});

export const blogRoutes = createCrudRouter(BlogPost, {
  searchFields: ["title", "slug", "metaTitle", "metaKeywords"],
  publicList: true,
  publicGet: true,
  lookupFields: ["slug"],
  publicStatus: "Published",
});

export const taxRoutes = createCrudRouter(TaxRate, {
  searchFields: ["name", "country"],
  publicList: true,
});

export const storeRoutes = createCrudRouter(StoreLocation, {
  searchFields: ["city", "state", "address"],
  publicList: true,
});

export const testimonialRoutes = createCrudRouter(Testimonial, {
  searchFields: ["name", "location", "text"],
  publicList: true,
});

export const mediaRoutes = createCrudRouter(MediaAsset, {
  searchFields: ["name", "used", "type"],
});

export const localeRoutes = createCrudRouter(Locale, {
  searchFields: ["code", "name"],
});

export const channelRoutes = createCrudRouter(Channel, {
  searchFields: ["name", "hostname"],
});

export const roleRoutes = createCrudRouter(Role, {
  searchFields: ["name", "permissions"],
});
