import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    channel: { type: String, enum: ["Email", "SMS", "WhatsApp", "Push"], default: "Email" },
    audience: { type: String, default: "All customers" },
    subject: { type: String, default: "" },
    body: { type: String, default: "" },
    image: { type: String, default: "" },
    sent: { type: Number, default: 0 },
    openRate: { type: String, default: "0%" },
    date: { type: String, default: () => new Date().toISOString().slice(0, 10) },
    scheduledAt: { type: String, default: "" },
    status: { type: String, enum: ["Draft", "Scheduled", "Sent"], default: "Draft" },
    lastSentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Campaign", schema);
