import Product from "../models/Product.js";
import Category from "../models/Category.js";
import { fileUrl } from "../middleware/upload.js";
import { syncProductInventory, mapToObject } from "../utils/inventorySync.js";
import { getSettingValue } from "../services/settingsCache.js";
import {
  computeMarketPrice,
  mergeMetalRates,
} from "../utils/metalPricing.js";

function map(req, p, metalRates) {
  const o = p.toObject ? p.toObject() : p;
  const attributes = mapToObject(o.attributes);
  const specifications = mapToObject(o.specifications);
  const variants = (o.variants || []).map((v) => {
    const vo = v.toObject ? v.toObject() : v;
    return {
      ...vo,
      id: String(vo._id || vo.sku),
      options: mapToObject(vo.options),
    };
  });
  const stock =
    o.hasVariants && variants.length
      ? variants.reduce((s, v) => s + (Number(v.stock) || 0), 0)
      : Number(o.stock) || 0;

  const resolveImageUrl = (src) => {
    if (!src) return src;
    if (/^https?:\/\//i.test(src) || src.startsWith("data:")) return src;
    const protocol = req?.protocol || "http";
    const host = req?.get("host") || "";
    return `${protocol}://${host}${src.startsWith("/") ? src : `/${src}`}`;
  };

  const rates = metalRates || mergeMetalRates();
  const base = {
    ...o,
    id: o.sku || String(o._id),
    images: (o.images || []).map(resolveImageUrl),
    attributes,
    specifications,
    variants,
    stock,
    pricingMode: o.pricingMode || "market",
  };

  if (String(base.pricingMode) === "fixed") {
    return base;
  }

  const computed = computeMarketPrice(base, rates);
  if (computed.ok) {
    base.basePrice = Number(o.price) || 0;
    base.price = computed.price;
    base.priceBreakdown = computed.breakdown;
    base.priceFromMarket = true;
    base.pricingMode = "market";
  }

  return base;
}

async function loadMetalRates() {
  const raw = await getSettingValue("metalRates", null);
  return mergeMetalRates(raw);
}

function escapeRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function coerceBool(v) {
  if (typeof v === "boolean") return v;
  if (v === "true" || v === "1") return true;
  if (v === "false" || v === "0") return false;
  return !!v;
}

function normalizeProductBody(body, req) {
  const next = { ...body };

  if (typeof next.price === "string") next.price = Number(next.price);
  if (typeof next.stock === "string") next.stock = Number(next.stock);
  if (typeof next.splitValue === "string") next.splitValue = Number(next.splitValue);
  if (typeof next.netWeightGrams === "string") next.netWeightGrams = Number(next.netWeightGrams);
  if (typeof next.makingCharge === "string") next.makingCharge = Number(next.makingCharge);
  if (typeof next.stoneCharge === "string") next.stoneCharge = Number(next.stoneCharge);
  if (typeof next.wastagePercent === "string") next.wastagePercent = Number(next.wastagePercent);
  ["isPolki", "isDiamond", "isBridal", "allowSplit", "manageStock", "hasVariants"].forEach(
    (k) => {
      if (next[k] !== undefined) next[k] = coerceBool(next[k]);
    }
  );

  if (typeof next.attributes === "string") {
    try {
      next.attributes = JSON.parse(next.attributes);
    } catch {
      next.attributes = {};
    }
  }
  if (next.attributes && typeof next.attributes === "object") {
    const clean = {};
    Object.entries(next.attributes).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).trim() !== "") clean[k] = String(v);
    });
    next.attributes = clean;
    // Mirror into specifications for PDP display
    next.specifications = { ...clean };
  }

  if (typeof next.variants === "string") {
    try {
      next.variants = JSON.parse(next.variants);
    } catch {
      next.variants = [];
    }
  }
  if (Array.isArray(next.variants)) {
    next.variants = next.variants
      .map((v) => ({
        sku: v.sku,
        label: v.label || "",
        options: v.options || {},
        price: v.price === "" || v.price == null ? null : Number(v.price),
        stock: Number(v.stock) || 0,
        status: v.status || (Number(v.stock) > 0 ? "Active" : "Out of Stock"),
      }))
      .filter((v) => v.sku);
    if (next.variants.length) {
      next.hasVariants = true;
      next.stock = next.variants.reduce((s, v) => s + (Number(v.stock) || 0), 0);
    }
  }

  if (next.categoryId === "") next.categoryId = null;

  normalizeImages(next, req);
  return next;
}

function normalizeImages(body, req) {
  if (req.files?.length) {
    body.images = req.files.map((f) => fileUrl(f.filename));
    return;
  }
  if (req.file) {
    body.images = [fileUrl(req.file.filename)];
    return;
  }
  if (body.images == null) return;
  if (typeof body.images === "string") {
    try {
      const parsed = JSON.parse(body.images);
      body.images = Array.isArray(parsed)
        ? parsed.map(String).filter(Boolean)
        : String(body.images)
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean);
    } catch {
      body.images = String(body.images)
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  } else if (Array.isArray(body.images)) {
    body.images = body.images.map(String).filter(Boolean);
  }
}

async function attachCategoryMeta(body) {
  if (!body.categoryId && !body.category) return body;
  let cat = null;
  if (body.categoryId) {
    cat = await Category.findById(body.categoryId).catch(() => null);
  }
  if (!cat && body.category) {
    cat =
      (await Category.findOne({ name: new RegExp(`^${body.category}$`, "i") })) ||
      (await Category.findOne({ slug: String(body.category).toLowerCase() }));
  }
  if (cat) {
    body.category = cat.name;
    body.categoryId = cat._id;
    body.jewelryType = cat.jewelryType || body.jewelryType || "";
    if (!body.variantAttribute && cat.variantAttribute) {
      body.variantAttribute = cat.variantAttribute;
    }
  }
  return body;
}

export async function getProducts(req, res, next) {
  try {
    const q = String(req.query.q || "").trim();
    const filter = q
      ? {
          $or: [
            { name: new RegExp(q, "i") },
            { sku: new RegExp(q, "i") },
            { slug: new RegExp(q, "i") },
            { category: new RegExp(q, "i") },
            { jewelryType: new RegExp(q, "i") },
            { celeb: new RegExp(q, "i") },
            { tag: new RegExp(q, "i") },
            { description: new RegExp(q, "i") },
          ],
        }
      : {};
    if (req.query.category) {
      const catQ = String(req.query.category).trim();
      const parent =
        (await Category.findOne({ name: new RegExp(`^${escapeRe(catQ)}$`, "i") })) ||
        (await Category.findOne({ slug: catQ.toLowerCase().replace(/\s+/g, "-") }));
      if (parent && !parent.parent) {
        const kids = await Category.find({ parent: parent._id });
        const names = [parent.name, ...kids.map((k) => k.name)];
        filter.category = { $in: names };
      } else {
        filter.category = new RegExp(`^${escapeRe(catQ)}$`, "i");
      }
    }
    if (req.query.jewelryType) filter.jewelryType = req.query.jewelryType;
    if (req.query.isPolki === "1" || req.query.isPolki === "true") filter.isPolki = true;
    if (req.query.isDiamond === "1" || req.query.isDiamond === "true") filter.isDiamond = true;
    if (req.query.isBridal === "1" || req.query.isBridal === "true") filter.isBridal = true;
    if (req.query.minPrice) filter.price = { ...(filter.price || {}), $gte: Number(req.query.minPrice) };
    if (req.query.maxPrice) filter.price = { ...(filter.price || {}), $lte: Number(req.query.maxPrice) };

    // Storefront: hide drafts unless admin asks for all
    const wantAll = req.query.all === "1" || req.query.admin === "1";
    if (!wantAll) {
      filter.status = { $in: ["Active", "Out of Stock"] };
    } else if (req.query.status && req.query.status !== "All") {
      filter.status = req.query.status;
    }

    const rates = await loadMetalRates();
    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products.map((p) => map(req, p, rates)));
  } catch (err) {
    next(err);
  }
}

export async function getProduct(req, res, next) {
  try {
    let product =
      (await Product.findOne({ sku: req.params.id })) ||
      (await Product.findOne({ slug: req.params.id })) ||
      (await Product.findById(req.params.id).catch(() => null));
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (product.status === "Draft" && req.query.admin !== "1") {
      return res.status(404).json({ message: "Product not found" });
    }
    const rates = await loadMetalRates();
    res.json(map(req, product, rates));
  } catch (err) {
    next(err);
  }
}

async function applyMarketPriceOnSave(body) {
  if (String(body.pricingMode) === "fixed") return body;
  body.pricingMode = "market";
  const rates = await loadMetalRates();
  const computed = computeMarketPrice(body, rates);
  if (computed.ok) body.price = computed.price;
  return body;
}

export async function createProduct(req, res, next) {
  try {
    let body = normalizeProductBody({ ...req.body }, req);
    body = await attachCategoryMeta(body);
    body = await applyMarketPriceOnSave(body);
    const product = await Product.create(body);
    if (product.manageStock !== false) {
      await syncProductInventory(product);
    }
    if (product.categoryId) {
      await Category.findByIdAndUpdate(product.categoryId, { $inc: { productCount: 1 } });
    }
    const rates = await loadMetalRates();
    res.status(201).json(map(req, product, rates));
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(req, res, next) {
  try {
    let body = normalizeProductBody({ ...req.body }, req);
    body = await attachCategoryMeta(body);
    body = await applyMarketPriceOnSave(body);
    let product =
      (await Product.findOneAndUpdate({ sku: req.params.id }, body, {
        new: true,
        runValidators: true,
      })) ||
      (await Product.findByIdAndUpdate(req.params.id, body, {
        new: true,
        runValidators: true,
      }).catch(() => null));
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (product.manageStock !== false) {
      await syncProductInventory(product);
    }
    const rates = await loadMetalRates();
    res.json(map(req, product, rates));
  } catch (err) {
    next(err);
  }
}

export async function deleteProduct(req, res, next) {
  try {
    let product =
      (await Product.findOneAndDelete({ sku: req.params.id })) ||
      (await Product.findByIdAndDelete(req.params.id).catch(() => null));
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (product.categoryId) {
      await Category.findByIdAndUpdate(product.categoryId, { $inc: { productCount: -1 } });
    }
    res.json({ message: "Product deleted" });
  } catch (err) {
    next(err);
  }
}
