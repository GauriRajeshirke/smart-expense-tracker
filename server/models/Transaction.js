import mongoose from "mongoose";
import { ALL_CATEGORIES } from "../utils/constants.js";

const transactionSchema = new mongoose.Schema(
  {
    // Every transaction belongs to exactly one user
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, required: true, enum: ["income", "expense"] },
    amount: { type: Number, required: true, min: 0.01, max: 1000000000 },
    category: { type: String, required: true, enum: ALL_CATEGORIES },
    date: { type: Date, required: true },
    description: { type: String, trim: true, maxlength: 100, default: "" },
    // true only for records created by the seed script (fake sample data)
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

transactionSchema.index({ user: 1, date: -1 });

export default mongoose.model("Transaction", transactionSchema);
