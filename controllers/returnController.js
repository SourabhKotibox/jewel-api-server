import ReturnRequest from "../models/ReturnRequest.js";
import Refund from "../models/Refund.js";
import Order from "../models/Order.js";
import { ADMIN_ROLES } from "../middleware/auth.js";
import { restockOrder } from "../utils/orderInventory.js";

function mapReturn(r) {
  const o = r.toObject ? r.toObject() : r;
  return { ...o, id: o.returnNumber || String(o._id) };
}

export async function createReturn(req, res, next) {
  try {
    const orderNumber = String(req.body.orderNumber || "").trim();
    const reason = String(req.body.reason || "").trim();
    if (!orderNumber || !reason) {
      return res.status(400).json({ message: "Order number and reason required" });
    }

    const order = await Order.findOne({ orderNumber });
    if (!order) return res.status(404).json({ message: "Order not found" });

    const isAdmin = req.user && ADMIN_ROLES.includes(req.user.role);
    const isOwner =
      req.user &&
      (String(order.user) === String(req.user._id) ||
        String(order.email || "").toLowerCase() === String(req.user.email || "").toLowerCase());
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: "Not your order" });
    }

    if (!["Delivered", "Shipped"].includes(order.status)) {
      return res.status(400).json({
        message: "Returns are available after the order is shipped or delivered",
      });
    }

    const existing = await ReturnRequest.findOne({
      orderNumber,
      status: { $in: ["Requested", "Approved", "Received"] },
    });
    if (existing) {
      return res.status(400).json({ message: "A return request is already open for this order" });
    }

    const amount = Number(req.body.amount) || Number(order.total) || 0;
    const doc = await ReturnRequest.create({
      returnNumber: `RET-${Date.now().toString().slice(-6)}`,
      orderNumber,
      user: order.user || req.user?._id,
      email: order.email,
      customer: order.customer,
      type: req.body.type || "Return",
      reason,
      notes: req.body.notes || "",
      amount,
      items: order.items || [],
      status: "Requested",
      restock: req.body.restock !== false,
    });

    res.status(201).json(mapReturn(doc));
  } catch (err) {
    next(err);
  }
}

export async function myReturns(req, res, next) {
  try {
    const rows = await ReturnRequest.find({
      $or: [{ user: req.user._id }, { email: req.user.email }],
    }).sort({ createdAt: -1 });
    res.json(rows.map(mapReturn));
  } catch (err) {
    next(err);
  }
}

export async function listReturns(req, res, next) {
  try {
    const rows = await ReturnRequest.find().sort({ createdAt: -1 });
    res.json(rows.map(mapReturn));
  } catch (err) {
    next(err);
  }
}

export async function updateReturn(req, res, next) {
  try {
    const doc =
      (await ReturnRequest.findOne({ returnNumber: req.params.id })) ||
      (await ReturnRequest.findById(req.params.id).catch(() => null));
    if (!doc) return res.status(404).json({ message: "Return not found" });

    const prev = doc.status;
    if (req.body.status) doc.status = req.body.status;
    if (req.body.notes != null) doc.notes = req.body.notes;
    if (req.body.restock != null) doc.restock = !!req.body.restock;
    await doc.save();

    // Approve / Refunded → create refund + restock + update order payment
    if (
      ["Approved", "Refunded"].includes(doc.status) &&
      prev !== doc.status
    ) {
      const order = await Order.findOne({ orderNumber: doc.orderNumber });
      if (doc.status === "Refunded" || doc.status === "Approved") {
        let refund = await Refund.findOne({ returnNumber: doc.returnNumber });
        if (!refund) {
          refund = await Refund.create({
            refundNumber: `REF-${Date.now().toString().slice(-6)}`,
            orderId: doc.orderNumber,
            orderNumber: doc.orderNumber,
            returnNumber: doc.returnNumber,
            customer: doc.customer || "Customer",
            email: doc.email || "",
            amount: doc.amount,
            reason: doc.reason,
            status: doc.status === "Refunded" ? "Refunded" : "Pending",
          });
          doc.refundId = refund.refundNumber;
          await doc.save();
        } else if (doc.status === "Refunded") {
          refund.status = "Refunded";
          await refund.save();
        }

        if (doc.restock && order && !order.inventoryRestocked) {
          await restockOrder(order);
          if (refund) {
            refund.restocked = true;
            await refund.save();
          }
        }

        if (doc.status === "Refunded" && order) {
          order.payment = "Refunded";
          await order.save();
        }
      }
    }

    if (doc.status === "Rejected" && prev !== "Rejected") {
      // no inventory change
    }

    res.json(mapReturn(doc));
  } catch (err) {
    next(err);
  }
}
