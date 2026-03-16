import { HTTP_STATUS } from "../constants/httpStatus.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  buildPurchaseOrderPdfBuffer,
  generatePurchaseOrders,
  getPurchaseOrderById,
  listPurchaseOrders
} from "../services/purchaseOrder.service.js";

export const createPurchaseOrders = asyncHandler(async (req, res) => {
  const { productIds } = req.body;

  if (!Array.isArray(productIds) || !productIds.length) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Product ids are required");
  }

  const data = await generatePurchaseOrders({
    productIds,
    ownerName: req.user.name,
    ownerEmail: req.user.email
  });

  res.status(HTTP_STATUS.CREATED).json({
    data,
    message: "Purchase orders generated and emailed to vendors successfully."
  });
});

export const getPurchaseOrders = asyncHandler(async (_req, res) => {
  const data = await listPurchaseOrders();
  res.status(HTTP_STATUS.OK).json({ data });
});

export const downloadPurchaseOrderPdf = asyncHandler(async (req, res) => {
  const purchaseOrder = await getPurchaseOrderById(req.params.id);
  const pdfBuffer = buildPurchaseOrderPdfBuffer(purchaseOrder);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${purchaseOrder.poNumber}.pdf"`);
  res.status(HTTP_STATUS.OK).send(pdfBuffer);
});
