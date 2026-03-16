import { Router } from "express";
import {
  createProduct,
  getProducts,
  getProduct,
  getProductByBarcode,
  updateProduct,
  deleteProduct,
  updateProductStockByBarcode
} from "../controllers/product.controller.js";
import { protect } from "../middleware/protect.js";
import { authorize } from "../middleware/authorize.js";
import { validateObjectId } from "../middleware/validateObjectId.js";

const router = Router();

router.use(protect);
router.use(authorize("owner", "admin"));
router.patch("/stock/barcode", updateProductStockByBarcode);
router.post("/", createProduct);
router.get("/", getProducts);
router.get("/barcode/:barcode", getProductByBarcode);
router.get("/:id", validateObjectId, getProduct);
router.patch("/:id", validateObjectId, updateProduct);
router.delete("/:id", validateObjectId, deleteProduct);

export default router;
