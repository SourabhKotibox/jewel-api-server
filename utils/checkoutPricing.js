/**
 * Server-side order pricing — never trust client totals.
 */
import Product from "../models/Product.js";
import Coupon from "../models/Coupon.js";
import TaxRate from "../models/TaxRate.js";
import { computeDiscount } from "../controllers/couponController.js";
import { getSettingValue, getPaymentsConfig } from "../services/settingsCache.js";
import { mergeMetalRates, resolveProductPrice } from "./metalPricing.js";

function parseTaxPct(row) {
  if (row.rateValue != null && row.rateValue !== "") return Number(row.rateValue) || 0;
  const m = String(row.rate || "").match(/([\d.]+)/);
  return m ? Number(m[1]) : 0;
}

async function resolveProduct(raw) {
  const pid = String(raw.productId || raw.id || "");
  const baseId = pid.includes("::") ? pid.split("::")[0] : pid;
  const variantSku =
    raw.variantSku || (pid.includes("::") ? pid.split("::")[1] : "") || "";

  let product =
    (await Product.findOne({ sku: baseId })) ||
    (await Product.findOne({ slug: baseId })) ||
    (await Product.findById(baseId).catch(() => null));

  if (!product) {
    throw Object.assign(new Error(`Product not found: ${raw.name || baseId}`), {
      status: 400,
    });
  }
  if (product.status === "Draft") {
    throw Object.assign(new Error(`${product.name} is not available`), { status: 400 });
  }

  const rates = mergeMetalRates(await getSettingValue("metalRates", null));
  let unitPrice = resolveProductPrice(product, rates);
  let stock = Number(product.stock) || 0;
  let variantLabel = "";

  if (variantSku && product.variants?.length) {
    const v = product.variants.find((x) => x.sku === variantSku);
    if (!v || v.status === "Draft") {
      throw Object.assign(new Error(`Variant unavailable for ${product.name}`), {
        status: 400,
      });
    }
    // Variants with explicit price override market formula for that SKU
    if (v.price != null && v.price !== "") unitPrice = Number(v.price) || unitPrice;
    stock = Number(v.stock) || 0;
    variantLabel = v.label || "";
  }

  return { product, unitPrice, stock, variantSku, variantLabel, baseId };
}

function computeAdvance(product, unitPrice, paymentsCfg) {
  const defaultPct =
    Number(paymentsCfg?.partialPayment?.advancePercent) > 0
      ? Number(paymentsCfg.partialPayment.advancePercent)
      : 50;
  if (product.splitType === "amount") {
    return Math.min(unitPrice, Math.max(0, Math.round(Number(product.splitValue) || 0)));
  }
  const pct =
    Number.isFinite(Number(product.splitValue)) && Number(product.splitValue) > 0
      ? Number(product.splitValue)
      : defaultPct;
  return Math.min(unitPrice, Math.round(unitPrice * (pct / 100)));
}

/**
 * @param {object} body - client order payload (items + coupon + address hints)
 * @returns priced fields to persist
 */
export async function priceCheckoutOrder(body) {
  const paymentsCfg = await getPaymentsConfig();
  const commerce = (await getSettingValue("commerce", {})) || {};
  const freeThresholdRaw = Number(commerce.freeShippingThreshold);
  const freeThreshold = Number.isFinite(freeThresholdRaw) ? freeThresholdRaw : 200000;
  const flatShipRaw = Number(commerce.flatShippingRate);
  const flatShip = Number.isFinite(flatShipRaw) ? flatShipRaw : 250;

  const partialEnabled = paymentsCfg?.partialPayment?.enabled !== false;
  const rawItems = Array.isArray(body.items) ? body.items : [];
  if (!rawItems.length) {
    throw Object.assign(new Error("Cart is empty"), { status: 400 });
  }

  const items = [];
  let subtotal = 0;
  let advanceMerchandise = 0;
  let hasPartial = false;

  for (const raw of rawItems) {
    const qty = Math.max(1, Number(raw.qty || raw.quantity || 1));
    const { product, unitPrice, stock, variantSku, variantLabel, baseId } =
      await resolveProduct(raw);

    if (product.manageStock !== false && stock < qty) {
      throw Object.assign(
        new Error(`Insufficient stock for ${product.name}${variantLabel ? ` (${variantLabel})` : ""}`),
        { status: 400 }
      );
    }

    const wantPartial =
      partialEnabled &&
      product.allowSplit &&
      String(raw.paymentType || "").toLowerCase() === "partial";
    const advanceUnit = wantPartial ? computeAdvance(product, unitPrice, paymentsCfg) : unitPrice;
    if (wantPartial) hasPartial = true;

    const image =
      raw.image ||
      (Array.isArray(product.images) ? product.images[0] : "") ||
      "";

    items.push({
      productId: baseId,
      variantSku,
      name: variantLabel ? `${product.name} (${variantLabel})` : product.name,
      image,
      qty,
      price: unitPrice,
      paymentType: wantPartial ? "partial" : "full",
      advanceAmount: wantPartial ? advanceUnit : 0,
    });

    subtotal += unitPrice * qty;
    advanceMerchandise += (wantPartial ? advanceUnit : unitPrice) * qty;
  }

  // Coupon — revalidate from DB
  let discount = 0;
  let couponCode = "";
  let freeShipping = false;
  const code = String(body.couponCode || "").trim().toUpperCase();
  if (code) {
    const coupon = await Coupon.findOne({ code });
    if (!coupon || coupon.status !== "Active") {
      throw Object.assign(new Error("Invalid or inactive coupon"), { status: 400 });
    }
    const ends = coupon.ends ? new Date(coupon.ends) : null;
    if (ends && !Number.isNaN(ends.getTime()) && ends < new Date()) {
      throw Object.assign(new Error("Coupon has expired"), { status: 400 });
    }
    if (coupon.limit > 0 && coupon.usage >= coupon.limit) {
      throw Object.assign(new Error("Coupon usage limit reached"), { status: 400 });
    }
    if (subtotal < (coupon.minOrder || 0)) {
      throw Object.assign(new Error(`Minimum order ₹${coupon.minOrder} required`), {
        status: 400,
      });
    }
    const shippingProbe = subtotal >= freeThreshold ? 0 : flatShip;
    discount = computeDiscount(coupon, { subtotal, shipping: shippingProbe });
    freeShipping = coupon.type === "FreeShipping";
    couponCode = coupon.code;
  }

  let shipping = freeShipping || subtotal >= freeThreshold ? 0 : flatShip;
  if (body.shippingMethod === "store_pickup") shipping = 0;

  // Tax — highest priority Active rate matching India / state
  const taxRows = await TaxRate.find({ status: "Active" });
  const state = String(body.state || body.shippingState || "").trim();
  const scored = taxRows
    .map((t) => {
      let score = Number(t.priority) || 0;
      if (t.country && /india/i.test(String(t.country))) score += 100;
      if (t.state && state && new RegExp(String(t.state), "i").test(state)) score += 50;
      if (t.type === "Zero") score -= 5;
      return { t, score };
    })
    .sort((a, b) => b.score - a.score);
  const taxRate = scored[0]?.t || null;
  const taxPct = taxRate ? parseTaxPct(taxRate) : 0;
  const taxInclusive = taxRate ? taxRate.inclusive !== false && taxRate.inclusive !== "false" : true;

  const merchandiseNet = Math.max(0, subtotal - discount);
  // Pay-now merchandise: advance portion after discount proportionally-ish
  // Simpler: discount reduces what is owed overall; pay now = min(advance, net) for partial
  const payNowMerch = hasPartial
    ? Math.min(advanceMerchandise, merchandiseNet)
    : merchandiseNet;
  const balanceDue = hasPartial ? Math.max(0, merchandiseNet - payNowMerch) : 0;

  const taxAmount =
    taxPct > 0 && !taxInclusive ? Math.round((payNowMerch * taxPct) / 100) : 0;
  const advancePaid = payNowMerch + shipping + taxAmount;
  const total = merchandiseNet + shipping + (taxInclusive ? 0 : Math.round((merchandiseNet * taxPct) / 100));

  const method = String(body.paymentMethod || "cod").toLowerCase();
  if (method === "razorpay" && paymentsCfg?.razorpay?.enabled === false) {
    throw Object.assign(new Error("Razorpay is disabled"), { status: 400 });
  }
  if (
    (method === "cod" || method === "cashondelivery") &&
    paymentsCfg?.cashOnDelivery?.enabled === false
  ) {
    throw Object.assign(new Error("Cash on delivery is disabled"), { status: 400 });
  }

  let payment = "Pending";
  if (method === "razorpay") {
    payment = hasPartial && balanceDue > 0 ? "Partial" : "Paid";
  } else if (method === "cod") {
    payment = "Pending";
  }

  return {
    items,
    subtotal: Number(subtotal) || 0,
    discount: Number(discount) || 0,
    couponCode,
    shipping: Number.isFinite(Number(shipping)) ? Number(shipping) : 0,
    tax: taxInclusive ? 0 : Math.round((merchandiseNet * taxPct) / 100) || 0,
    taxLabel: taxRate ? `${taxRate.name} (${taxRate.rate || taxPct + "%"})` : "",
    total: Number.isFinite(Number(total)) ? Number(total) : 0,
    advancePaid: method === "cod" ? 0 : Number.isFinite(Number(advancePaid)) ? Number(advancePaid) : 0,
    balanceDue:
      method === "cod"
        ? Number(merchandiseNet) || 0
        : hasPartial
        ? Number(balanceDue) || 0
        : 0,
    paymentType: hasPartial ? "partial" : "full",
    payment,
    paymentMethod: method,
  };
}
