import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    q: { type: String, required: true },
    a: { type: String, required: true },
    status: { type: String, enum: ["Published", "Draft"], default: "Published" },
  },
  { timestamps: true }
);

export default mongoose.model("Faq", schema);
