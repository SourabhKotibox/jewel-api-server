import Invoice from "../models/Invoice.js";
import Transaction from "../models/Transaction.js";
import Shipment from "../models/Shipment.js";

function stamp() {
  return Date.now().toString().slice(-6);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

/** Create invoice + payment transaction after a successful sale */
export async function createSaleDocuments(order) {
  const orderId = order.orderNumber;
  const date = today();
  const amount = Number(order.advancePaid || order.total || 0);
  const invoiceStatus =
    order.payment === "Paid" ? "Paid" : order.payment === "Partial" ? "Partial" : "Pending";

  let invoice = await Invoice.findOne({ orderId });
  if (!invoice) {
    invoice = await Invoice.create({
      invoiceNumber: `INV-${stamp()}`,
      orderId,
      customer: order.customer || "Customer",
      date,
      amount: Number(order.total) || amount,
      status: invoiceStatus,
    });
  }

  const method = String(order.paymentMethod || "").toLowerCase();
  const gateway = method === "cod" || method === "cash on delivery" ? "COD" : "Razorpay";
  const txnStatus =
    order.payment === "Paid" || order.payment === "Partial"
      ? "Success"
      : order.payment === "Refunded"
      ? "Refunded"
      : "Pending";

  let transaction = await Transaction.findOne({ orderId, gateway });
  if (!transaction) {
    transaction = await Transaction.create({
      txnNumber: `TXN-${stamp()}`,
      orderId,
      gateway,
      method: method || (gateway === "COD" ? "COD" : "Online"),
      amount: amount || Number(order.total) || 0,
      date,
      status: txnStatus,
    });
  }

  return { invoice, transaction };
}

/**
 * After boutique receives remaining balance on a partial order:
 * clear balanceDue, mark Paid, update invoice, log a balance transaction.
 */
export async function recordBalanceReceived(order, { method = "Balance received", gateway = "Bank Transfer" } = {}) {
  const balance = Math.max(0, Number(order.balanceDue) || 0);
  const alreadyPaid = Number(order.advancePaid) || 0;
  const total = Number(order.total) || alreadyPaid + balance;

  order.payment = "Paid";
  order.balanceDue = 0;
  order.advancePaid = alreadyPaid + balance > 0 ? alreadyPaid + balance : total;
  await order.save();

  const date = today();
  const orderId = order.orderNumber;

  await Invoice.findOneAndUpdate(
    { orderId },
    { $set: { status: "Paid", amount: total } },
    { new: true }
  );

  if (balance > 0) {
    const exists = await Transaction.findOne({
      orderId,
      method: /balance/i,
      amount: balance,
    });
    if (!exists) {
      await Transaction.create({
        txnNumber: `TXN-${stamp()}`,
        orderId,
        gateway,
        method,
        amount: balance,
        date,
        status: "Success",
      });
    }
  }

  return order;
}

/** Upsert shipment row when AWB / tracking is known */
export async function upsertShipmentForOrder(order, { status } = {}) {
  if (!order?.orderNumber) return null;
  const tracking = order.awb || order.trackingUrl || "";
  if (!tracking && !order.courier) return null;

  let shipment = await Shipment.findOne({ orderId: order.orderNumber });
  const nextStatus =
    status ||
    (order.status === "Delivered"
      ? "Delivered"
      : order.status === "Shipped" || order.awb
      ? "In Transit"
      : "Pending");

  if (!shipment) {
    shipment = await Shipment.create({
      shipmentNumber: `SHP-${stamp()}`,
      orderId: order.orderNumber,
      customer: order.customer || "Customer",
      carrier: order.courier || "Shiprocket",
      tracking: order.awb || "",
      date: today(),
      status: nextStatus,
    });
  } else {
    if (order.awb) shipment.tracking = order.awb;
    if (order.courier) shipment.carrier = order.courier;
    shipment.status = nextStatus;
    await shipment.save();
  }
  return shipment;
}
