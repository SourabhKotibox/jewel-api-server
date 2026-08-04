import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    name: { type: String, default: "" },
    type: {
      type: String,
      enum: ["Percent", "Fixed", "FreeShipping", "BuyXGetY", "Custom"],
      default: "Percent",
    },
    value: { type: Number, required: true }, // % or flat INR
    maxDiscount: { type: Number, default: 0 }, // cap for percent / custom
    minOrder: { type: Number, default: 0 },
    buyQty: { type: Number, default: 0 }, // BuyXGetY
    getQty: { type: Number, default: 0 },
    customFormula: { type: String, default: "" }, // e.g. "flat:500" or notes
    firstOrderOnly: { type: Boolean, default: false },
    usage: { type: Number, default: 0 },
    limit: { type: Number, default: 100 },
    ends: { type: String, default: "" },
    status: { type: String, enum: ["Active", "Expired", "Draft"], default: "Active" },
  },
  { timestamps: true }
);

export default mongoose.model("Coupon", schema);
