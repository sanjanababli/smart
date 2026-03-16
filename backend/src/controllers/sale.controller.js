import { HTTP_STATUS } from "../constants/httpStatus.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  checkoutSale,
  getProductForScan,
  getSaleRecordByBillNumber,
  listSalesRecords
} from "../services/sale.service.js";

export const scanProduct = asyncHandler(async (req, res) => {
  const { barcode } = req.params;

  if (!barcode) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Barcode is required");
  }

  const product = await getProductForScan(barcode);
  res.status(HTTP_STATUS.OK).json({ data: product });
});

export const checkout = asyncHandler(async (req, res) => {
  const result = await checkoutSale({
    items: req.body.items,
    billerId: req.user?.id
  });
  res.status(HTTP_STATUS.CREATED).json({ data: result });
});

export const getSalesRecords = asyncHandler(async (_req, res) => {
  const result = await listSalesRecords();
  res.status(HTTP_STATUS.OK).json({ data: result });
});

export const getSaleRecord = asyncHandler(async (req, res) => {
  const result = await getSaleRecordByBillNumber(req.params.billNumber);
  res.status(HTTP_STATUS.OK).json({ data: result });
});
