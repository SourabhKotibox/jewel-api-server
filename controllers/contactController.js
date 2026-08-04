import ContactMessage from "../models/ContactMessage.js";
import { sendMail, getMailConfig } from "../services/mail.js";

export async function submitContact(req, res, next) {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const phone = String(req.body.phone || "").trim();
    const message = String(req.body.message || "").trim();
    if (!name || !email || !message) {
      return res.status(400).json({ message: "Name, email and message are required" });
    }

    const row = await ContactMessage.create({ name, email, phone, message });

    const cfg = await getMailConfig();
    const to = cfg.adminAlertEmail || cfg.fromEmail;
    await sendMail({
      to,
      subject: `Contact form · ${name}`,
      html: `<p><strong>${name}</strong> &lt;${email}&gt; ${phone ? `· ${phone}` : ""}</p>
        <p>${message.replace(/</g, "&lt;")}</p>`,
      text: `From: ${name} <${email}> ${phone}\n\n${message}`,
    }).catch(() => {});

    res.status(201).json({
      ok: true,
      id: String(row._id),
      message: "Thanks — we received your message and will reply soon.",
    });
  } catch (err) {
    next(err);
  }
}
