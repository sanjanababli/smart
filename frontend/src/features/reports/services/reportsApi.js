import { API } from "../../../services/api.js";

export const fetchDailySalesReport = async () => {
  const response = await API.get("/reports/daily-sales");
  return response.data.data;
};

export const fetchMonthlySalesReport = async () => {
  const response = await API.get("/reports/monthly-sales");
  return response.data.data;
};

export const fetchWeeklyProfitReport = async () => {
  const response = await API.get("/reports/weekly-profit");
  return response.data.data;
};

export const fetchMonthlyProfitReport = async () => {
  const response = await API.get("/reports/monthly-sales"); // Reusing same endpoint as it returns profit too
  return response.data.data;
};

export const fetchItemWiseSalesReport = async ({ date, period }) => {
  const response = await API.get("/reports/item-wise-sales", { params: { date, period } });
  return response.data.data;
};

export const fetchCategoryProfitReport = async () => {
  const response = await API.get("/reports/category-profit");
  return response.data.data;
};

export const fetchTopProductsReport = async () => {
  const response = await API.get("/reports/top-products");
  return response.data.data;
};

export const fetchTotalProfitReport = async () => {
  const response = await API.get("/reports/total-profit");
  return response.data.data;
};

export const fetchLowStockPurchaseOrdersReport = async () => {
  const response = await API.get("/reports/purchase-orders/low-stock");
  return response.data.data;
};

export const fetchGeneratedPurchaseOrders = async () => {
  const response = await API.get("/purchase-orders");
  return response.data.data;
};

export const generatePurchaseOrders = async (productIds) => {
  const response = await API.post("/purchase-orders/generate", { productIds });
  return response.data;
};

export const downloadPurchaseOrderPdf = async (id) => {
  const response = await API.get(`/purchase-orders/${id}/pdf`, { responseType: "blob" });
  return response.data;
};
