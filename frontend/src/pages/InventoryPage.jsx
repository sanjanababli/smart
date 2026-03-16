import InventoryTable from "../features/inventory/components/InventoryTable";
import { useInventory } from "../features/inventory/hooks/useInventory";

const InventoryPage = () => {
  const { items, isLoading, error } = useInventory();

  return (
    <section className="dashboard-panel">
      <h2>Inventory</h2>
      <p>This request sends the JWT token automatically in the `Authorization` header.</p>
      {isLoading && <p>Loading inventory...</p>}
      {error && <p className="error-text">{error}</p>}
      {!isLoading && !error && <InventoryTable items={items} />}
    </section>
  );
};

export default InventoryPage;
