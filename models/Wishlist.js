import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    name: { type: String, default: "" },
    slug: { type: String, default: "" },
    sku: { type: String, default: "" },
    price: { type: Number, default: 0 },
    images: { type: [String], default: [] },
    celeb: { type: String, default: "" },
    tag: { type: String, default: "" },
  },
  { _id: false }
);

const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: { type: [itemSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("Wishlist", schema);
