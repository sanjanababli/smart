import { API } from "../../../services/api.js";

export const fetchProducts = async (params = {}) => {
  const response = await API.get("/products", { params });
  return response.data.data;
};

export const createProduct = async (payload) => {
  const response = await API.post("/products", payload);
  return response.data.data;
};

export const updateProduct = async (id, payload) => {
  const response = await API.patch(`/products/${id}`, payload);
  return response.data.data;
};

export const deleteProduct = async (id) => {
  await API.delete(`/products/${id}`);
};
