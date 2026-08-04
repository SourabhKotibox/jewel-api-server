import Order from "../models/Order.js";
import OrderMessage from "../models/OrderMessage.js";
import { ADMIN_ROLES } from "../middleware/auth.js";

async function canAccessOrder(req, orderNumber) {
  const order = await Order.findOne({ orderNumber });
  if (!order) return { ok: false, status: 404, message: "Order not found" };
  const isAdmin = req.user && ADMIN_ROLES.includes(req.user.role) && req.portal === "admin";
  const isOwner =
    req.user &&
    (String(order.user) === String(req.user._id) ||
      String(order.email || "").toLowerCase() === String(req.user.email || "").toLowerCase());
  if (!isAdmin && !isOwner) {
    return { ok: false, status: 403, message: "Not allowed" };
  }
  return { ok: true, order, isAdmin };
}

export async function listMessages(req, res, next) {
  try {
    const orderNumber = req.params.orderNumber;
    const access = await canAccessOrder(req, orderNumber);
    if (!access.ok) return res.status(access.status).json({ message: access.message });

    const messages = await OrderMessage.find({ orderNumber }).sort({ createdAt: 1 }).limit(200);
    if (access.isAdmin) {
      await OrderMessage.updateMany(
        { orderNumber, readByAdmin: false },
        { $set: { readByAdmin: true } }
      );
    } else {
      await OrderMessage.updateMany(
        { orderNumber, readByCustomer: false },
        { $set: { readByCustomer: true } }
      );
    }
    res.json(messages);
  } catch (err) {
    next(err);
  }
}

export async function postMessage(req, res, next) {
  try {
    const orderNumber = req.params.orderNumber;
    const text = String(req.body.message || "").trim();
    if (!text) return res.status(400).json({ message: "Message required" });

    const access = await canAccessOrder(req, orderNumber);
    if (!access.ok) return res.status(access.status).json({ message: access.message });

    const isAdmin = access.isAdmin;
    const msg = await OrderMessage.create({
      orderNumber,
      senderId: req.user._id,
      senderName: req.user.name || (isAdmin ? "Boutique" : "Customer"),
      senderRole: isAdmin ? "admin" : "customer",
      message: text,
      readByAdmin: isAdmin,
      readByCustomer: !isAdmin,
    });

    const io = req.app.get("io");
    if (io) {
      io.to(`order:${orderNumber}`).emit("order_message", msg);
      io.to("admin_inbox").emit("order_chat_ping", {
        orderNumber,
        preview: text.slice(0, 80),
        senderRole: msg.senderRole,
        at: msg.createdAt,
      });
    }

    res.status(201).json(msg);
  } catch (err) {
    next(err);
  }
}

/** Admin: list conversations with unread */
export async function listConversations(req, res, next) {
  try {
    const rows = await OrderMessage.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$orderNumber",
          lastMessage: { $first: "$message" },
          lastAt: { $first: "$createdAt" },
          lastRole: { $first: "$senderRole" },
          unread: {
            $sum: { $cond: [{ $eq: ["$readByAdmin", false] }, 1, 0] },
          },
        },
      },
      { $sort: { lastAt: -1 } },
      { $limit: 50 },
    ]);
    const orderNumbers = rows.map((r) => r._id);
    const orders = await Order.find({ orderNumber: { $in: orderNumbers } })
      .select("orderNumber customer email phone total status payment paymentMethod createdAt items")
      .lean();
    const byNum = Object.fromEntries(orders.map((o) => [o.orderNumber, o]));

    res.json(
      rows.map((r) => {
        const o = byNum[r._id] || {};
        return {
          orderNumber: r._id,
          lastMessage: r.lastMessage,
          lastAt: r.lastAt,
          lastRole: r.lastRole,
          unread: r.unread,
          customer: o.customer || "",
          email: o.email || "",
          phone: o.phone || "",
          total: o.total,
          status: o.status || "",
          payment: o.payment || "",
          paymentMethod: o.paymentMethod || "",
          itemCount: Array.isArray(o.items) ? o.items.length : 0,
        };
      })
    );
  } catch (err) {
    next(err);
  }
}
