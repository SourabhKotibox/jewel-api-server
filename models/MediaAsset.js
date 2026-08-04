import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    url: { type: String, default: "" },
    type: { type: String, enum: ["Image", "Video", "Document"], default: "Image" },
    size: { type: String, default: "" },
    used: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("MediaAsset", schema);
