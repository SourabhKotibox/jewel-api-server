import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    refundNumber: { type: String, required: true, unique: true },
    orderId: { type: String, required: true },
    orderNumber: { type: String, default: "" },
    returnNumber: { type: String, default: "" },
    customer: { type: String, required: true },
    email: { type: String, default: "" },
    date: { type: String, default: () => new Date().toISOString().slice(0, 10) },
    amount: { type: Number, required: true },
    reason: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Pending", "Refunded", "Rejected"],
      default: "Pending",
    },
    restocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Refund", schema);
