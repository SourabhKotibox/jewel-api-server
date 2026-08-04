/** Compute advance amount for a product based on admin split config */
export function calcAdvanceAmount(product) {
  if (!product?.allowSplit) return 0;
  const price = Number(product.price) || 0;
  if (price <= 0) return 0;
  if (product.splitType === "amount") {
    const amt = Number(product.splitValue) || 0;
    return Math.min(Math.max(0, Math.round(amt)), price);
  }
  const pct = Number(product.splitValue);
  const percent = Number.isFinite(pct) && pct > 0 ? pct : 50;
  return Math.min(price, Math.round(price * (percent / 100)));
}

export function lineAdvance(item) {
  if (item.paymentType !== "partial") return Number(item.price) * (item.quantity || item.qty || 1);
  if (item.advanceAmount != null) {
    return Number(item.advanceAmount) * (item.quantity || item.qty || 1);
  }
  return calcAdvanceAmount(item) * (item.quantity || item.qty || 1);
}
