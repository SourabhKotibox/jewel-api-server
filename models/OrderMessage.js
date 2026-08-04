import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, index: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    senderName: { type: String, default: "" },
    senderRole: { type: String, enum: ["customer", "admin", "system"], default: "customer" },
    message: { type: String, required: true },
    readByAdmin: { type: Boolean, default: false },
    readByCustomer: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("OrderMessage", schema);
