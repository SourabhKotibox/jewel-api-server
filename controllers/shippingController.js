import Order from "../models/Order.js";
import {
  trackByAwb,
  createShipment,
  shiprocketConfigured,
} from "../services/shiprocket.js";
import { upsertShipmentForOrder } from "../utils/orderSales.js";
import { notifyOrderStatus } from "../services/mail.js";

export async function shiprocketStatus(req, res, next) {
  try {
    const ok = await shiprocketConfigured();
    res.json({ configured: ok });
  } catch (err) {
    next(err);
  }
}

/** Public track via AWB or order number */
export async function trackShipment(req, res, next) {
  try {
    const awb = String(req.query.awb || "").trim();
    const orderNumber = String(req.query.orderNumber || req.query.order || "").trim();

    let order = null;
    if (orderNumber) {
      order = await Order.findOne({ orderNumber });
    }
    const trackingAwb = awb || order?.awb;
    if (!trackingAwb) {
      return res.status(400).json({
        message: "AWB or order with Shiprocket AWB required",
        order: order
          ? {
              orderNumber: order.orderNumber,
              status: order.status,
              awb: order.awb,
              courier: order.courier,
              trackingUrl: order.trackingUrl,
            }
          : null,
      });
    }

    try {
      const configured = await shiprocketConfigured();
      if (!configured) {
        return res.json({
          source: "local",
          awb: trackingAwb,
          courier: order?.courier || "",
          trackingUrl: order?.trackingUrl || "",
          status: order?.status || "Processing",
          activities: [
            {
              date: order?.updatedAt || order?.createdAt,
              activity: order?.status || "Order in progress",
              location: "",
            },
          ],
        });
      }

      const data = await trackByAwb(trackingAwb);
      const tracking = data.tracking_data || data;
      res.json({
        source: "shiprocket",
        awb: trackingAwb,
        courier: order?.courier || tracking?.shipment_track?.[0]?.courier_name || "",
        trackingUrl: order?.trackingUrl || tracking?.track_url || "",
        status: tracking?.shipment_status || order?.status,
        raw: tracking,
        activities: (tracking?.shipment_track_activities || []).map((a) => ({
          date: a.date,
          activity: a.activity,
          location: a.location,
        })),
      });
    } catch (err) {
      res.json({
        source: "local",
        awb: trackingAwb,
        courier: order?.courier || "",
        trackingUrl: order?.trackingUrl || "",
        status: order?.status || "Processing",
        message: err.message,
        activities: [],
      });
    }
  } catch (err) {
    next(err);
  }
}

/** Admin: push order to Shiprocket */
export async function createShiprocketOrder(req, res, next) {
  try {
    let order = await Order.findOne({ orderNumber: req.params.id });
    if (!order) order = await Order.findById(req.params.id).catch(() => null);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const cfgOk = await shiprocketConfigured();
    if (!cfgOk) {
      return res.status(400).json({ message: "Configure Shiprocket in Settings first" });
    }

    const [firstName, ...rest] = String(order.customer || "Customer").split(" ");
    const payload = {
      order_id: order.orderNumber,
      order_date: new Date(order.createdAt).toISOString().slice(0, 10),
      pickup_location: req.body.pickup_location || "Primary",
      billing_customer_name: firstName || "Customer",
      billing_last_name: rest.join(" ") || ".",
      billing_address: order.address || "Address",
      billing_city: req.body.city || "Jaipur",
      billing_pincode: req.body.pincode || "302001",
      billing_state: req.body.state || "Rajasthan",
      billing_country: "India",
      billing_email: order.email || "orders@madhujewellery.com",
      billing_phone: order.phone || "9999999999",
      shipping_is_billing: true,
      order_items: (order.items || []).map((i) => ({
        name: i.name,
        sku: i.productId || i.name,
        units: i.qty || 1,
        selling_price: i.price,
      })),
      payment_method: order.paymentMethod === "cod" ? "COD" : "Prepaid",
      sub_total: order.subtotal || order.total,
      length: req.body.length || 10,
      breadth: req.body.breadth || 10,
      height: req.body.height || 5,
      weight: req.body.weight || 0.5,
    };

    const data = await createShipment(payload);
    order.shiprocketOrderId = String(data.order_id || data.order_id || "");
    order.shiprocketShipmentId = String(data.shipment_id || "");
    if (data.awb_code) order.awb = String(data.awb_code);
    if (data.courier_name) order.courier = String(data.courier_name);
    if (data.tracking_url || data.awb_code) {
      order.trackingUrl =
        data.tracking_url ||
        `https://shiprocket.co/tracking/${data.awb_code || order.awb}`;
    }
    if (order.status === "Pending") order.status = "Processing";
    await order.save();

    try {
      await upsertShipmentForOrder(order, { status: order.awb ? "In Transit" : "Pending" });
    } catch (e) {
      console.error("Shipment sync failed:", e.message);
    }

    if (order.status === "Shipped" || order.awb) {
      notifyOrderStatus(order, "Shipped").catch(() => {});
    }

    res.json({
      ok: true,
      order: {
        orderNumber: order.orderNumber,
        awb: order.awb,
        courier: order.courier,
        shiprocketOrderId: order.shiprocketOrderId,
        shiprocketShipmentId: order.shiprocketShipmentId,
        trackingUrl: order.trackingUrl,
        status: order.status,
      },
      shiprocket: data,
    });
  } catch (err) {
    next(err);
  }
}
