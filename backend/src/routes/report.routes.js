import { Router } from "express";
import {
  dailySalesReport,
  monthlySalesReport,
  topProductsReport,
  totalProfitReport,
  weeklyProfitReport,
  itemWiseSalesReport,
  categoryProfitReport,
  lowStockPurchaseOrdersReport
} from "../controllers/report.controller.js";
import { protect } from "../middleware/protect.js";
import { authorize } from "../middleware/authorize.js";

const router = Router();

router.use(protect);
router.use(authorize("owner", "admin"));
router.get("/daily-sales", dailySalesReport);
router.get("/monthly-sales", monthlySalesReport);
router.get("/top-products", topProductsReport);
router.get("/total-profit", totalProfitReport);
router.get("/weekly-profit", weeklyProfitReport);
router.get("/item-wise-sales", itemWiseSalesReport);
router.get("/category-profit", categoryProfitReport);
router.get("/purchase-orders/low-stock", lowStockPurchaseOrdersReport);

export default router;
