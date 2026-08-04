import Wishlist from "../models/Wishlist.js";

function mapItem(i) {
  return {
    id: i.productId,
    productId: i.productId,
    name: i.name,
    slug: i.slug || i.sku || i.productId,
    sku: i.sku,
    price: i.price,
    images: i.images || [],
    celeb: i.celeb || "",
    tag: i.tag || "",
  };
}

function normalizeItems(items = []) {
  const seen = new Set();
  const out = [];
  for (const raw of items) {
    const productId = String(raw.productId || raw.id || raw.sku || "").trim();
    if (!productId || seen.has(productId)) continue;
    seen.add(productId);
    out.push({
      productId,
      name: raw.name || "",
      slug: raw.slug || raw.sku || productId,
      sku: raw.sku || "",
      price: Number(raw.price) || 0,
      images: Array.isArray(raw.images) ? raw.images.map(String) : [],
      celeb: raw.celeb || "",
      tag: raw.tag || "",
    });
  }
  return out;
}

export async function getWishlist(req, res, next) {
  try {
    const doc = await Wishlist.findOne({ user: req.user._id });
    res.json({ items: (doc?.items || []).map(mapItem) });
  } catch (err) {
    next(err);
  }
}

/** Replace or merge wishlist. body.merge=true merges with existing. */
export async function saveWishlist(req, res, next) {
  try {
    const incoming = normalizeItems(req.body.items || []);
    let doc = await Wishlist.findOne({ user: req.user._id });
    if (!doc) {
      doc = await Wishlist.create({ user: req.user._id, items: incoming });
    } else if (req.body.merge) {
      const map = new Map(doc.items.map((i) => [i.productId, i]));
      incoming.forEach((i) => map.set(i.productId, i));
      doc.items = [...map.values()];
      await doc.save();
    } else {
      doc.items = incoming;
      await doc.save();
    }
    res.json({ items: doc.items.map(mapItem) });
  } catch (err) {
    next(err);
  }
}
