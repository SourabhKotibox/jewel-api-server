import Setting from "../models/Setting.js";
import Product from "../models/Product.js";
import { sanitizeSettingsForPublic } from "../utils/sanitizeSettings.js";
import { computeMarketPrice, mergeMetalRates } from "../utils/metalPricing.js";

async function loadSettingsMap() {
  const docs = await Setting.find();
  const map = {};
  docs.forEach((d) => {
    map[d.key] = d.value;
  });
  return map;
}

/** Public — secrets stripped */
export async function getSettings(req, res, next) {
  try {
    const map = await loadSettingsMap();
    res.json(sanitizeSettingsForPublic(map));
  } catch (err) {
    next(err);
  }
}

/** Admin — full values including secrets */
export async function getSettingsAdmin(req, res, next) {
  try {
    res.json(await loadSettingsMap());
  } catch (err) {
    next(err);
  }
}

export async function upsertSetting(req, res, next) {
  try {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ message: "key required" });
    let nextVal = value;
    if (key === "metalRates") {
      nextVal = {
        ...mergeMetalRates(value),
        updatedAt: new Date().toISOString().slice(0, 10),
      };
    }
    const doc = await Setting.findOneAndUpdate(
      { key },
      { value: nextVal },
      { upsert: true, new: true }
    );
    if (key === "metalRates") await recalculateMarketProducts(nextVal);
    res.json(doc);
  } catch (err) {
    next(err);
  }
}

/**
 * Dedicated Market Rates save — updates rates then reprices all weight-based products.
 */
export async function putMetalRates(req, res, next) {
  try {
    const nextVal = {
      ...mergeMetalRates(req.body || {}),
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    await Setting.findOneAndUpdate(
      { key: "metalRates" },
      { key: "metalRates", value: nextVal },
      { upsert: true, new: true }
    );
    const stats = await recalculateMarketProducts(nextVal);
    res.json({ rates: nextVal, ...stats });
  } catch (err) {
    next(err);
  }
}

async function recalculateMarketProducts(ratesRaw) {
  const rates = mergeMetalRates(ratesRaw);
  const products = await Product.find({});
  let updated = 0;
  let skipped = 0;

  for (const p of products) {
    const attrs = p.attributes;
    const attrWeight =
      attrs instanceof Map
        ? Number(attrs.get("net_weight") || attrs.get("gross_weight") || 0)
        : Number(attrs?.net_weight || attrs?.gross_weight || 0);
    const hasWeight = Number(p.netWeightGrams) > 0 || attrWeight > 0;

    if (String(p.pricingMode) === "fixed" && !hasWeight) {
      skipped += 1;
      continue;
    }

    const { price, ok } = computeMarketPrice(p, rates);
    if (!ok) {
      skipped += 1;
      continue;
    }

    p.pricingMode = "market";
    p.price = price;
    await p.save();
    updated += 1;
  }

  return { updated, skipped, total: products.length };
}

export async function bulkUpsertSettings(req, res, next) {
  try {
    const entries = req.body || {};
    const results = {};
    for (const [key, value] of Object.entries(entries)) {
      // Don't overwrite secrets with masked placeholders from a stale client
      let nextVal = value;
      if (key === "mail" && value?.password === "********") {
        const prev = await Setting.findOne({ key: "mail" });
        nextVal = { ...value, password: prev?.value?.password || "" };
      }
      if (key === "payments" && value?.razorpay?.keySecret === undefined) {
        const prev = await Setting.findOne({ key: "payments" });
        if (prev?.value?.razorpay?.keySecret) {
          nextVal = {
            ...value,
            razorpay: {
              ...value.razorpay,
              keySecret: prev.value.razorpay.keySecret,
              webhookSecret:
                value.razorpay?.webhookSecret ?? prev.value.razorpay.webhookSecret,
            },
          };
        }
      }
      if (
        (key === "shiprocket" || key === "shipping") &&
        (value?.password === "********" || value?.shiprocket?.password === "********")
      ) {
        const prevKey = key === "shipping" ? "shipping" : "shiprocket";
        const prev = await Setting.findOne({ key: prevKey });
        if (key === "shiprocket") {
          nextVal = {
            ...value,
            password:
              value.password === "********" ? prev?.value?.password || "" : value.password,
            token: value.token === "********" ? prev?.value?.token || "" : value.token,
          };
        }
      }
      if (key === "metalRates") {
        nextVal = {
          ...mergeMetalRates(value),
          updatedAt: new Date().toISOString().slice(0, 10),
        };
      }
      const doc = await Setting.findOneAndUpdate(
        { key },
        { value: nextVal },
        { upsert: true, new: true }
      );
      results[key] = doc.value;
      if (key === "metalRates") await recalculateMarketProducts(nextVal);
    }
    res.json(results);
  } catch (err) {
    next(err);
  }
}

export async function deleteSetting(req, res, next) {
  try {
    await Setting.findOneAndDelete({ key: req.params.key });
    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
}
