import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    orderId: { type: String, required: true },
    customer: { type: String, required: true },
    date: { type: String, default: () => new Date().toISOString().slice(0, 10) },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Paid", "Partial", "Pending"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

schema.virtual("id").get(function () {
  return this.invoiceNumber || String(this._id);
});

export default mongoose.model("Invoice", schema);
