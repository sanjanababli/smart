import mongoose from "mongoose";

const billSchema = new mongoose.Schema(
  {
    billNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    totalProfit: {
      type: Number,
      required: true
    },
    totalItems: {
      type: Number,
      required: true,
      min: 1
    },
    billerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: { createdAt: "date", updatedAt: false },
    versionKey: false
  }
);

billSchema.index({ date: -1 });

export const Bill = mongoose.model("Bill", billSchema);
