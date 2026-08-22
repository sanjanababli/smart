import { useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import ProductFilters from "../features/products/components/ProductFilters.jsx";
import ProductForm from "../features/products/components/ProductForm.jsx";
import ProductTable from "../features/products/components/ProductTable.jsx";
import { useProducts } from "../features/products/hooks/useProducts.js";
import AppSidebar from "./AppSidebar.jsx";

const ProductsPage = ({ setCurrentPage }) => {
  const { user, logout } = useAuth();
  const [selectedProduct,   setSelectedProduct]   = useState(null);
  const [showForm,          setShowForm]          = useState(false);
  const [showFilters,       setShowFilters]       = useState(false);
  const [showStockPanel,    setShowStockPanel]    = useState(false);
  const [activeTab,         setActiveTab]         = useState("all");
  const [searchTerm,        setSearchTerm]        = useState("");
  const [stockBarcode,      setStockBarcode]      = useState("");
  const [newStockCount,     setNewStockCount]     = useState("");
  const [stockUpdateError,  setStockUpdateError]  = useState("");
  const [stockUpdateSuccess,setStockUpdateSuccess]= useState("");
  const [isUpdatingStock,   setIsUpdatingStock]   = useState(false);

  const { products, filters, isLoading, error, applyFilters, saveProduct, removeProduct } = useProducts();

  const categories = useMemo(() => {
    const cats = {};
    products.forEach((p) => { cats[p.category] = (cats[p.category] || 0) + 1; });
    return cats;
  }, [products]);

  const displayProducts = useMemo(() => {
    let filtered = products;
    if (activeTab !== "all") filtered = filtered.filter((p) => p.category === activeTab);
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        p.barcode.toLowerCase().includes(term)
      );
    }
    return filtered;
  }, [products, activeTab, searchTerm]);

  const handleSave = async (product) => {
    const result = await saveProduct(product);
    if (result.success) { setSelectedProduct(null); setShowForm(false); }
    return result;
  };

  const handleEdit   = (product) => { setSelectedProduct(product); setShowForm(true); };
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    await removeProduct(id);
  };
  const handleCloseForm = () => { setSelectedProduct(null); setShowForm(false); };

  const handleStockUpdate = async (e) => {
    e.preventDefault();
    setStockUpdateError(""); setStockUpdateSuccess(""); setIsUpdatingStock(true);
    try {
      const { API } = await import("../services/api.js");
      const response = await API.patch("/products/stock/barcode", { barcode: stockBarcode, count: Number(newStockCount) });
      setStockUpdateSuccess(`Stock updated for ${response.data?.data?.name || "product"}.`);
      setStockBarcode(""); setNewStockCount("");
    } catch (err) {
      setStockUpdateError(err.response?.data?.message || "Failed to update stock");
    }
    setIsUpdatingStock(false);
  };

  return (
    <div className="db-root">
      <AppSidebar setCurrentPage={setCurrentPage} user={user} logout={logout} activePage="products" />

      <main className="db-main">
        <div className="pp-header">
          <div>
            <h1 className="pp-title">Products <span className="pp-title-badge">{products.length}</span></h1>
            <div className="db-subgreeting">Manage your product catalog, stock levels and categories.</div>
          </div>
          <div className="pp-header-actions">
            <button type="button" className={`pp-filter-btn ${showStockPanel ? "active" : ""}`} onClick={() => setShowStockPanel((c) => !c)}>
              Stock Update
            </button>
            <button type="button" className="db-action-btn" onClick={() => { setSelectedProduct(null); setShowForm(true); }}>
              + Add Product
            </button>
          </div>
        </div>

        {showStockPanel && (
          <div className="pp-stock-panel">
            <h3>Update Stock by Barcode</h3>
            <form className="pp-stock-form" onSubmit={handleStockUpdate}>
              <div className="pp-form-group">
                <label className="pp-form-label">Barcode</label>
                <input className="pp-form-input" type="text" placeholder="Scan or enter barcode" value={stockBarcode} onChange={(e) => setStockBarcode(e.target.value)} required />
              </div>
              <div className="pp-form-group">
                <label className="pp-form-label">Quantity to Add</label>
                <input className="pp-form-input" type="number" min="1" step="1" placeholder="Enter count" value={newStockCount} onChange={(e) => setNewStockCount(e.target.value)} required />
              </div>
              <button type="submit" className="pp-btn-primary" disabled={isUpdatingStock}>
                {isUpdatingStock ? "Updating..." : "Add to Stock"}
              </button>
            </form>
            {stockUpdateError   && <div className="pp-stock-msg error">{stockUpdateError}</div>}
            {stockUpdateSuccess && <div className="pp-stock-msg success">{stockUpdateSuccess}</div>}
          </div>
        )}

        <div className="pp-tabs">
          <button type="button" className={`pp-tab ${activeTab === "all" ? "active" : ""}`} onClick={() => setActiveTab("all")}>
            All Products <span className="pp-tab-count">{products.length}</span>
          </button>
          {Object.entries(categories).map(([cat, count]) => (
            <button key={cat} type="button" className={`pp-tab ${activeTab === cat ? "active" : ""}`} onClick={() => setActiveTab(cat)}>
              {cat} <span className="pp-tab-count">{count}</span>
            </button>
          ))}
        </div>

        <div className="pp-toolbar">
          <div className="pp-search-wrap">
            <span className="pp-search-icon">&#x2315;</span>
            <input className="pp-search" type="text" placeholder="Search by name, category, or barcode..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button type="button" className={`pp-filter-btn ${showFilters ? "active" : ""}`} onClick={() => setShowFilters((c) => !c)}>
            Filter
          </button>
        </div>

        {showFilters && (
          <ProductFilters currentFilters={filters} onApply={applyFilters} onClose={() => setShowFilters(false)} />
        )}

        {error && <div className="error-text" style={{ marginBottom: 14 }}>{error}</div>}

        {isLoading ? (
          <div className="pp-loading"><div className="pp-spinner" />Loading products...</div>
        ) : (
          <div className="pp-table-panel">
            <div className="pp-table-header">
              <span className="pp-table-info">Showing {displayProducts.length} of {products.length} products</span>
            </div>
            <ProductTable products={displayProducts} onEdit={handleEdit} onDelete={handleDelete} />
          </div>
        )}

        <ProductForm isOpen={showForm} selectedProduct={selectedProduct} onSubmit={handleSave} onCancel={handleCloseForm} onClose={handleCloseForm} />
      </main>
    </div>
  );
};

export default ProductsPage;