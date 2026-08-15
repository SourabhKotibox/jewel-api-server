import mongoose from "mongoose";

const jewelryTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    status: { type: String, enum: ["Active", "Draft"], default: "Active" },
  },
  { timestamps: true }
);

export default mongoose.model("JewelryType", jewelryTypeSchema);
