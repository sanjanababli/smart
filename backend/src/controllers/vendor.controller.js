import { HTTP_STATUS } from "../constants/httpStatus.js";
import { Vendor } from "../models/Vendor.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createVendor = asyncHandler(async (req, res) => {
  const { name, email, phoneNumber, address } = req.body;

  if (!name || !email || !phoneNumber || !address) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Name, email, phone number, and address are required");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingVendor = await Vendor.findOne({ email: normalizedEmail });

  if (existingVendor) {
    throw new ApiError(HTTP_STATUS.CONFLICT, "Vendor already exists with this email");
  }

  const vendor = await Vendor.create({
    name,
    email: normalizedEmail,
    phoneNumber,
    address
  });

  res.status(HTTP_STATUS.CREATED).json({ data: vendor });
});

export const getVendors = asyncHandler(async (_req, res) => {
  const vendors = await Vendor.find().sort({ name: 1, createdAt: -1 });
  res.status(HTTP_STATUS.OK).json({ data: vendors });
});
