import { Product } from "../models/Product.js";
import { Bill } from "../models/Bill.js";
import { SoldProduct } from "../models/SoldProduct.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { ApiError } from "../utils/ApiError.js";
import { syncStockAlert } from "./stockAlert.service.js";

const createBillNumber = () => `BILL-${Date.now()}`;

export const getProductForScan = async (barcode) => {
  const product = await Product.findOne({ barcode: barcode.trim() });

  if (!product) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Product not found for this barcode");
  }

  return product;
};

export const checkoutSale = async ({ items, billerId }) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "At least one cart item is required for checkout");
  }

  const billNumber = createBillNumber();
  const saleRows = [];
  const billItems = [];
  let totalAmount = 0;
  let totalProfit = 0;

  for (const item of items) {
    if (!item.productId || !item.quantity || Number(item.quantity) <= 0) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Each cart item must include productId and quantity");
    }

    const product = await Product.findById(item.productId);

    if (!product) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, `Product not found: ${item.productId}`);
    }

    if (product.stock < item.quantity) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, `Insufficient stock for ${product.name}`);
    }

    const lineTotal = product.price * item.quantity;
    const lineProfit = (product.price - product.cost) * item.quantity;

    product.stock -= item.quantity;
    await product.save();
    await syncStockAlert(product);

    saleRows.push({
      billNumber,
      productId: product._id,
      productName: product.name,
      barcode: product.barcode,
      unitPrice: product.price,
      unitCost: product.cost,
      quantity: item.quantity,
      totalPrice: lineTotal,
      profit: lineProfit,
      date: new Date()
    });

    billItems.push({
      productId: product._id,
      name: product.name,
      barcode: product.barcode,
      unitPrice: product.price,
      quantity: item.quantity,
      lineTotal,
      remainingStock: product.stock
    });

    totalAmount += lineTotal;
    totalProfit += lineProfit;
  }

  // Save Bill summary
  const bill = await Bill.create({
    billNumber,
    totalAmount,
    totalProfit,
    totalItems: billItems.reduce((sum, item) => sum + item.quantity, 0),
    billerId: billerId
  });

  // Save itemized products
  await SoldProduct.insertMany(saleRows);

  return {
    billNumber,
    items: billItems, // Profit is hidden here
    totalAmount,
    totalProfit, // Still returned to the frontend but we will hide it in UI
    totalItems: bill.totalItems,
    checkoutAt: bill.date
  };
};

export const listSalesRecords = async () => {
  return Bill.find().sort({ date: -1 });
};

export const getSaleRecordByBillNumber = async (billNumber) => {
  const bill = await Bill.findOne({ billNumber });

  if (!bill) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Bill record not found");
  }

  const products = await SoldProduct.find({ billNumber }).sort({ date: 1 });

  return {
    billNumber,
    checkoutAt: bill.date,
    totalAmount: bill.totalAmount,
    totalProfit: bill.totalProfit,
    totalItems: bill.totalItems,
    products: products.map((sale) => ({
      productId: sale.productId,
      productName: sale.productName,
      barcode: sale.barcode,
      quantity: sale.quantity,
      unitPrice: sale.unitPrice,
      totalPrice: sale.totalPrice
      // profit is excluded here for safety
    }))
  };
};
