import nodemailer from "nodemailer";
import { getSettingValue } from "./settingsCache.js";

async function getMailConfig() {
  const mail = (await getSettingValue("mail")) || {};
  const notifications = (await getSettingValue("notifications")) || {};
  return {
    host: mail.host || process.env.SMTP_HOST || "",
    port: Number(mail.port || process.env.SMTP_PORT || 587),
    encryption: mail.encryption || "tls",
    username: mail.username || process.env.SMTP_USER || "",
    password: mail.password || process.env.SMTP_PASS || "",
    fromName: mail.fromName || "Madhu Jewellery",
    fromEmail: mail.fromEmail || process.env.SMTP_FROM || "noreply@madhujewellery.com",
    replyTo: mail.replyTo || "",
    orderPlaced: mail.orderPlaced !== false && notifications.orderPlacedEmail !== false,
    orderShipped: mail.orderShipped !== false && notifications.orderShippedEmail !== false,
    orderDelivered: mail.orderDelivered !== false && notifications.orderDeliveredEmail !== false,
    adminAlertEmail: mail.adminAlertEmail || notifications.adminEmail || "",
  };
}

function configured(cfg) {
  return !!(cfg.host && cfg.username && cfg.password);
}

async function sendMail({ to, subject, html, text }) {
  const cfg = await getMailConfig();
  if (!to) return { ok: false, skipped: true, reason: "no recipient" };
  if (!configured(cfg)) {
    console.log(`[mail] skipped (SMTP not configured): ${subject} → ${to}`);
    return { ok: false, skipped: true, reason: "smtp not configured" };
  }

  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465 || cfg.encryption === "ssl",
    auth: { user: cfg.username, pass: cfg.password },
  });

  await transporter.sendMail({
    from: `"${cfg.fromName}" <${cfg.fromEmail}>`,
    replyTo: cfg.replyTo || undefined,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, " "),
  });
  return { ok: true };
}

function money(n) {
  return `₹${Number(n || 0).toLocaleString("en-IN")}`;
}

function orderHtml(order, headline, extra = "") {
  const items = (order.items || [])
    .map(
      (i) =>
        `<tr><td style="padding:8px;border-bottom:1px solid #eee">${i.name}${
          i.qty > 1 ? ` × ${i.qty}` : ""
        }</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${money(
          (i.price || 0) * (i.qty || 1)
        )}</td></tr>`
    )
    .join("");
  const trackHint = order.trackingUrl
    ? `<p><a href="${order.trackingUrl}">Track shipment</a>${
        order.awb ? ` · AWB ${order.awb}` : ""
      }</p>`
    : `<p>Track anytime with order <strong>${order.orderNumber}</strong> and your email on the Track Order page.</p>`;

  return `
  <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#1a1a1a">
    <h1 style="font-size:22px;color:#0f0d0b">${headline}</h1>
    <p>Dear ${order.customer || "Customer"},</p>
    <p>Order <strong>${order.orderNumber}</strong> · ${money(order.total)}</p>
    <p>Payment: ${order.paymentMethod || "—"} · ${order.payment || "—"}</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">${items}</table>
    ${extra}
    ${trackHint}
    <p style="color:#888;font-size:12px;margin-top:24px">Madhu Jewellery</p>
  </div>`;
}

export async function notifyOrderPlaced(order) {
  const cfg = await getMailConfig();
  if (!cfg.orderPlaced) return { skipped: true };
  const result = await sendMail({
    to: order.email,
    subject: `Order confirmed · ${order.orderNumber}`,
    html: orderHtml(order, "Thank you for your order"),
  });
  if (cfg.adminAlertEmail) {
    await sendMail({
      to: cfg.adminAlertEmail,
      subject: `New order ${order.orderNumber}`,
      html: orderHtml(order, "New storefront order"),
    }).catch(() => {});
  }
  return result;
}

export async function notifyOrderStatus(order, status) {
  const cfg = await getMailConfig();
  if (status === "Shipped" && cfg.orderShipped) {
    return sendMail({
      to: order.email,
      subject: `Order shipped · ${order.orderNumber}`,
      html: orderHtml(
        order,
        "Your order is on the way",
        order.awb
          ? `<p>Courier: <strong>${order.courier || "Partner"}</strong> · AWB <strong>${order.awb}</strong></p>`
          : ""
      ),
    });
  }
  if (status === "Delivered" && cfg.orderDelivered) {
    return sendMail({
      to: order.email,
      subject: `Order delivered · ${order.orderNumber}`,
      html: orderHtml(order, "Your order has been delivered"),
    });
  }
  return { skipped: true };
}

export { getMailConfig, sendMail };
