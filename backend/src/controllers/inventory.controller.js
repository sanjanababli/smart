import { HTTP_STATUS } from "../constants/httpStatus.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  listInventory,
  getInventoryById,
  createInventory,
  updateInventory,
  deleteInventory
} from "../services/inventory.service.js";

export const getInventoryItems = asyncHandler(async (req, res) => {
  const items = await listInventory();
  res.status(HTTP_STATUS.OK).json({ data: items });
});

export const getInventoryItemById = asyncHandler(async (req, res) => {
  const item = await getInventoryById(req.params.id);
  res.status(HTTP_STATUS.OK).json({ data: item });
});

export const createInventoryItem = asyncHandler(async (req, res) => {
  const item = await createInventory(req.body);
  res.status(HTTP_STATUS.CREATED).json({ data: item });
});

export const updateInventoryItem = asyncHandler(async (req, res) => {
  const item = await updateInventory(req.params.id, req.body);
  res.status(HTTP_STATUS.OK).json({ data: item });
});

export const deleteInventoryItem = asyncHandler(async (req, res) => {
  await deleteInventory(req.params.id);
  res.status(HTTP_STATUS.NO_CONTENT).send();
});
