import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    returnNumber: { type: String, required: true, unique: true },
    orderNumber: { type: String, required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    email: String,
    customer: String,
    type: { type: String, enum: ["Return", "Refund", "Exchange"], default: "Return" },
    reason: { type: String, required: true },
    notes: { type: String, default: "" },
    amount: { type: Number, default: 0 },
    items: [
      {
        name: String,
        productId: String,
        qty: Number,
        price: Number,
      },
    ],
    status: {
      type: String,
      enum: ["Requested", "Approved", "Rejected", "Received", "Refunded"],
      default: "Requested",
    },
    restock: { type: Boolean, default: true },
    refundId: String,
  },
  { timestamps: true }
);

export default mongoose.model("ReturnRequest", schema);
