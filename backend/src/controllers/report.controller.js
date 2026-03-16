import { HTTP_STATUS } from "../constants/httpStatus.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getDailySalesReport,
  getMonthlySalesReport,
  getTopProductsReport,
  getTotalProfitReport,
  getWeeklyProfitReport,
  getItemWiseSalesForDate,
  getCategoryProfitReport,
  getLowStockPurchaseOrdersReport
} from "../services/report.service.js";

export const dailySalesReport = asyncHandler(async (_req, res) => {
  try {
    const data = await getDailySalesReport();
    res.status(HTTP_STATUS.OK).json({ data });
  } catch (err) {
    console.error("DAILY SALES ERROR:", err);
    throw err;
  }
});

export const monthlySalesReport = asyncHandler(async (_req, res) => {
  const data = await getMonthlySalesReport();
  res.status(HTTP_STATUS.OK).json({ data });
});

export const topProductsReport = asyncHandler(async (_req, res) => {
  const data = await getTopProductsReport();
  res.status(HTTP_STATUS.OK).json({ data });
});

export const totalProfitReport = asyncHandler(async (_req, res) => {
  const data = await getTotalProfitReport();
  res.status(HTTP_STATUS.OK).json({ data });
});

export const weeklyProfitReport = asyncHandler(async (_req, res) => {
  const data = await getWeeklyProfitReport();
  res.status(HTTP_STATUS.OK).json({ data });
});

export const itemWiseSalesReport = asyncHandler(async (req, res) => {
  const { date, period } = req.query;
  const data = await getItemWiseSalesForDate(date, period);
  res.status(HTTP_STATUS.OK).json({ data });
});

export const categoryProfitReport = asyncHandler(async (_req, res) => {
  const data = await getCategoryProfitReport();
  res.status(HTTP_STATUS.OK).json({ data });
});

export const lowStockPurchaseOrdersReport = asyncHandler(async (_req, res) => {
  const data = await getLowStockPurchaseOrdersReport();
  res.status(HTTP_STATUS.OK).json({ data });
});
