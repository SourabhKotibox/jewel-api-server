import Review from "../models/Review.js";

/** Public approved reviews for a product (id, sku, or name match) */
export async function listProductReviews(req, res, next) {
  try {
    const key = String(req.params.productId || req.query.product || "").trim();
    if (!key) return res.status(400).json({ message: "Product required" });
    const reviews = await Review.find({
      status: "Approved",
      $or: [
        { product: key },
        { product: new RegExp(`^${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(
      reviews.map((r) => ({
        id: String(r._id),
        product: r.product,
        customer: r.customer,
        rating: r.rating,
        title: r.title,
        body: r.body,
        date: r.date,
      }))
    );
  } catch (err) {
    next(err);
  }
}

/** Logged-in customer submits a review (Pending until admin approves) */
export async function submitProductReview(req, res, next) {
  try {
    const product = String(req.body.product || req.body.productId || "").trim();
    const rating = Number(req.body.rating);
    const title = String(req.body.title || "").trim();
    const body = String(req.body.body || req.body.review || "").trim();
    if (!product || !rating || rating < 1 || rating > 5 || !title || !body) {
      return res.status(400).json({ message: "Product, rating (1–5), title and body required" });
    }
    const row = await Review.create({
      product,
      customer: req.user.name || "Customer",
      rating,
      title,
      body,
      status: "Pending",
      user: req.user._id,
    });
    res.status(201).json({
      ok: true,
      id: String(row._id),
      message: "Thank you — your review is awaiting approval.",
    });
  } catch (err) {
    next(err);
  }
}
