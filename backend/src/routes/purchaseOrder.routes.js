import { Router } from "express";
import {
  createPurchaseOrders,
  downloadPurchaseOrderPdf,
  getPurchaseOrders
} from "../controllers/purchaseOrder.controller.js";
import { authorize } from "../middleware/authorize.js";
import { protect } from "../middleware/protect.js";

const router = Router();

router.use(protect);
router.use(authorize("owner", "admin"));

router.get("/", getPurchaseOrders);
router.post("/generate", createPurchaseOrders);
router.get("/:id/pdf", downloadPurchaseOrderPdf);

export default router;
