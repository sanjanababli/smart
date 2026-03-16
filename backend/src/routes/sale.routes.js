import { Router } from "express";
import { checkout, getSaleRecord, getSalesRecords, scanProduct } from "../controllers/sale.controller.js";
import { protect } from "../middleware/protect.js";

const router = Router();

router.use(protect);
router.get("/", getSalesRecords);
router.get("/scan/:barcode", scanProduct);
router.get("/:billNumber", getSaleRecord);
router.post("/checkout", checkout);

export default router;
