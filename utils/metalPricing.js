/**
 * Market-rate metal pricing for jewellery.
 * price ≈ netWeight × ratePerGram(+wastage) + making + stone
 */

export const DEFAULT_METAL_RATES = {
  /** INR per gram — update from market in Admin */
  gold24kPerGram: 7500,
  silver925PerGram: 110,
  platinum950PerGram: 3400,
  /** Making charge default when product doesn't override */
  defaultMakingPercent: 12,
  defaultWastagePercent: 0,
  /** Optional flat default making (0 = use percent) */
  defaultMakingFlat: 0,
  note: "Rates in INR per gram. Gold purity (22K/18K…) is derived from 24K.",
  updatedAt: "",
};

/** Purity factor relative to 24K gold (or 1 for silver/platinum base rates) */
export const PURITY_FACTOR = {
  "24K": 1,
  "22K": 22 / 24,
  "18K": 18 / 24,
  "14K": 14 / 24,
  "9K": 9 / 24,
  "925 Silver": 1,
  PT950: 1,
  PT900: 900 / 950,
};

function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function attrsOf(product) {
  const a = product?.attributes;
  if (!a) return {};
  if (a instanceof Map) return Object.fromEntries(a.entries());
  if (typeof a === "object") return { ...a };
  return {};
}

/** Rate per gram for this metal + purity from settings */
export function ratePerGram(metalType, metalPurity, rates = DEFAULT_METAL_RATES) {
  const metal = String(metalType || "").toLowerCase();
  const purity = String(metalPurity || "").trim();
  const r = { ...DEFAULT_METAL_RATES, ...rates };

  if (metal.includes("silver") || purity.includes("925")) {
    return num(r.silver925PerGram, DEFAULT_METAL_RATES.silver925PerGram);
  }
  if (metal.includes("platinum") || purity.startsWith("PT")) {
    const base = num(r.platinum950PerGram, DEFAULT_METAL_RATES.platinum950PerGram);
    const factor = PURITY_FACTOR[purity] ?? 1;
    return Math.round(base * factor * 100) / 100;
  }
  // Gold (yellow / white / rose / polki mixed treated as gold base)
  const gold24 = num(r.gold24kPerGram, DEFAULT_METAL_RATES.gold24kPerGram);
  const factor = PURITY_FACTOR[purity] ?? PURITY_FACTOR["22K"];
  return Math.round(gold24 * factor * 100) / 100;
}

/**
 * Compute market price for a product using current metal rates.
 * @returns {{ price, breakdown, ok, reason }}
 */
export function computeMarketPrice(product, rates = DEFAULT_METAL_RATES) {
  const attrs = attrsOf(product);
  const netWeight = num(
    product.netWeightGrams ?? attrs.net_weight ?? attrs.gross_weight,
    0
  );
  if (netWeight <= 0) {
    return {
      ok: false,
      reason: "Set net metal weight (g) for market pricing",
      price: num(product.price),
      breakdown: null,
    };
  }

  const metalType = attrs.metal_type || product.metalType || "";
  const metalPurity = attrs.metal_purity || product.metalPurity || "22K";
  const rate = ratePerGram(metalType, metalPurity, rates);
  const wastage = num(
    product.wastagePercent ?? rates.defaultWastagePercent,
    0
  );
  const metalCost = netWeight * rate * (1 + wastage / 100);

  const makingType = product.makingChargeType || "percent";
  let making = 0;
  if (makingType === "flat") {
    making = num(product.makingCharge, rates.defaultMakingFlat || 0);
  } else {
    const pct =
      product.makingCharge != null && product.makingCharge !== ""
        ? num(product.makingCharge)
        : num(rates.defaultMakingPercent, 12);
    making = (metalCost * pct) / 100;
  }

  const stone = num(product.stoneCharge, 0);
  const price = Math.max(0, Math.round(metalCost + making + stone));

  return {
    ok: true,
    price,
    breakdown: {
      netWeight,
      metalType,
      metalPurity,
      ratePerGram: rate,
      wastagePercent: wastage,
      metalCost: Math.round(metalCost),
      making: Math.round(making),
      stoneCharge: Math.round(stone),
      total: price,
    },
  };
}

/** Resolve sellable price from market rates when product has metal weight */
export function resolveProductPrice(product, rates = DEFAULT_METAL_RATES) {
  if (!product) return 0;
  const mode = String(product.pricingMode || "market");
  // Fixed = manual override; otherwise always try market formula
  if (mode === "fixed") return num(product.price);
  const computed = computeMarketPrice(product, rates);
  if (computed.ok) return computed.price;
  return num(product.price);
}

export function mergeMetalRates(raw) {
  return { ...DEFAULT_METAL_RATES, ...(raw || {}) };
}
