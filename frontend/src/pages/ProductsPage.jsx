import { useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import ProductFilters from "../features/products/components/ProductFilters.jsx";
import ProductForm from "../features/products/components/ProductForm.jsx";
import ProductTable from "../features/products/components/ProductTable.jsx";
import { useProducts } from "../features/products/hooks/useProducts.js";


const ProductsPage = ({ setCurrentPage }) => {
  const { user, logout } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showStockPanel, setShowStockPanel] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Stock update state
  const [stockBarcode, setStockBarcode] = useState("");
  const [newStockCount, setNewStockCount] = useState("");
  const [stockUpdateError, setStockUpdateError] = useState("");
  const [stockUpdateSuccess, setStockUpdateSuccess] = useState("");
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);

  const { products, filters, isLoading, error, applyFilters, saveProduct, removeProduct } =
    useProducts();

  // Derive categories from products
  const categories = useMemo(() => {
    const cats = {};
    products.forEach((p) => {
      cats[p.category] = (cats[p.category] || 0) + 1;
    });
    return cats;
  }, [products]);

  // Filter products by active tab and search
  const displayProducts = useMemo(() => {
    let filtered = products;

    // Category tab filter
    if (activeTab !== "all") {
      filtered = filtered.filter((p) => p.category === activeTab);
    }

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.category.toLowerCase().includes(term) ||
          p.barcode.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [products, activeTab, searchTerm]);

  const handleSave = async (product) => {
    const result = await saveProduct(product);
    if (result.success) {
      setSelectedProduct(null);
      setShowForm(false);
    }
    return result;
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Delete this product?");
    if (!confirmed) return;
    await removeProduct(id);
  };

  const handleCloseForm = () => {
    setSelectedProduct(null);
    setShowForm(false);
  };

  const handleStockUpdate = async (event) => {
    event.preventDefault();
    setStockUpdateError("");
    setStockUpdateSuccess("");
    setIsUpdatingStock(true);

    try {
      const { API } = await import("../services/api.js");
      const response = await API.patch("/products/stock/barcode", {
        barcode: stockBarcode,
        count: Number(newStockCount)
      });
      setStockUpdateSuccess(
        `Stock updated successfully for ${response.data?.data?.name || "product"}.`
      );
      setStockBarcode("");
      setNewStockCount("");
    } catch (err) {
      setStockUpdateError(err.response?.data?.message || "Failed to update stock");
    }

    setIsUpdatingStock(false);
  };

  return (
    <div className="db-root">
      {/* SIDEBAR */}
      <aside className="db-sidebar">
        <div className="db-logo">
          <div className="db-logo-icon">S</div>
          <span>StockSense</span>
        </div>
        <nav className="db-nav">
          {[
            { icon: "⊞", label: "Dashboard", page: "dashboard" },
            // { icon: "📦", label: "Inventory", page: "inventory" },
            { icon: "🏷️", label: "Products", page: "products" },
            { icon: "🧾", label: "Billing", page: "billing" },
            { icon: "📊", label: "Sales", page: "sales" },
          ].map(({ icon, label, page }) => (
            <button
              key={label}
              className={`db-nav-item ${page === "products" ? "active" : ""}`}
              onClick={() => setCurrentPage && setCurrentPage(page === "dashboard" ? null : page)}
            >
              <span className="db-nav-icon">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
          <button className="db-nav-item" onClick={() => setCurrentPage && setCurrentPage("reports")}>
            <span className="db-nav-icon">📋</span><span>Reports</span>
          </button>
          {(user?.role === "owner" || user?.role === "admin") && (
            <button className="db-nav-item" onClick={() => setCurrentPage && setCurrentPage("staff")}>
              <span className="db-nav-icon">👥</span><span>Staff</span>
            </button>
          )}
          <button 
            className="db-nav-item" 
            onClick={logout} 
            style={{ marginTop: "auto", color: "rgba(248,113,113,0.8)" }}
          >
            <span className="db-nav-icon">🚪</span><span>Logout</span>
          </button>
        </nav>
        <div 
          className="db-user-pill" 
          onClick={() => setCurrentPage && setCurrentPage("profile")}
          style={{ cursor: "pointer" }}
        >
          <div className="db-avatar">{user?.name?.[0]?.toUpperCase() || "U"}</div>
          <div>
            <div className="db-user-name">{user?.name || "User"}</div>
            <div className="db-user-role">{user?.role || "staff"}</div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="db-main">
        {/* Page Header */}
        <div className="pp-header">
          <h1 className="pp-title">
            Products
            <span className="pp-title-badge">{products.length}</span>
          </h1>
          <div className="pp-header-actions">
            <button
              type="button"
              className={`pp-filter-btn ${showStockPanel ? "active" : ""}`}
              onClick={() => setShowStockPanel((c) => !c)}
            >
              📦 Stock Update
            </button>
            <button
              type="button"
              className="db-action-btn"
              onClick={() => { setSelectedProduct(null); setShowForm(true); }}
            >
              + Add Product
            </button>
          </div>
        </div>

        {/* Stock Update Panel */}
        {showStockPanel && (
          <div className="pp-stock-panel">
            <h3>Update Stock by Barcode</h3>
            <form className="pp-stock-form" onSubmit={handleStockUpdate}>
              <div className="pp-form-group">
                <label className="pp-form-label">Barcode</label>
                <input
                  className="pp-form-input"
                  type="text"
                  placeholder="Scan or enter barcode"
                  value={stockBarcode}
                  onChange={(e) => setStockBarcode(e.target.value)}
                  required
                />
              </div>
              <div className="pp-form-group">
                <label className="pp-form-label">Quantity to Add</label>
                <input
                  className="pp-form-input"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Enter count"
                  value={newStockCount}
                  onChange={(e) => setNewStockCount(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="pp-btn-primary" disabled={isUpdatingStock}>
                {isUpdatingStock ? "Updating..." : "Add to Stock"}
              </button>
            </form>
            {stockUpdateError && <div className="pp-stock-msg error">{stockUpdateError}</div>}
            {stockUpdateSuccess && <div className="pp-stock-msg success">{stockUpdateSuccess}</div>}
          </div>
        )}

        {/* Category Tabs */}
        <div className="pp-tabs">
          <button
            type="button"
            className={`pp-tab ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All Products
            <span className="pp-tab-count">{products.length}</span>
          </button>
          {Object.entries(categories).map(([cat, count]) => (
            <button
              key={cat}
              type="button"
              className={`pp-tab ${activeTab === cat ? "active" : ""}`}
              onClick={() => setActiveTab(cat)}
            >
              {cat}
              <span className="pp-tab-count">{count}</span>
            </button>
          ))}
        </div>

        {/* Toolbar: Search + Filter toggle */}
        <div className="pp-toolbar">
          <div className="pp-search-wrap">
            <span className="pp-search-icon">🔍</span>
            <input
              className="pp-search"
              type="text"
              placeholder="Search by product name, category, or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            type="button"
            className={`pp-filter-btn ${showFilters ? "active" : ""}`}
            onClick={() => setShowFilters((c) => !c)}
          >
            🎛️ Filter
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <ProductFilters
            currentFilters={filters}
            onApply={applyFilters}
            onClose={() => setShowFilters(false)}
          />
        )}

        {/* Error */}
        {error && <div className="pp-form-error" style={{ marginBottom: "1rem" }}>{error}</div>}

        {/* Table */}
        {isLoading ? (
          <div className="pp-loading">
            <div className="pp-spinner" />
            Loading products...
          </div>
        ) : (
          <div className="pp-table-panel">
            <div className="pp-table-header">
              <span className="pp-table-info">
                Showing {displayProducts.length} of {products.length} products
              </span>
            </div>
            <ProductTable
              products={displayProducts}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        )}

        {/* Add/Edit Modal */}
        <ProductForm
          isOpen={showForm}
          selectedProduct={selectedProduct}
          onSubmit={handleSave}
          onCancel={handleCloseForm}
          onClose={handleCloseForm}
        />
      </main>
    </div>
  );
};

export default ProductsPage;