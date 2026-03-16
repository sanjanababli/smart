import mongoose from "mongoose";

const stockAlertSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      unique: true
    },
    productName: {
      type: String,
      required: true,
      trim: true
    },
    barcode: {
      type: String,
      required: true,
      trim: true
    },
    currentStock: {
      type: Number,
      required: true,
      min: 0
    },
    threshold: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ["active", "resolved"],
      default: "active"
    },
    lastTriggeredAt: {
      type: Date,
      default: Date.now
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    emailSent: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

stockAlertSchema.index({ status: 1, lastTriggeredAt: -1 });

export const StockAlert = mongoose.model("StockAlert", stockAlertSchema);
