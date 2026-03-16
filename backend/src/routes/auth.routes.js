import { Router } from "express";
import {
  login,
  register,
  verifyOtp,
  registerStaff,
  deregisterStaff,
  forgotPassword,
  resetPassword,
  getMe
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/protect.js";
import { authorize } from "../middleware/authorize.js";

const router = Router();

router.post("/register", register);
router.post("/register/verify-otp", verifyOtp);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/login", login);
router.get("/me", protect, getMe);
router.post("/register-staff", protect, authorize("owner", "admin"), registerStaff);
router.delete("/deregister-staff", protect, authorize("owner", "admin"), deregisterStaff);

export default router;
