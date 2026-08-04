import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    product: { type: String, required: true },
    customer: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    date: { type: String, default: () => new Date().toISOString().slice(0, 10) },
    status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("Review", schema);
