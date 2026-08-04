import mongoose from "mongoose";

const variantSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true },
    label: { type: String, default: "" },
    /** e.g. { ring_size: "12" } */
    options: { type: Map, of: String, default: {} },
    price: { type: Number, default: null },
    stock: { type: Number, default: 0 },
    status: { type: String, enum: ["Active", "Draft", "Out of Stock"], default: "Active" },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: String,
    price: { type: Number, required: true },
    /** fixed = manual INR; market = weight × metal rate + making + stone */
    pricingMode: { type: String, enum: ["fixed", "market"], default: "market" },
    netWeightGrams: { type: Number, default: null },
    makingChargeType: { type: String, enum: ["percent", "flat"], default: "percent" },
    makingCharge: { type: Number, default: null },
    stoneCharge: { type: Number, default: 0 },
    wastagePercent: { type: Number, default: 0 },
    allowSplit: { type: Boolean, default: false },
    splitType: { type: String, enum: ["percent", "amount"], default: "percent" },
    splitValue: { type: Number, default: 50 },
    category: String,
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
    jewelryType: { type: String, default: "" },
    tag: { type: String, default: "Made to Order" },
    celeb: String,
    images: [String],
    isPolki: Boolean,
    isDiamond: Boolean,
    isBridal: Boolean,
    stock: { type: Number, default: 0 },
    manageStock: { type: Boolean, default: true },
    hasVariants: { type: Boolean, default: false },
    variantAttribute: { type: String, default: "" },
    /** Dynamic attribute values keyed by attribute code */
    attributes: { type: Map, of: String, default: {} },
    variants: { type: [variantSchema], default: [] },
    status: { type: String, enum: ["Active", "Draft", "Out of Stock"], default: "Active" },
    specifications: { type: Map, of: String },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
