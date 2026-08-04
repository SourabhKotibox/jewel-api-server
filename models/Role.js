import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    users: { type: Number, default: 0 },
    permissions: { type: String, default: "" },
    status: { type: String, enum: ["Active", "Draft"], default: "Active" },
  },
  { timestamps: true }
);

export default mongoose.model("Role", schema);
