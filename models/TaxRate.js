import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    /** GST | CGST | SGST | IGST | VAT | Zero | Custom */
    type: {
      type: String,
      enum: ["GST", "CGST", "SGST", "IGST", "VAT", "Zero", "Custom"],
      default: "GST",
    },
    rate: { type: String, required: true }, // display "3%"
    rateValue: { type: Number, default: 0 }, // numeric % for checkout
    inclusive: { type: Boolean, default: true },
    country: { type: String, default: "India" },
    state: { type: String, default: "" }, // optional state scope
    priority: { type: Number, default: 10 }, // higher wins when multiple Active
    status: { type: String, enum: ["Active", "Draft"], default: "Active" },
  },
  { timestamps: true }
);

export default mongoose.model("TaxRate", schema);
