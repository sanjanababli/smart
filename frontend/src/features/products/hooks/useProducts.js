import { useEffect, useState } from "react";
import {
  createProduct,
  deleteProduct,
  fetchProducts,
  updateProduct
} from "../services/productApi.js";

const defaultFilters = {
  search: "",
  category: "",
  minPrice: "",
  maxPrice: "",
  inStock: false
};

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProducts = async (nextFilters = filters) => {
    try {
      setIsLoading(true);
      setError("");
      const params = {
        ...nextFilters,
        inStock: nextFilters.inStock ? "true" : undefined
      };
      const data = await fetchProducts(params);
      setProducts(data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to load products");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts(filters);
  }, []);

  const applyFilters = async (nextFilters) => {
    setFilters(nextFilters);
    await loadProducts(nextFilters);
  };

  const saveProduct = async (product) => {
    try {
      setError("");

      if (product._id) {
        await updateProduct(product._id, product);
      } else {
        await createProduct(product);
      }

      await loadProducts(filters);
      return { success: true };
    } catch (requestError) {
      return {
        success: false,
        message: requestError.response?.data?.message || "Failed to save product"
      };
    }
  };

  const removeProduct = async (id) => {
    try {
      setError("");
      await deleteProduct(id);
      await loadProducts(filters);
      return { success: true };
    } catch (requestError) {
      return {
        success: false,
        message: requestError.response?.data?.message || "Failed to delete product"
      };
    }
  };

  return {
    products,
    filters,
    isLoading,
    error,
    applyFilters,
    saveProduct,
    removeProduct
  };
};
