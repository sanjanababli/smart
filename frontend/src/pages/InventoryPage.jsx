import { useAuth } from "../context/AuthContext.jsx";
import InventoryTable from "../features/inventory/components/InventoryTable";
import { useInventory } from "../features/inventory/hooks/useInventory";
import Appsidebar from "./AppSidebar.jsx";

const InventoryPage = ({ setCurrentPage }) => {
  const { user, logout } = useAuth();
  const { items, isLoading, error } = useInventory();

  return (
    <div className="db-root">
      <AppSidebar setCurrentPage={setCurrentPage} user={user} logout={logout} activePage="inventory" />

      <main className="db-main">
        <div className="db-topbar">
          <div>
            <div className="db-greeting">Inventory</div>
            <div className="db-subgreeting">Track stock levels and movements across your store.</div>
          </div>
        </div>

        {error && <div className="error-text" style={{ marginBottom: 14 }}>{error}</div>}

        {isLoading ? (
          <div className="pp-loading"><div className="pp-spinner" />Loading inventory...</div>
        ) : (
          <div className="pp-table-panel">
            <div className="pp-table-header">
              <div className="db-panel-title">All Items</div>
              <span className="pp-table-info">{items?.length ?? 0} records</span>
            </div>
            <InventoryTable items={items} />
          </div>
        )}
      </main>
    </div>
  );
};

export default InventoryPage;