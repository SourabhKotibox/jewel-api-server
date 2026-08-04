import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    city: { type: String, required: true },
    state: { type: String, required: true },
    address: { type: String, required: true },
    hours: { type: String, default: "Mon–Sun 11:00 AM – 08:00 PM" },
    phone: { type: String, default: "" },
    mapUrl: { type: String, default: "" },
    img: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("StoreLocation", schema);
