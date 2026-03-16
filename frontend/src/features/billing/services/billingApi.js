import { API } from "../../../services/api.js";

export const scanProductByBarcode = async (barcode) => {
  const response = await API.get(`/sales/scan/${barcode}`);
  return response.data.data;
};

export const checkoutCart = async (items) => {
  const response = await API.post("/sales/checkout", { items });
  return response.data.data;
};
