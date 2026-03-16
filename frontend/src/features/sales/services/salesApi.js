import { API } from "../../../services/api.js";

export const fetchSalesRecords = async () => {
  const response = await API.get("/sales");
  return response.data.data;
};

export const fetchSaleRecord = async (billNumber) => {
  const response = await API.get(`/sales/${billNumber}`);
  return response.data.data;
};
