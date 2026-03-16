import { Router } from "express";
import {
  getInventoryItems,
  getInventoryItemById,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem
} from "../controllers/inventory.controller.js";
import { protect } from "../middleware/protect.js";
import { authorize } from "../middleware/authorize.js";
import { validateObjectId } from "../middleware/validateObjectId.js";

const router = Router();

router.use(protect);
router.use(authorize("owner", "admin"));
router.get("/", getInventoryItems);
router.post("/", createInventoryItem);
router.get("/:id", validateObjectId, getInventoryItemById);
router.patch("/:id", validateObjectId, updateInventoryItem);
router.delete("/:id", validateObjectId, deleteInventoryItem);

export default router;
