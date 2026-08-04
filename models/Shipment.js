import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    shipmentNumber: { type: String, required: true, unique: true },
    orderId: { type: String, required: true },
    customer: { type: String, required: true },
    carrier: { type: String, default: "Bluedart" },
    tracking: { type: String, default: "" },
    date: { type: String, default: () => new Date().toISOString().slice(0, 10) },
    status: {
      type: String,
      enum: ["Pending", "In Transit", "Delivered"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Shipment", schema);
