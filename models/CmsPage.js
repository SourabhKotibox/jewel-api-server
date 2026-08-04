import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    body: { type: String, default: "" },
    status: { type: String, enum: ["Published", "Draft"], default: "Draft" },
    updated: { type: String, default: () => new Date().toISOString().slice(0, 10) },
    type: { type: String, enum: ["static", "dynamic"], default: "static" },
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    metaKeywords: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("CmsPage", schema);
