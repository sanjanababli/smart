import { Router } from "express";
import authRoutes from "./auth.routes.js";
import healthRoutes from "./health.routes.js";
import inventoryRoutes from "./inventory.routes.js";
import productRoutes from "./product.routes.js";
import purchaseOrderRoutes from "./purchaseOrder.routes.js";
import reportRoutes from "./report.routes.js";
import saleRoutes from "./sale.routes.js";
import vendorRoutes from "./vendor.routes.js";
import aiRoutes from "./aiRoutes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/health", healthRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/products", productRoutes);
router.use("/purchase-orders", purchaseOrderRoutes);
router.use("/reports", reportRoutes);
router.use("/sales", saleRoutes);
router.use("/vendors", vendorRoutes);
router.use("/ai", aiRoutes);

export default router;
