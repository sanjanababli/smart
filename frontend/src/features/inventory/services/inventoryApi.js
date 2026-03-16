import { inventoryAPI } from "../../../services/api.js";

export const fetchInventoryItems = async () => {
  const response = await inventoryAPI.list();
  return response.data.data;
};
