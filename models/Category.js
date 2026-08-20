import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    img: String,
    productCount: { type: Number, default: 0 },
    /** rings | necklaces | earrings | bracelets | pendants | accessories | sets */
    jewelryType: { type: String, default: "" },
    /** Attribute codes that appear on products in this category */
    attributeCodes: { type: [String], default: [] },
    /** Shown first on product form (required / common fields) */
    primaryAttributeCodes: { type: [String], default: [] },
    /** Attribute used for sellable variants (e.g. ring_size) */
    variantAttribute: { type: String, default: "" },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
    status: { type: String, enum: ["Active", "Draft"], default: "Active" },
    sortOrder: { type: Number, default: 0 },
    hidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Category", categorySchema);
