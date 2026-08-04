import Order from "../models/Order.js";
import Customer from "../models/Customer.js";
import { ADMIN_ROLES } from "../middleware/auth.js";
import { redeemCoupon } from "./couponController.js";
import {
  reserveOrderStock,
  releaseOrderStock,
  applyInventoryForStatus,
} from "../utils/orderInventory.js";
import { createSaleDocuments, upsertShipmentForOrder, recordBalanceReceived } from "../utils/orderSales.js";
import { notifyOrderPlaced, notifyOrderStatus } from "../services/mail.js";
import { priceCheckoutOrder } from "../utils/checkoutPricing.js";
import { verifyRazorpayPayment } from "./paymentController.js";

function canAccessPendingOrder(req, order) {
  if (req.user?._id && order.user && String(order.user) === String(req.user._id)) return true;
  const email = String(req.body?.email || req.query?.email || "").trim().toLowerCase();
  if (email && String(order.email || "").toLowerCase() === email) return true;
  return false;
}

/** Re-run payment verification in-process (no HTTP) */
async function assertRazorpayProof(body) {
  return new Promise((resolve, reject) => {
    const req = { body };
    const res = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        if ((this.statusCode || 200) >= 400) {
          reject(Object.assign(new Error(payload.message || "Payment verification failed"), { status: this.statusCode }));
        } else {
          resolve(payload);
        }
      },
    };
    verifyRazorpayPayment(req, res, (err) => reject(err));
  });
}

function mapOrder(o) {
  const doc = o.toObject ? o.toObject() : o;
  const created = doc.createdAt ? new Date(doc.createdAt) : null;
  const date =
    doc.date ||
    (created && !Number.isNaN(created.getTime())
      ? created.toISOString().slice(0, 10)
      : "");
  const method = String(doc.paymentMethod || "").toLowerCase();
  const paymentLabel =
    method === "cod" || method === "cash on delivery"
      ? "COD"
      : method === "razorpay"
      ? "Razorpay"
      : doc.paymentMethod || "—";

  return {
    ...doc,
    id: doc.orderNumber || String(doc._id),
    _id: doc._id,
    date,
    paymentLabel,
    paymentMethod: doc.paymentMethod || "",
    paymentId: doc.paymentId || "",
    razorpayOrderId: doc.razorpayOrderId || "",
    awb: doc.awb || "",
    courier: doc.courier || "",
    trackingUrl: doc.trackingUrl || "",
  };
}

function normalizeItems(items = []) {
  return items.map((i) => {
    const productId = String(i.productId || i.id || "");
    let variantSku = i.variantSku || "";
    if (!variantSku && productId.includes("::")) {
      variantSku = productId.split("::")[1];
    }
    const image =
      i.image ||
      i.img ||
      (Array.isArray(i.images) ? i.images[0] : "") ||
      "";
    return {
      productId,
      variantSku,
      name: i.name,
      image,
      qty: Number(i.qty || i.quantity || 1),
      price: Number(i.price) || 0,
      paymentType: i.paymentType || "full",
      advanceAmount: Number(i.advanceAmount) || 0,
    };
  });
}

export async function getOrders(req, res, next) {
  try {
    const filter = {};
    if (!ADMIN_ROLES.includes(req.user.role) || req.portal === "user") {
      filter.user = req.user._id;
    }
    if (req.query.status && req.query.status !== "All") filter.status = req.query.status;
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json(orders.map(mapOrder));
  } catch (err) {
    next(err);
  }
}

export async function getMyOrders(req, res, next) {
  try {
    const email = String(req.user.email || "").toLowerCase();
    const filter = email
      ? { $or: [{ user: req.user._id }, { email, user: null }] }
      : { user: req.user._id };
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json(orders.map(mapOrder));
  } catch (err) {
    next(err);
  }
}

export async function getOrder(req, res, next) {
  try {
    let order =
      (await Order.findOne({ orderNumber: req.params.id })) ||
      (await Order.findById(req.params.id).catch(() => null));
    if (!order) return res.status(404).json({ message: "Order not found" });

    const isAdmin = ADMIN_ROLES.includes(req.user.role) && req.portal === "admin";
    if (!isAdmin && String(order.user) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not your order" });
    }
    res.json(mapOrder(order));
  } catch (err) {
    next(err);
  }
}

export async function trackOrder(req, res, next) {
  try {
    const orderNumber = String(req.query.orderNumber || req.query.order || "").trim();
    const email = String(req.query.email || "").trim().toLowerCase();
    if (!orderNumber || !email) {
      return res.status(400).json({ message: "Order number and email are required" });
    }
    const order = await Order.findOne({ orderNumber });
    if (!order || String(order.email || "").toLowerCase() !== email) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json(mapOrder(order));
  } catch (err) {
    next(err);
  }
}

export async function createOrder(req, res, next) {
  try {
    const body = { ...req.body };
    delete body.id;

    // Unique order number — avoid 6-digit collisions
    const orderNumber =
      body.orderNumber && String(body.orderNumber).length > 8
        ? body.orderNumber
        : `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

    let priced;
    try {
      priced = await priceCheckoutOrder({
        ...body,
        state: body.state || (String(body.address || "").match(/,\s*([^,]+)\s*-/) || [])[1],
      });
    } catch (priceErr) {
      return res.status(priceErr.status || 400).json({ message: priceErr.message });
    }

    const method = String(priced.paymentMethod || "").toLowerCase();
    // Razorpay: create Pending + reserve first; attach payment via confirm endpoint
    const awaitingRazorpay = method === "razorpay" && !body.paymentId;
    if (awaitingRazorpay) {
      priced.payment = "Pending";
    }

    const order = await Order.create({
      orderNumber,
      customer: body.customer || req.user?.name || "Customer",
      email: body.email || req.user?.email || "",
      phone: body.phone || "",
      address: body.address || "",
      user: req.user?._id,
      items: priced.items,
      subtotal: priced.subtotal,
      discount: priced.discount,
      couponCode: priced.couponCode,
      shipping: priced.shipping,
      tax: priced.tax,
      taxLabel: priced.taxLabel,
      total: priced.total,
      advancePaid: priced.advancePaid,
      balanceDue: priced.balanceDue,
      paymentType: priced.paymentType,
      payment: priced.payment,
      paymentMethod: priced.paymentMethod,
      paymentId: body.paymentId || "",
      razorpayOrderId: body.razorpayOrderId || "",
      status: "Pending",
    });

    try {
      await reserveOrderStock(order);
    } catch (invErr) {
      await Order.findByIdAndDelete(order._id);
      return res.status(400).json({ message: invErr.message || "Stock unavailable" });
    }

    if (order.couponCode && !awaitingRazorpay) {
      await redeemCoupon(order.couponCode);
    }

    if (awaitingRazorpay) {
      return res.status(201).json({
        ...mapOrder(order),
        awaitingPayment: true,
        amountDueNow: order.advancePaid,
      });
    }

    if (order.user) {
      await Customer.findOneAndUpdate(
        { user: order.user },
        { $inc: { orders: 1, spent: order.total || 0 } }
      );
    }

    try {
      await createSaleDocuments(order);
    } catch (saleErr) {
      console.error("Sale documents failed:", saleErr.message);
    }

    notifyOrderPlaced(order).catch((e) => console.error("Order email failed:", e.message));

    res.status(201).json(mapOrder(order));
  } catch (err) {
    next(err);
  }
}

/** Attach verified Razorpay payment to a pending order */
export async function confirmRazorpayPayment(req, res, next) {
  try {
    const orderNumber = String(req.params.id || req.body.orderNumber || "").trim();
    const paymentId = String(req.body.paymentId || req.body.razorpay_payment_id || "").trim();
    const razorpayOrderId = String(
      req.body.razorpayOrderId || req.body.razorpay_order_id || req.body.orderId || ""
    ).trim();
    const razorpay_signature = String(req.body.razorpay_signature || req.body.signature || "").trim();
    if (!orderNumber || !paymentId || !razorpayOrderId) {
      return res.status(400).json({ message: "orderNumber, paymentId and razorpayOrderId required" });
    }

    // Re-verify signature / demo rules server-side (do not trust client alone)
    try {
      await assertRazorpayProof({
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: razorpay_signature || (String(razorpayOrderId).startsWith("order_demo_") ? "demo" : ""),
      });
    } catch (verErr) {
      return res.status(verErr.status || 400).json({ message: verErr.message || "Invalid payment proof" });
    }

    const order =
      (await Order.findOne({ orderNumber })) ||
      (await Order.findById(orderNumber).catch(() => null));
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (!canAccessPendingOrder(req, order)) {
      return res.status(403).json({ message: "Not allowed to confirm this order" });
    }
    if (String(order.paymentMethod || "").toLowerCase() !== "razorpay") {
      return res.status(400).json({ message: "Not a Razorpay order" });
    }
    if (order.status === "Cancelled") {
      return res.status(400).json({ message: "Order cancelled" });
    }
    if (order.paymentId && (order.payment === "Paid" || order.payment === "Partial")) {
      return res.json(mapOrder(order));
    }

    const amountPaid = Number(order.advancePaid) || 0;
    order.paymentId = paymentId;
    order.razorpayOrderId = razorpayOrderId;
    order.payment =
      Number(order.balanceDue) > 0 || order.paymentType === "partial" ? "Partial" : "Paid";
    await order.save();

    if (order.couponCode) {
      await redeemCoupon(order.couponCode);
    }

    if (order.user) {
      await Customer.findOneAndUpdate(
        { user: order.user },
        { $inc: { orders: 1, spent: order.total || 0 } }
      );
    }

    try {
      await createSaleDocuments(order);
    } catch (saleErr) {
      console.error("Sale documents failed:", saleErr.message);
    }

    notifyOrderPlaced(order).catch((e) => console.error("Order email failed:", e.message));

    res.json({ ...mapOrder(order), confirmed: true, amountPaid });
  } catch (err) {
    next(err);
  }
}

/** Cancel unpaid Razorpay order and release stock */
export async function cancelPendingOrder(req, res, next) {
  try {
    const orderNumber = String(req.params.id || "").trim();
    const order =
      (await Order.findOne({ orderNumber })) ||
      (await Order.findById(orderNumber).catch(() => null));
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (!canAccessPendingOrder(req, order)) {
      return res.status(403).json({ message: "Not allowed to cancel this order" });
    }
    if (order.paymentId || order.payment === "Paid" || order.payment === "Partial") {
      return res.status(400).json({ message: "Paid orders cannot be cancelled here" });
    }
    if (order.status === "Cancelled") {
      return res.json(mapOrder(order));
    }

    await releaseOrderStock(order);
    order.status = "Cancelled";
    await order.save();
    res.json(mapOrder(order));
  } catch (err) {
    next(err);
  }
}

export async function updateOrder(req, res, next) {
  try {
    const body = { ...req.body };
    if (body.id && !body.orderNumber) body.orderNumber = body.id;
    delete body.id;
    if (Array.isArray(body.items)) body.items = normalizeItems(body.items);

    let order =
      (await Order.findOne({ orderNumber: req.params.id })) ||
      (await Order.findById(req.params.id).catch(() => null));
    if (!order) return res.status(404).json({ message: "Order not found" });

    const prevStatus = order.status;
    const prevPayment = order.payment;
    const markBalancePaid = !!body.markBalancePaid;
    delete body.markBalancePaid;

    // Explicit "balance received" OR switching Partial/Pending → Paid with balance due
    const becomingPaid = body.payment === "Paid" && prevPayment !== "Paid";
    const hasOpenBalance =
      Number(order.balanceDue) > 0 ||
      order.payment === "Partial" ||
      order.paymentType === "partial";

    if (markBalancePaid || (becomingPaid && hasOpenBalance)) {
      Object.assign(order, {
        ...body,
        payment: "Paid",
      });
      await order.save();
      await recordBalanceReceived(order, {
        method: body.balancePaymentMethod || "Balance received (manual)",
        gateway: body.balanceGateway || "Bank Transfer",
      });
    } else {
      Object.assign(order, body);
      await order.save();
    }

    if (body.status && body.status !== prevStatus) {
      try {
        await applyInventoryForStatus(order, prevStatus, body.status);
      } catch (invErr) {
        return res.status(400).json({
          message: invErr.message || "Inventory update failed",
          order: mapOrder(order),
        });
      }
      notifyOrderStatus(order, body.status).catch((e) =>
        console.error("Status email failed:", e.message)
      );
    }

    if (order.awb || order.trackingUrl || ["Shipped", "Delivered"].includes(order.status)) {
      try {
        await upsertShipmentForOrder(order);
      } catch (shipErr) {
        console.error("Shipment upsert failed:", shipErr.message);
      }
    }

    order =
      (await Order.findById(order._id)) ||
      (await Order.findOne({ orderNumber: order.orderNumber }));
    res.json(mapOrder(order));
  } catch (err) {
    next(err);
  }
}

export async function deleteOrder(req, res, next) {
  try {
    let order =
      (await Order.findOne({ orderNumber: req.params.id })) ||
      (await Order.findById(req.params.id).catch(() => null));
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status !== "Cancelled") {
      await applyInventoryForStatus(order, order.status, "Cancelled");
    }
    await Order.findByIdAndDelete(order._id);
    res.json({ message: "Order deleted" });
  } catch (err) {
    next(err);
  }
}
