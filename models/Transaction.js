import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    txnNumber: { type: String, required: true, unique: true },
    orderId: { type: String, required: true },
    gateway: {
      type: String,
      enum: ["Razorpay", "Stripe", "PayU", "PayPal", "Bank Transfer", "COD"],
      default: "Razorpay",
    },
    method: { type: String, default: "UPI" },
    amount: { type: Number, required: true },
    date: { type: String, default: () => new Date().toISOString().slice(0, 10) },
    status: {
      type: String,
      enum: ["Success", "Failed", "Refunded", "Pending"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Transaction", schema);
