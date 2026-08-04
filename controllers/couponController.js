import Coupon from "../models/Coupon.js";

function parseEnds(ends) {
  if (!ends) return null;
  const d = new Date(ends);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function computeDiscount(coupon, { subtotal = 0, shipping = 0 } = {}) {
  const type = coupon.type;
  const value = Number(coupon.value) || 0;
  let discount = 0;

  if (type === "Percent") {
    discount = Math.round((subtotal * value) / 100);
    if (coupon.maxDiscount > 0) discount = Math.min(discount, coupon.maxDiscount);
  } else if (type === "Fixed") {
    discount = Math.min(subtotal, value);
  } else if (type === "FreeShipping") {
    discount = shipping;
  } else if (type === "BuyXGetY") {
    // Approximate: value % off when buyQty met (storefront applies simply)
    discount = Math.round((subtotal * value) / 100);
    if (coupon.maxDiscount > 0) discount = Math.min(discount, coupon.maxDiscount);
  } else if (type === "Custom") {
    if (String(coupon.customFormula || "").startsWith("flat:")) {
      const flat = Number(String(coupon.customFormula).split(":")[1]) || value;
      discount = Math.min(subtotal, flat);
    } else {
      discount = Math.round((subtotal * value) / 100);
      if (coupon.maxDiscount > 0) discount = Math.min(discount, coupon.maxDiscount);
    }
  }

  return Math.max(0, Math.min(discount, subtotal + (type === "FreeShipping" ? shipping : 0)));
}

export async function validateCoupon(req, res, next) {
  try {
    const code = String(req.body.code || req.query.code || "")
      .trim()
      .toUpperCase();
    const subtotal = Number(req.body.subtotal || req.query.subtotal || 0);
    const shipping = Number(req.body.shipping || req.query.shipping || 0);

    if (!code) return res.status(400).json({ message: "Coupon code required" });

    const coupon = await Coupon.findOne({ code });
    if (!coupon || coupon.status !== "Active") {
      return res.status(404).json({ message: "Invalid or inactive coupon" });
    }

    const ends = parseEnds(coupon.ends);
    if (ends && ends < new Date()) {
      return res.status(400).json({ message: "Coupon has expired" });
    }
    if (coupon.limit > 0 && coupon.usage >= coupon.limit) {
      return res.status(400).json({ message: "Coupon usage limit reached" });
    }
    if (subtotal < (coupon.minOrder || 0)) {
      return res.status(400).json({
        message: `Minimum order ₹${coupon.minOrder} required`,
      });
    }

    const discount = computeDiscount(coupon, { subtotal, shipping });

    res.json({
      ok: true,
      code: coupon.code,
      name: coupon.name || coupon.code,
      type: coupon.type,
      value: coupon.value,
      discount,
      maxDiscount: coupon.maxDiscount,
      freeShipping: coupon.type === "FreeShipping",
    });
  } catch (err) {
    next(err);
  }
}

export async function redeemCoupon(code) {
  if (!code) return;
  await Coupon.findOneAndUpdate(
    { code: String(code).toUpperCase(), status: "Active" },
    { $inc: { usage: 1 } }
  );
}
