import Inventory from "../models/Inventory.js";
import Product from "../models/Product.js";

function stockStatus(qty, reserved = 0) {
  const available = qty - reserved;
  if (available <= 0) return "Out of Stock";
  if (available <= 2) return "Low Stock";
  return "In Stock";
}

/** Resolve SKU used in inventory (variant preferred) */
export function lineSku(item) {
  return (
    item.variantSku ||
    (String(item.productId || "").includes("::")
      ? String(item.productId).split("::")[1]
      : null) ||
    item.productId ||
    item.sku ||
    ""
  );
}

export function parentSku(item) {
  const pid = String(item.productId || item.sku || "");
  if (pid.includes("::")) return pid.split("::")[0];
  const v = lineSku(item);
  // variant skus often like base-sz12
  return item.parentSku || pid || v;
}

async function findInv(sku) {
  if (!sku) return null;
  return (
    (await Inventory.findOne({ sku })) ||
    (await Inventory.findOne({ variantSku: sku }))
  );
}

async function bumpProductStock(sku, delta) {
  if (!sku || !delta) return;
  let product =
    (await Product.findOne({ sku })) ||
    (await Product.findOne({ "variants.sku": sku }));
  if (!product) return;

  if (product.variants?.length) {
    const v = product.variants.find((x) => x.sku === sku);
    if (v) {
      v.stock = Math.max(0, (Number(v.stock) || 0) + delta);
      v.status = v.stock > 0 ? "Active" : "Out of Stock";
    }
    product.stock = product.variants.reduce((s, x) => s + (Number(x.stock) || 0), 0);
  } else if (product.sku === sku) {
    product.stock = Math.max(0, (Number(product.stock) || 0) + delta);
  }
  if (product.stock <= 0) product.status = "Out of Stock";
  else if (product.status === "Out of Stock") product.status = "Active";
  await product.save();
}

/**
 * Reserve stock when order is placed (Pending/Processing).
 * Increases Inventory.reserved; does not reduce qty yet.
 */
export async function reserveOrderStock(order) {
  if (order.inventoryReserved) return { ok: true, already: true };
  const items = order.items || [];
  for (const item of items) {
    const sku = lineSku(item);
    const need = Number(item.qty || item.quantity || 1);

    const product =
      (await Product.findOne({ sku: parentSku(item) })) ||
      (await Product.findOne({ "variants.sku": sku })) ||
      (await Product.findOne({ sku }));

    // Made-to-order / unmanaged stock — do not block checkout
    if (product && product.manageStock === false) continue;

    let inv = await findInv(sku);
    if (!inv) {
      // Seed inventory row from product stock — do not invent unlimited qty
      const seedQty =
        product?.variants?.find((v) => v.sku === sku)?.stock ??
        product?.stock ??
        0;
      inv = await Inventory.create({
        name: item.name || sku,
        sku,
        productId: parentSku(item),
        variantSku: sku !== parentSku(item) ? sku : "",
        source: "Mumbai WH",
        qty: Number(seedQty) || 0,
        reserved: 0,
        status: "In Stock",
      });
    }
    const available = (Number(inv.qty) || 0) - (Number(inv.reserved) || 0);
    if (available < need) {
      throw new Error(
        `Insufficient stock for ${inv.name || sku} (available ${available}, need ${need})`
      );
    }
    inv.reserved = (Number(inv.reserved) || 0) + need;
    inv.status = stockStatus(inv.qty, inv.reserved);
    await inv.save();
  }
  order.inventoryReserved = true;
  await order.save();
  return { ok: true };
}

/** Release reservation on cancel (before ship) */
export async function releaseOrderStock(order) {
  if (!order.inventoryReserved || order.inventoryCommitted) return { ok: true, skipped: true };
  for (const item of order.items || []) {
    const sku = lineSku(item);
    const need = Number(item.qty || item.quantity || 1);
    const inv = await findInv(sku);
    if (!inv) continue;
    inv.reserved = Math.max(0, (Number(inv.reserved) || 0) - need);
    inv.status = stockStatus(inv.qty, inv.reserved);
    await inv.save();
  }
  order.inventoryReserved = false;
  await order.save();
  return { ok: true };
}

/** Commit stock when shipped/delivered — qty decreases, reserved clears */
export async function commitOrderStock(order) {
  if (order.inventoryCommitted) return { ok: true, already: true };
  if (!order.inventoryReserved) {
    // Still deduct if never reserved (legacy orders)
    for (const item of order.items || []) {
      const sku = lineSku(item);
      const need = Number(item.qty || item.quantity || 1);
      const inv = await findInv(sku);
      if (inv) {
        inv.qty = Math.max(0, (Number(inv.qty) || 0) - need);
        inv.status = stockStatus(inv.qty, inv.reserved);
        await inv.save();
      }
      await bumpProductStock(sku, -need);
    }
  } else {
    for (const item of order.items || []) {
      const sku = lineSku(item);
      const need = Number(item.qty || item.quantity || 1);
      const inv = await findInv(sku);
      if (inv) {
        inv.qty = Math.max(0, (Number(inv.qty) || 0) - need);
        inv.reserved = Math.max(0, (Number(inv.reserved) || 0) - need);
        inv.status = stockStatus(inv.qty, inv.reserved);
        await inv.save();
      }
      await bumpProductStock(sku, -need);
    }
  }
  order.inventoryReserved = false;
  order.inventoryCommitted = true;
  await order.save();
  return { ok: true };
}

/** Restock after approved return/refund */
export async function restockOrder(order) {
  if (order.inventoryRestocked) return { ok: true, already: true };
  for (const item of order.items || []) {
    const sku = lineSku(item);
    const need = Number(item.qty || item.quantity || 1);
    let inv = await findInv(sku);
    if (!inv) {
      inv = await Inventory.create({
        name: item.name || sku,
        sku,
        productId: parentSku(item),
        source: "Mumbai WH",
        qty: need,
        reserved: 0,
        status: "In Stock",
      });
    } else {
      inv.qty = (Number(inv.qty) || 0) + need;
      inv.status = stockStatus(inv.qty, inv.reserved);
      await inv.save();
    }
    await bumpProductStock(sku, need);
  }
  order.inventoryRestocked = true;
  // If was committed, allow tracking
  await order.save();
  return { ok: true };
}

/** Apply inventory side-effects for a status transition */
export async function applyInventoryForStatus(order, prevStatus, nextStatus) {
  if (!nextStatus || prevStatus === nextStatus) return;

  if (["Pending", "Processing"].includes(nextStatus) && !order.inventoryReserved && !order.inventoryCommitted) {
    await reserveOrderStock(order);
  }

  if (nextStatus === "Cancelled") {
    if (order.inventoryCommitted) {
      // already shipped — restock
      await restockOrder(order);
    } else {
      await releaseOrderStock(order);
    }
  }

  if (["Shipped", "Delivered"].includes(nextStatus)) {
    await commitOrderStock(order);
  }
}
