import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  productId: String,
  variantSku: String,
  name: String,
  image: { type: String, default: "" },
  qty: { type: Number, default: 1 },
  price: Number,
  paymentType: { type: String, enum: ["full", "partial"], default: "full" },
  advanceAmount: { type: Number, default: 0 },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    customer: { type: String, required: true },
    email: String,
    phone: String,
    address: String,
    items: [orderItemSchema],
    subtotal: { type: Number, default: 0 },
    total: { type: Number, required: true },
    shipping: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    couponCode: { type: String, default: "" },
    tax: { type: Number, default: 0 },
    taxLabel: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },
    payment: {
      type: String,
      enum: ["Pending", "Paid", "Partial", "Refunded"],
      default: "Pending",
    },
    paymentMethod: String,
    paymentId: String,
    razorpayOrderId: String,
    paymentType: { type: String, enum: ["full", "partial"], default: "full" },
    advancePaid: { type: Number, default: 0 },
    balanceDue: { type: Number, default: 0 },
    awb: { type: String, default: "" },
    courier: { type: String, default: "" },
    shiprocketOrderId: { type: String, default: "" },
    shiprocketShipmentId: { type: String, default: "" },
    trackingUrl: { type: String, default: "" },
    /** Inventory lifecycle flags */
    inventoryReserved: { type: Boolean, default: false },
    inventoryCommitted: { type: Boolean, default: false },
    inventoryRestocked: { type: Boolean, default: false },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
