import { useEffect, useState } from "react";
import { fetchInventoryItems } from "../services/inventoryApi.js";

export const useInventory = () => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const data = await fetchInventoryItems();
        setItems(data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load inventory");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  return { items, isLoading, error };
};
