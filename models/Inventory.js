import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    sku: { type: String, required: true },
    productId: { type: String, default: "" },
    variantSku: { type: String, default: "" },
    source: { type: String, default: "Mumbai WH" },
    qty: { type: Number, default: 0 },
    reserved: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["In Stock", "Low Stock", "Out of Stock"],
      default: "In Stock",
    },
  },
  { timestamps: true }
);

schema.index({ sku: 1, source: 1 });

export default mongoose.model("Inventory", schema);
