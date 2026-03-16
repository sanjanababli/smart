import { StockAlert } from "../models/StockAlert.js";
import { User } from "../models/User.js";
import { sendLowStockAlertEmail } from "./mail.service.js";

export const syncStockAlert = async (product) => {
  const existingAlert = await StockAlert.findOne({ productId: product._id });
  
  // If stock is low (below or equal to threshold)
  if (product.stock <= product.threshold) {
    // If an alert already exists, just update the current stock
    if (existingAlert) {
      existingAlert.currentStock = product.stock;
      existingAlert.lastTriggeredAt = new Date();
      await existingAlert.save();
      return;
    }

    // If no alert exists, create one and send an email
    const newAlert = await StockAlert.create({
      productId: product._id,
      productName: product.name,
      barcode: product.barcode,
      currentStock: product.stock,
      threshold: product.threshold,
      status: "active",
      emailSent: true,
      lastTriggeredAt: new Date()
    });

    try {
      // Find the owner to notify
      const owner = await User.findOne({ role: "owner" });
      if (owner) {
        await sendLowStockAlertEmail({
          to: owner.email,
          ownerName: owner.name,
          productName: product.name,
          currentStock: product.stock,
          threshold: product.threshold,
          vendorEmail: product.vendorEmail || "N/A"
        });
      }
    } catch (err) {
      console.error("Failed to send low stock email:", err);
    }

    return;
  }

  // If stock is restored (above threshold), remove the alert
  if (existingAlert) {
    await StockAlert.deleteOne({ _id: existingAlert._id });
  }
};
