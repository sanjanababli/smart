import { Router } from "express";
import { createVendor, getVendors } from "../controllers/vendor.controller.js";
import { authorize } from "../middleware/authorize.js";
import { protect } from "../middleware/protect.js";

const router = Router();

router.use(protect);

router.get("/", getVendors);
router.post("/", authorize("owner", "admin"), createVendor);

export default router;
