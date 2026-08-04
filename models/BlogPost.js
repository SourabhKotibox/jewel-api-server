import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, default: "" },
    body: { type: String, default: "" },
    date: { type: String, default: () => new Date().toISOString().slice(0, 10) },
    status: { type: String, enum: ["Published", "Draft"], default: "Draft" },
    cover: { type: String, default: "" },
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    metaKeywords: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("BlogPost", schema);
