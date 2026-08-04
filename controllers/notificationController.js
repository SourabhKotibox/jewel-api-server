import Order from "../models/Order.js";
import OrderMessage from "../models/OrderMessage.js";
import ReturnRequest from "../models/ReturnRequest.js";

/**
 * Aggregated admin inbox: new orders, unread chats, return requests.
 */
export async function getAdminNotifications(req, res, next) {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [recentOrders, unreadChats, openReturns, pendingOrders] = await Promise.all([
      Order.find({ createdAt: { $gte: since } })
        .sort({ createdAt: -1 })
        .limit(20)
        .select("orderNumber customer email total status payment paymentMethod createdAt")
        .lean(),
      OrderMessage.aggregate([
        { $match: { readByAdmin: false, senderRole: { $ne: "admin" } } },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: "$orderNumber",
            lastMessage: { $first: "$message" },
            lastAt: { $first: "$createdAt" },
            count: { $sum: 1 },
            senderName: { $first: "$senderName" },
          },
        },
        { $sort: { lastAt: -1 } },
        { $limit: 30 },
      ]),
      ReturnRequest.find({
        status: { $in: ["Requested", "Approved"] },
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
      Order.countDocuments({ status: { $in: ["Pending", "Processing"] } }),
    ]);

    const items = [];

    for (const o of recentOrders) {
      items.push({
        id: `order-${o.orderNumber}`,
        type: "order",
        title: `New order ${o.orderNumber}`,
        body: `${o.customer || "Customer"} · ₹${Number(o.total || 0).toLocaleString("en-IN")} · ${o.paymentMethod || o.payment || ""}`,
        href: `/admin/orders/${o.orderNumber}`,
        at: o.createdAt,
        meta: {
          orderNumber: o.orderNumber,
          status: o.status,
          payment: o.payment,
        },
      });
    }

    for (const c of unreadChats) {
      items.push({
        id: `chat-${c._id}`,
        type: "chat",
        title: `Chat · ${c._id}`,
        body: `${c.senderName || "Customer"}: ${c.lastMessage || ""}`,
        href: `/admin/order-support?order=${encodeURIComponent(c._id)}`,
        at: c.lastAt,
        meta: { orderNumber: c._id, unread: c.count },
      });
    }

    for (const r of openReturns) {
      items.push({
        id: `return-${r.returnNumber || r._id}`,
        type: "return",
        title: `Return ${r.returnNumber || ""}`.trim(),
        body: `${r.orderNumber} · ${r.reason || "Return requested"} · ${r.status}`,
        href: `/admin/order-support?return=${encodeURIComponent(r.returnNumber || r._id)}`,
        at: r.createdAt || r.updatedAt,
        meta: {
          orderNumber: r.orderNumber,
          status: r.status,
        },
      });
    }

    items.sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));

    const unreadChatCount = unreadChats.reduce((s, c) => s + (c.count || 0), 0);
    const unread =
      unreadChatCount +
      openReturns.filter((r) => r.status === "Requested").length +
      recentOrders.filter((o) => {
        const age = Date.now() - new Date(o.createdAt).getTime();
        return age < 24 * 60 * 60 * 1000;
      }).length;

    res.json({
      unread,
      pendingOrders,
      unreadChats: unreadChatCount,
      openReturns: openReturns.length,
      items: items.slice(0, 40),
    });
  } catch (err) {
    next(err);
  }
}
