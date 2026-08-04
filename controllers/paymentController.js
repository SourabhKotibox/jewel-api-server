import crypto from "crypto";
import Razorpay from "razorpay";
import Order from "../models/Order.js";
import { getPaymentsConfig } from "../services/settingsCache.js";
import { priceCheckoutOrder } from "../utils/checkoutPricing.js";

async function getRazorpayClient() {
  const payments = await getPaymentsConfig();
  const rz = payments.razorpay || {};
  const key_id = rz.keyId || process.env.RAZORPAY_KEY_ID || "";
  const key_secret = rz.keySecret || process.env.RAZORPAY_KEY_SECRET || "";
  if (!key_id || !key_secret) {
    return { client: null, key_id, key_secret, demo: true };
  }
  return {
    client: new Razorpay({ key_id, key_secret }),
    key_id,
    key_secret,
    demo: false,
  };
}

/** Public — return only publishable key id + enabled flag */
export async function getRazorpayConfig(req, res, next) {
  try {
    const payments = await getPaymentsConfig();
    const rz = payments.razorpay || {};
    const { key_id, demo } = await getRazorpayClient();
    res.json({
      keyId: key_id || "",
      demo,
      enabled: rz.enabled !== false,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Create Razorpay order using server-priced amount only.
 * Prefer existing pending Order via orderNumber; else price from cart body.
 */
export async function createRazorpayOrder(req, res, next) {
  try {
    const payments = await getPaymentsConfig();
    if (payments?.razorpay?.enabled === false) {
      return res.status(400).json({ message: "Razorpay is disabled", enabled: false });
    }

    let amountInr = 0;
    let receipt = req.body.receipt || `rcpt_${Date.now()}`;
    let notes = { ...(req.body.notes || {}) };

    const orderNumber = String(req.body.orderNumber || notes.orderNumber || "").trim();
    if (orderNumber) {
      const order = await Order.findOne({ orderNumber });
      if (!order) return res.status(404).json({ message: "Order not found" });
      if (String(order.paymentMethod || "").toLowerCase() !== "razorpay") {
        return res.status(400).json({ message: "Order is not a Razorpay checkout" });
      }
      if (order.payment === "Paid" || (order.payment === "Partial" && order.paymentId)) {
        return res.status(400).json({ message: "Order already paid" });
      }
      if (order.status === "Cancelled") {
        return res.status(400).json({ message: "Order cancelled" });
      }
      amountInr = Number(order.advancePaid) || 0;
      receipt = order.orderNumber;
      notes.orderNumber = order.orderNumber;
    } else if (Array.isArray(req.body.items) && req.body.items.length) {
      let priced;
      try {
        priced = await priceCheckoutOrder({
          ...req.body,
          paymentMethod: "razorpay",
        });
      } catch (priceErr) {
        return res.status(priceErr.status || 400).json({ message: priceErr.message });
      }
      amountInr = Number(priced.advancePaid) || 0;
    } else {
      return res.status(400).json({
        message: "Provide orderNumber (preferred) or cart items to price payment",
      });
    }

    if (!amountInr || amountInr < 1) {
      return res.status(400).json({ message: "Payable amount must be at least ₹1" });
    }

    const { client, key_id, demo } = await getRazorpayClient();
    const amountPaise = Math.round(amountInr * 100);

    if (demo || !client) {
      return res.json({
        demo: true,
        keyId: key_id || "rzp_test_demo",
        orderId: `order_demo_${Date.now()}`,
        amount: amountPaise,
        currency: "INR",
        receipt,
        amountInr,
      });
    }

    const rzOrder = await client.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt,
      notes,
    });

    res.json({
      demo: false,
      keyId: key_id,
      orderId: rzOrder.id,
      amount: rzOrder.amount,
      currency: rzOrder.currency,
      receipt: rzOrder.receipt,
      amountInr,
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyRazorpayPayment(req, res, next) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ message: "Payment details required" });
    }

    const { key_secret, demo } = await getRazorpayClient();

    if (demo) {
      if (!String(razorpay_order_id).startsWith("order_demo_")) {
        return res.status(400).json({ message: "Invalid demo order id" });
      }
      return res.json({
        ok: true,
        demo: true,
        paymentId: razorpay_payment_id || `pay_demo_${Date.now()}`,
        orderId: razorpay_order_id,
      });
    }

    if (String(razorpay_order_id).startsWith("order_demo_")) {
      return res.status(400).json({ message: "Demo payments disabled when keys are configured" });
    }

    if (!razorpay_signature || !key_secret) {
      return res.status(400).json({ message: "Missing signature or secret" });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto.createHmac("sha256", key_secret).update(body).digest("hex");
    if (expected !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    res.json({
      ok: true,
      demo: false,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
    });
  } catch (err) {
    next(err);
  }
}
