import { HTTP_STATUS } from "../constants/httpStatus.js";
import { ApiError } from "../utils/ApiError.js";
import {
  registerUser,
  verifyRegistrationOtp,
  loginUser,
  forgotPassword as forgotPasswordService,
  resetPassword as resetPasswordService
} from "../services/auth.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/User.js";

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Name, email, and password are required");
  }

  const result = await registerUser({ ...req.body, role: "owner" });
  res.status(HTTP_STATUS.CREATED).json(result);
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Email and OTP are required");
  }

  const user = await verifyRegistrationOtp({ email, otp });
  res.status(HTTP_STATUS.OK).json({
    message: "Registration complete. You can log in now.",
    data: user
  });
});

export const registerStaff = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Name, email, and password are required");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw new ApiError(HTTP_STATUS.CONFLICT, "A user already exists with this email");
  }

  const bcrypt = (await import("bcrypt")).default;
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email: normalizedEmail,
    password: hashedPassword,
    role: "staff",
    ownerId: req.user.id
  });

  res.status(HTTP_STATUS.CREATED).json({
    message: "Staff member registered successfully.",
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

export const deregisterStaff = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Staff email is required");
  }

  const staff = await User.findOne({ email, role: "staff" });

  if (!staff) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Staff member not found");
  }

  // Security: Owners can only deregister staff registered under them
  if (req.user.role === "owner" && staff.ownerId?.toString() !== req.user.id.toString()) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, "You are not authorized to deregister this staff member");
  }

  await User.deleteOne({ _id: staff._id });

  res.status(HTTP_STATUS.OK).json({
    message: "Staff member deregistered successfully"
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Email and password are required");
  }

  const result = await loginUser({ email, password });
  res.status(HTTP_STATUS.OK).json(result);
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Email is required");
  }

  const result = await forgotPasswordService(email);
  res.status(HTTP_STATUS.OK).json(result);
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Email, OTP, and new password are required");
  }

  const result = await resetPasswordService({ email, otp, newPassword });
  res.status(HTTP_STATUS.OK).json(result);
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "User not found");
  }
  res.status(HTTP_STATUS.OK).json({
    data: sanitizeUser(user)
  });
});
