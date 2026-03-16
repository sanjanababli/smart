import { jsPDF } from "jspdf";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { Product } from "../models/Product.js";
import { PurchaseOrder } from "../models/PurchaseOrder.js";
import { ApiError } from "../utils/ApiError.js";
import { sendPurchaseOrderEmail } from "./mail.service.js";

const PO_PRIMARY_COLOR = [18, 112, 193];
const PO_TOTAL_HIGHLIGHT = [255, 196, 0];

const formatCurrency = (value) => Number(value ?? 0).toFixed(2);

const createPurchaseOrderNumber = () => `PO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

export const buildPurchaseOrderPdfBuffer = (purchaseOrder) => {
  const pdf = new jsPDF();
  const pageWidth = 210;
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;
  let y = 12;

  pdf.setDrawColor(...PO_PRIMARY_COLOR);
  pdf.setLineWidth(0.8);
  pdf.rect(margin, margin, contentWidth, 277);

  pdf.setTextColor(...PO_PRIMARY_COLOR);
  pdf.setFontSize(16);
  pdf.text("StockSense Inventory", 18, y + 10);
  pdf.setFontSize(32);
  pdf.text("PURCHASE ORDER", 100, y + 18);

  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(10);
  pdf.text(`Date: ${new Date(purchaseOrder.createdAt).toLocaleDateString()}`, 155, y + 28);
  pdf.text(`PO #: ${purchaseOrder.poNumber}`, 155, y + 35);

  pdf.setFontSize(11);
  pdf.text("StockSense Inventory", 18, y + 26);
  pdf.text(`Prepared by: ${purchaseOrder.ownerName}`, 18, y + 33);
  pdf.text(`Contact: ${purchaseOrder.ownerEmail}`, 18, y + 40);

  pdf.setFillColor(...PO_PRIMARY_COLOR);
  pdf.rect(18, 66, 78, 8, "F");
  pdf.rect(118, 66, 74, 8, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(11);
  pdf.text("VENDOR", 22, 72);
  pdf.text("SHIP TO", 122, 72);
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(10);
  pdf.text(purchaseOrder.vendorName, 18, 82);
  pdf.text(purchaseOrder.vendorEmail, 18, 89);
  pdf.text(purchaseOrder.vendorAddress || "Address not available", 18, 96);
  pdf.text(purchaseOrder.ownerName, 118, 82);
  pdf.text("StockSense Inventory", 118, 89);
  pdf.text(purchaseOrder.ownerEmail, 118, 96);

  pdf.setFillColor(...PO_PRIMARY_COLOR);
  pdf.rect(18, 108, 174, 8, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.text("ITEM #", 28, 114);
  pdf.text("DESCRIPTION", 78, 114);
  pdf.text("QTY", 138, 114);
  pdf.text("UNIT PRICE", 154, 114);
  pdf.text("TOTAL", 184, 114);
  pdf.setTextColor(0, 0, 0);

  let rowY = 122;

  purchaseOrder.items.forEach((item) => {
    if (rowY > 238) {
      pdf.addPage();
      rowY = 20;
    }

    pdf.text(item.barcode || "-", 20, rowY);
    pdf.text(item.productName, 52, rowY);
    pdf.text(String(item.requiredStock), 140, rowY);
    pdf.text(formatCurrency(item.unitPrice), 157, rowY);
    pdf.text(formatCurrency(item.lineAmount), 184, rowY);
    rowY += 8;
  });

  pdf.setDrawColor(...PO_PRIMARY_COLOR);
  pdf.rect(18, 116, 32, 100);
  pdf.rect(50, 116, 72, 100);
  pdf.rect(122, 116, 22, 100);
  pdf.rect(144, 116, 26, 100);
  pdf.rect(170, 116, 22, 100);

  pdf.setFillColor(...PO_PRIMARY_COLOR);
  pdf.rect(18, 222, 104, 8, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.text("COMMENTS OR SPECIAL INSTRUCTIONS", 20, 228);
  pdf.setTextColor(0, 0, 0);

  pdf.text("SUBTOTAL", 142, 220);
  pdf.text(formatCurrency(purchaseOrder.finalAmount), 184, 220);
  pdf.text("TAX", 142, 228);
  pdf.text("-", 184, 228);
  pdf.text("SHIPPING", 142, 236);
  pdf.text("-", 184, 236);
  pdf.text("OTHER", 142, 244);
  pdf.text("-", 184, 244);
  pdf.setFillColor(...PO_TOTAL_HIGHLIGHT);
  pdf.rect(140, 248, 52, 8, "F");
  pdf.setFontSize(12);
  pdf.text("TOTAL", 142, 254);
  pdf.text(formatCurrency(purchaseOrder.finalAmount), 184, 254);

  pdf.setFontSize(10);
  pdf.text("Restock requirement as per current low stock levels.", 60, 276);

  return Buffer.from(pdf.output("arraybuffer"));
};

export const listPurchaseOrders = async () => PurchaseOrder.find().sort({ createdAt: -1 }).lean();

export const getPurchaseOrderById = async (id) => {
  const purchaseOrder = await PurchaseOrder.findById(id).lean();

  if (!purchaseOrder) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Purchase order not found");
  }

  return purchaseOrder;
};

export const generatePurchaseOrders = async ({ productIds, ownerName, ownerEmail }) => {
  const uniqueProductIds = [...new Set((productIds ?? []).filter(Boolean))];

  if (!uniqueProductIds.length) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Select at least one product to generate purchase orders");
  }

  const products = await Product.find({
    _id: { $in: uniqueProductIds },
    $expr: { $lt: ["$stock", "$threshold"] }
  }).lean();

  if (!products.length) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "No eligible low stock products found for the selected items");
  }

  const activePurchaseOrders = await PurchaseOrder.find({
    "items.productId": { $in: uniqueProductIds }
  }).lean();

  const activePoProductIds = new Set(
    activePurchaseOrders.flatMap((purchaseOrder) => purchaseOrder.items.map((item) => item.productId.toString()))
  );

  const eligibleProducts = products.filter((product) => !activePoProductIds.has(product._id.toString()));

  if (!eligibleProducts.length) {
    throw new ApiError(HTTP_STATUS.CONFLICT, "Selected low stock products already have active purchase orders");
  }

  const groupedByVendor = eligibleProducts.reduce((groups, product) => {
    if (!groups[product.vendorEmail]) {
      groups[product.vendorEmail] = {
        vendorEmail: product.vendorEmail,
        vendorName: product.vendorName,
        vendorAddress: product.vendorAddress,
        items: []
      };
    }

    const requiredStock = Math.max(Number(product.threshold) * 5 - Number(product.stock), 0);

    if (requiredStock > 0) {
      groups[product.vendorEmail].items.push({
        productId: product._id,
        productName: product.name,
        barcode: product.barcode,
        requiredStock,
        unitPrice: Number(product.cost ?? 0),
        lineAmount: requiredStock * Number(product.cost ?? 0)
      });
    }

    return groups;
  }, {});

  const purchaseOrders = [];

  for (const vendorGroup of Object.values(groupedByVendor)) {
    if (!vendorGroup.items.length) {
      continue;
    }

    const purchaseOrder = await PurchaseOrder.create({
      poNumber: createPurchaseOrderNumber(),
      ownerName,
      ownerEmail,
      vendorName: vendorGroup.vendorName,
      vendorEmail: vendorGroup.vendorEmail,
      vendorAddress: vendorGroup.vendorAddress,
      items: vendorGroup.items,
      finalAmount: vendorGroup.items.reduce((sum, item) => sum + item.lineAmount, 0),
      emailedAt: new Date()
    });

    const purchaseOrderObject = purchaseOrder.toObject();
    const pdfBuffer = buildPurchaseOrderPdfBuffer(purchaseOrderObject);

    await sendPurchaseOrderEmail({
      to: purchaseOrderObject.vendorEmail,
      vendorName: purchaseOrderObject.vendorName,
      purchaseOrder: purchaseOrderObject,
      pdfBuffer
    });

    purchaseOrders.push(purchaseOrderObject);
  }

  return purchaseOrders;
};

export const syncPurchaseOrdersForProduct = async (product) => {
  if (product.stock < product.threshold) {
    return;
  }

  const purchaseOrders = await PurchaseOrder.find({ "items.productId": product._id });

  for (const purchaseOrder of purchaseOrders) {
    purchaseOrder.items = purchaseOrder.items.filter((item) => item.productId.toString() !== product._id.toString());
    purchaseOrder.finalAmount = purchaseOrder.items.reduce((sum, item) => sum + Number(item.lineAmount ?? 0), 0);

    if (!purchaseOrder.items.length) {
      await PurchaseOrder.deleteOne({ _id: purchaseOrder._id });
      continue;
    }

    await purchaseOrder.save();
  }
};
