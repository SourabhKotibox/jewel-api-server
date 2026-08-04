import Subscriber from "../models/Subscriber.js";

/** Public footer / storefront newsletter signup */
export async function subscribeNewsletter(req, res, next) {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const name = String(req.body.name || "").trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Valid email is required" });
    }

    const existing = await Subscriber.findOne({ email });
    if (existing) {
      if (existing.status === "Unsubscribed") {
        existing.status = "Subscribed";
        existing.date = new Date().toISOString().slice(0, 10);
        if (name) existing.name = name;
        await existing.save();
        return res.json({
          ok: true,
          message: "Welcome back — you are subscribed again.",
          id: existing._id,
        });
      }
      return res.json({
        ok: true,
        message: "You are already on our list.",
        already: true,
        id: existing._id,
      });
    }

    const row = await Subscriber.create({
      email,
      name,
      status: "Subscribed",
      date: new Date().toISOString().slice(0, 10),
    });

    res.status(201).json({
      ok: true,
      message: "Thank you for joining. Exclusive updates are on the way.",
      id: row._id,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.json({ ok: true, message: "You are already on our list.", already: true });
    }
    next(err);
  }
}
