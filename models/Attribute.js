import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["Text", "Select", "Multiselect", "Boolean", "Price", "Number"],
      default: "Text",
    },
    /** Comma-separated options for Select / Multiselect */
    values: { type: String, default: "" },
    required: { type: Boolean, default: false },
    group: { type: String, default: "general" },
    usedForVariants: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    status: { type: String, enum: ["Active", "Draft"], default: "Active" },
  },
  { timestamps: true }
);

export default mongoose.model("Attribute", schema);
