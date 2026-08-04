import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    location: { type: String, required: true },
    text: { type: String, required: true },
    img: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Testimonial", schema);
