import Inventory from "../models/Inventory.js";

function stockStatus(qty, reserved = 0) {
  const available = qty - reserved;
  if (available <= 0) return "Out of Stock";
  if (available <= 2) return "Low Stock";
  return "In Stock";
}

/** Upsert inventory rows for a product + variants */
export async function syncProductInventory(product, source = "Mumbai WH") {
  if (!product) return;

  const baseName = product.name;
  const productId = product.sku || String(product._id);

  if (product.hasVariants && Array.isArray(product.variants) && product.variants.length) {
    for (const v of product.variants) {
      const sku = v.sku || `${product.sku}-${v.label}`;
      const qty = Number(v.stock) || 0;
      await Inventory.findOneAndUpdate(
        { sku, source },
        {
          name: `${baseName} · ${v.label || sku}`,
          sku,
          productId,
          variantSku: sku,
          source,
          qty,
          status: stockStatus(qty),
        },
        { upsert: true, new: true }
      );
    }
    // Parent aggregate row
    const total = product.variants.reduce((s, v) => s + (Number(v.stock) || 0), 0);
    await Inventory.findOneAndUpdate(
      { sku: product.sku, source },
      {
        name: baseName,
        sku: product.sku,
        productId,
        variantSku: "",
        source,
        qty: total,
        status: stockStatus(total),
      },
      { upsert: true, new: true }
    );
    return total;
  }

  const qty = Number(product.stock) || 0;
  await Inventory.findOneAndUpdate(
    { sku: product.sku, source },
    {
      name: baseName,
      sku: product.sku,
      productId,
      variantSku: "",
      source,
      qty,
      status: stockStatus(qty),
    },
    { upsert: true, new: true }
  );
  return qty;
}

export function mapToObject(mapOrObj) {
  if (!mapOrObj) return {};
  if (mapOrObj instanceof Map) return Object.fromEntries(mapOrObj.entries());
  if (typeof mapOrObj.toObject === "function") {
    const o = mapOrObj.toObject();
    return o;
  }
  return { ...mapOrObj };
}
