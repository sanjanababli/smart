import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { fetchSaleRecord, fetchSalesRecords } from "../features/sales/services/salesApi.js";

const SalesPage = ({ setCurrentPage }) => {
  const { user, logout } = useAuth();
  const [sales, setSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadSales = async () => {
    try {
      setIsLoading(true);
      setError("");
      const data = await fetchSalesRecords();
      setSales(data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to load sales records");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  const handleSelect = async (billNumber) => {
    try {
      setError("");
      const data = await fetchSaleRecord(billNumber);
      setSelectedSale(data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to load bill details");
    }
  };

  const formatDate = (dateValue) => {
  if (!dateValue) return "N/A";

  // Handle MongoDB extended JSON
  if (typeof dateValue === "object" && dateValue.$date) {
    dateValue = dateValue.$date;
  }

  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
          <button className="db-nav-item" onClick={() => setCurrentPage(null)}>
            <span className="db-nav-icon">⊞</span><span>Dashboard</span>
          </button>
          <button className="db-nav-item" onClick={() => setCurrentPage("products")}>
            <span className="db-nav-icon">🏷️</span><span>Products</span>
          </button>
          <button className="db-nav-item" onClick={() => setCurrentPage("billing")}>
            <span className="db-nav-icon">🧾</span><span>Billing</span>
          </button>
          <button className="db-nav-item active" onClick={() => setCurrentPage("sales")}>
            <span className="db-nav-icon">📊</span><span>Sales</span>
          </button>
          <button className="db-nav-item" onClick={() => setCurrentPage("reports")}>
            <span className="db-nav-icon">📋</span><span>Reports</span>
          </button>
          {(user?.role === "owner" || user?.role === "admin") && (
            <button className="db-nav-item" onClick={() => setCurrentPage("staff")}>
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
          onClick={() => setCurrentPage("profile")}
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
        <div className="pp-header" style={{ marginBottom: "2rem" }}>
          <div>
            <h1 className="pp-title">Sales Records</h1>
            <p style={{ color: "rgba(255,255,255,0.6)", marginTop: "0.25rem", fontSize: "0.9rem" }}>
              Verify recent checkout bills, profit margins, and sold items.
            </p>
          </div>
        </div>

        {error && <div className="pp-form-error" style={{ marginBottom: "1.5rem" }}>{error}</div>}

        {isLoading ? (
          <div className="db-empty" style={{ minHeight: "200px" }}>Loading sales records...</div>
        ) : (
          <div className="db-charts-row" style={{ alignItems: "flex-start" }}>

            {/* RECENT BILLS TABLE */}
            <div className="db-glass-panel" style={{ flex: 1.5, width: "650px" }}>
              <div className="db-panel-header">
                <div className="db-panel-title">Recent Bills</div>
                <div className="db-panel-sub">{sales.length} records found</div>
              </div>

              {sales.length ? (
                <div className="pp-table-container" style={{ margin: "0 -1.5rem -1.5rem -1.5rem" }}>
                  <table className="pp-table">
                    <thead>
                      <tr>
                        <th>Bill Number</th>
                        <th>Date</th>
                        <th>Total</th>
                        <th>Profit</th>
                        <th style={{ textAlign: "center" }}>Items</th>
                        <th style={{ textAlign: "right" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sales.map((sale) => (
                        <tr
                          key={sale.billNumber}
                          style={{
                            backgroundColor: selectedSale?.billNumber === sale.billNumber ? "rgba(139, 92, 246, 0.1)" : undefined
                          }}
                        >
                          <td style={{ fontWeight: "600", color: "#a78bfa" }}>#{sale.billNumber}</td>
                          <td style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.85rem" }}>
                           {formatDate(sale.date)}
                          </td>
                          <td style={{ fontWeight: "600", color: "#34d399" }}>₹{(sale.totalAmount || 0).toLocaleString("en-IN")}</td>
                          <td style={{ color: "rgba(52,211,153,0.8)" }}>₹{(sale.totalProfit || 0).toLocaleString("en-IN")}</td>
                          <td style={{ textAlign: "center" }}>{sale.totalItems}</td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              className="pp-btn-secondary"
                              onClick={() => handleSelect(sale.billNumber)}
                              style={{ padding: "0.4rem 0.85rem", fontSize: "0.8rem", height: "auto" }}
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="db-empty">
                  No sales records available yet.
                </div>
              )}
            </div>

            {/* BILL DETAILS */}
            <div className="db-glass-panel" style={{ flex: 1, position: "sticky", top: "2rem", marginLeft: "-12rem" }}>
              <div className="db-panel-title" style={{ marginBottom: "1.5rem" }}>Bill Details</div>

              {selectedSale ? (
                <>
                  <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: "8px", padding: "1.25rem", marginBottom: "1.5rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                      <div>
                        <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.25rem" }}>Bill Number</div>
                        <div style={{ fontWeight: "600", color: "#a78bfa", fontSize: "1.1rem" }}>#{selectedSale.billNumber}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.25rem" }}>Date</div>
                        <div style={{ fontSize: "0.9rem" }}>
                          {formatDate(selectedSale.date)}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                      <div>
                        <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.25rem" }}>Total Profit</div>
                        <div style={{ color: "#34d399", fontWeight: "600" }}>₹{(selectedSale.totalProfit || 0).toLocaleString("en-IN")}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.25rem" }}>Total Amount</div>
                        <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#a78bfa" }}>₹{(selectedSale.totalAmount || 0).toLocaleString("en-IN")}</div>
                      </div>
                    </div>
                  </div>

                  <h3 style={{ fontSize: "1rem", fontWeight: "500", marginBottom: "1rem", color: "rgba(255,255,255,0.8)" }}>Purchased Items</h3>
                  <div className="pp-table-container" style={{ margin: "0 -1.5rem -1.5rem -1.5rem" }}>
                    <table className="pp-table">
                      <thead>
                        <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                          <th>Product</th>
                          <th style={{ textAlign: "center" }}>Qty</th>
                          <th style={{ textAlign: "right" }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedSale.products.map((product) => (
                          <tr key={`${selectedSale.billNumber}-${product.productId}`}>
                            <td>
                              <div style={{ fontWeight: "500" }}>{product.productName}</div>
                              <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>{product.barcode}</div>
                            </td>
                            <td style={{ textAlign: "center", color: "rgba(255,255,255,0.8)" }}>
                              {product.quantity} <span style={{ fontSize: "0.75rem", opacity: 0.5 }}>× ₹{(product.unitPrice || 0).toLocaleString("en-IN")}</span>
                            </td>
                            <td style={{ textAlign: "right", fontWeight: "600", color: "#34d399" }}>
                              ₹{(product.totalPrice || 0).toLocaleString("en-IN")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="db-empty" style={{ minHeight: "150px" }}>
                  <span style={{ fontSize: "2rem", display: "block", marginBottom: "0.5rem", opacity: 0.8 }}>📄</span>
                  Select a bill from the list to view its contents.
                </div>
              )}
            </div>

          </div>
        )}
      </main>
    </div>
  );
};

export default SalesPage;
