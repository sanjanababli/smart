import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

API.interceptors.request.use((config) => {
  const token = window.localStorage.getItem("smart_inventory_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.localStorage.removeItem("smart_inventory_token");
      window.localStorage.removeItem("smart_inventory_user");
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (payload) => API.post("/auth/register", payload),
  verifyRegistrationOtp: (payload) => API.post("/auth/register/verify-otp", payload),
  login: (email, password) => API.post("/auth/login", { email, password }),
  registerStaff: (payload) => API.post("/auth/register-staff", payload),
  deregisterStaff: (payload) => API.delete("/auth/deregister-staff", { data: payload }),
  forgotPassword: (email) => API.post("/auth/forgot-password", { email }),
  resetPassword: (payload) => API.post("/auth/reset-password", payload)
};

export const inventoryAPI = {
  list: () => API.get("/inventory")
};

export const productsAPI = {
  list: (params) => API.get("/products", { params }),
  create: (payload) => API.post("/products", payload),
  update: (id, payload) => API.patch(`/products/${id}`, payload),
  remove: (id) => API.delete(`/products/${id}`)
};

export const purchaseOrderAPI = {
  list: () => API.get("/purchase-orders"),
  generate: (productIds) => API.post("/purchase-orders/generate", { productIds }),
  downloadPdf: (id) =>
    API.get(`/purchase-orders/${id}/pdf`, {
      responseType: "blob"
    })
};

export const vendorAPI = {
  list: () => API.get("/vendors"),
  create: (payload) => API.post("/vendors", payload)
};
