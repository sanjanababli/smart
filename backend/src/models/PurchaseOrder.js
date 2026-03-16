import mongoose from "mongoose";

const purchaseOrderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
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
    requiredStock: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    lineAmount: {
      type: Number,
      required: true,
      min: 0
    }
  },
  {
    _id: false
  }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    ownerName: {
      type: String,
      required: true,
      trim: true
    },
    ownerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    vendorName: {
      type: String,
      required: true,
      trim: true
    },
    vendorEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    vendorAddress: {
      type: String,
      required: true,
      trim: true
    },
    items: {
      type: [purchaseOrderItemSchema],
      default: []
    },
    finalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    emailedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
    versionKey: false
  }
);

purchaseOrderSchema.index({ vendorEmail: 1, createdAt: -1 });
purchaseOrderSchema.index({ "items.productId": 1 });

export const PurchaseOrder = mongoose.model("PurchaseOrder", purchaseOrderSchema);
