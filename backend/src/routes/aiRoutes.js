import { Router } from "express";
import { Product } from "../models/Product.js";
import { Sale } from "../models/Sale.js";
import { StockAlert } from "../models/StockAlert.js";
import { Bill } from "../models/Bill.js";
import { Vendor } from "../models/Vendor.js";
import { PurchaseOrder } from "../models/PurchaseOrder.js";
import { InventoryItem } from "../models/InventoryItem.js";
import { generateBusinessInsights, chatWithAI } from "../services/aiService.js";

const router = Router();

// Prepare Context Data Helper
const prepareContextData = async () => {
  // Fetch Products
  const productsRaw = await Product.find({}).lean();
  
  // Fetch ALL Sales for history
  const salesRaw = await Sale.find({}).lean();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaySalesRaw = salesRaw.filter(s => new Date(s.date) >= today);
  
  const todaySales = todaySalesRaw.reduce((sum, sale) => sum + (sale.totalPrice || 0), 0);
  const itemsSold = todaySalesRaw.reduce((sum, sale) => sum + (sale.quantity || 0), 0);

  // Fetch Low Stock Alerts
  const lowStockRaw = await StockAlert.find({}).lean();
  
  // Fetch Bills
  const billsRaw = await Bill.find({}).sort({ date: -1 }).limit(50).lean();
  
  // Fetch Vendors
  const vendorsRaw = await Vendor.find({}).limit(50).lean();
  
  // Fetch Purchase Orders
  const purchaseOrdersRaw = await PurchaseOrder.find({}).sort({ createdAt: -1 }).limit(20).lean();
  
  // Fetch Inventory Items
  const inventoryItemsRaw = await InventoryItem.find({}).limit(200).lean();

  const data = {
    products: productsRaw,
    inventoryItems: inventoryItemsRaw,
    salesSummary: {
      todaySales,
      itemsSold,
      totalSalesCount: salesRaw.length
    },
    recentSales: salesRaw.slice(0, 100), // Limit to top 100 recent sales
    bills: billsRaw,
    vendors: vendorsRaw,
    purchaseOrders: purchaseOrdersRaw,
    stockAlerts: lowStockRaw
  };

  return data;
};

// GET /api/ai/insights
router.get("/insights", async (req, res) => {
  try {
    const data = await prepareContextData();
    const insights = await generateBusinessInsights(data);
    res.json({ insights });
  } catch (error) {
    console.error("AI Insights Route Error:", error);
    res.status(500).json({ error: "Failed to generate insights" });
  }
});

// POST /api/ai/chat
router.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const answer = await chatWithAI(message, null);
    
    res.json({ answer });
  } catch (error) {
    console.error("AI Chat Route Error:", error.message, error.stack);
    
    if (error.message && error.message.includes("Quota exceeded")) {
       return res.status(429).json({ error: "Gemini API rate limit exceeded. Please wait a moment before asking another question." });
    }

    res.status(500).json({ error: "Failed to process chat", details: error.message });
  }
});

export default router;
