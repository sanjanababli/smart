import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
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
    price: {
      type: Number,
      required: true,
      min: 0
    },
    cost: {
      type: Number,
      required: true,
      min: 0
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    threshold: {
      type: Number,
      required: true,
      min: 0,
      default: 10
    },
    barcode: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    vendorName: {
      type: String,
      default: "TAXAS",
      trim: true
    },
    vendorEmail: {
      type: String,
      default: "pratrnerli@gmail.com",
      trim: true
    },
    vendorAddress: {
      type: String,
      default: "belgavi",
      trim: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false
  }
);

productSchema.index({ name: "text", category: "text" });

export const Product = mongoose.model("Product", productSchema);
