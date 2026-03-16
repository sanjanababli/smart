import { InventoryItem } from "../models/InventoryItem.js";
import { ApiError } from "../utils/ApiError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

export const listInventory = async () => {
  return InventoryItem.find().sort({ createdAt: -1 });
};

export const getInventoryById = async (id) => {
  const item = await InventoryItem.findById(id);
  if (!item) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Inventory item not found");
  }
  return item;
};

export const createInventory = async (payload) => {
  return InventoryItem.create(payload);
};

export const updateInventory = async (id, payload) => {
  const item = await InventoryItem.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true
  });

  if (!item) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Inventory item not found");
  }

  return item;
};

export const deleteInventory = async (id) => {
  const item = await InventoryItem.findByIdAndDelete(id);
  if (!item) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Inventory item not found");
  }
  return item;
};
