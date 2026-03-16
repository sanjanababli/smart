import mongoose from "mongoose";

const inventoryItemSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    reorderLevel: {
      type: Number,
      required: true,
      min: 0,
      default: 10
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    supplier: {
      type: String,
      trim: true,
      default: ""
    },
    status: {
      type: String,
      enum: ["in-stock", "low-stock", "out-of-stock"],
      default: "in-stock"
    },
    lastRestockedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

inventoryItemSchema.index({ name: "text", category: "text" });

export const InventoryItem = mongoose.model("InventoryItem", inventoryItemSchema);
