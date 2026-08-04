import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: "" },
    message: { type: String, required: true },
    status: { type: String, enum: ["New", "Read", "Archived"], default: "New" },
  },
  { timestamps: true }
);

export default mongoose.model("ContactMessage", schema);
