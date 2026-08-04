import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    name: { type: String, default: "" },
    date: { type: String, default: () => new Date().toISOString().slice(0, 10) },
    status: { type: String, enum: ["Subscribed", "Unsubscribed"], default: "Subscribed" },
  },
  { timestamps: true }
);

export default mongoose.model("Subscriber", schema);
