import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { fetchSaleRecord, fetchSalesRecords } from "../features/sales/services/salesApi.js";
import AppSidebar from "./Appsidebar.jsx";

const SalesPage = ({ setCurrentPage }) => {
  const { user, logout } = useAuth();
  const [sales,        setSales]        = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [error,        setError]        = useState("");
  const [isLoading,    setIsLoading]    = useState(true);

  const loadSales = async () => {
    try {
      setIsLoading(true); setError("");
      const data = await fetchSalesRecords();
      setSales(data);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load sales records");
    } finally { setIsLoading(false); }
  };

  useEffect(() => { loadSales(); }, []);

  const handleSelect = async (billNumber) => {
    try {
      setError("");
      const data = await fetchSaleRecord(billNumber);
      setSelectedSale(data);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load bill details");
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "N/A";
    if (typeof dateValue === "object" && dateValue.$date) dateValue = dateValue.$date;
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return "Invalid date";
    return date.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="db-root">
      <AppSidebar setCurrentPage={setCurrentPage} user={user} logout={logout} activePage="sales" />

      <main className="db-main">
        <div className="db-topbar">
          <div>
            <div className="db-greeting">Sales Records</div>
            <div className="db-subgreeting">Verify recent checkout bills, profit margins and sold items.</div>
          </div>
        </div>

        {error && <div className="error-text" style={{ marginBottom: 14 }}>{error}</div>}

        {isLoading ? (
          <div className="pp-loading"><div className="pp-spinner" />Loading sales records...</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>

            {/* BILLS TABLE */}
            <div className="pp-table-panel">
              <div className="pp-table-header">
                <div className="db-panel-title">Recent Bills</div>
                <span className="pp-table-info">{sales.length} records</span>
              </div>

              {sales.length ? (
                <table className="pp-table">
                  <thead>
                    <tr>
                      <th>Bill No.</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Profit</th>
                      <th style={{ textAlign: "center" }}>Items</th>
                      <th style={{ textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((sale) => (
                      <tr
                        key={sale.billNumber}
                        style={{ background: selectedSale?.billNumber === sale.billNumber ? "var(--blue-50)" : undefined }}
                      >
                        <td>
                          <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--blue-500)", fontSize: 12 }}>
                            #{sale.billNumber}
                          </span>
                        </td>
                        <td style={{ color: "var(--text-secondary)", fontSize: 12 }}>{formatDate(sale.date)}</td>
                        <td style={{ fontWeight: 700 }}>₹{(sale.totalAmount || 0).toLocaleString("en-IN")}</td>
                        <td style={{ color: "var(--success)", fontWeight: 600 }}>₹{(sale.totalProfit || 0).toLocaleString("en-IN")}</td>
                        <td style={{ textAlign: "center" }}>{sale.totalItems}</td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className="pp-btn-secondary"
                            onClick={() => handleSelect(sale.billNumber)}
                            style={{ padding: "5px 14px", fontSize: 12 }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="db-empty">No sales records available yet.</div>
              )}
            </div>

            {/* BILL DETAILS */}
            <div className="db-glass-panel" style={{ position: "sticky", top: 20 }}>
              <div className="db-panel-title" style={{ marginBottom: 16 }}>Bill Details</div>

              {selectedSale ? (
                <>
                  <div style={{
                    background: "var(--surface-2)", borderRadius: 12,
                    padding: "16px", marginBottom: 16,
                    border: "1px solid var(--surface-3)",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", marginBottom: 4 }}>Bill Number</div>
                        <div style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--blue-500)", fontSize: 15 }}>#{selectedSale.billNumber}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", marginBottom: 4 }}>Date</div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{formatDate(selectedSale.date)}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid var(--surface-3)" }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", marginBottom: 4 }}>Profit</div>
                        <div style={{ color: "var(--success)", fontWeight: 700 }}>₹{(selectedSale.totalProfit || 0).toLocaleString("en-IN")}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", marginBottom: 4 }}>Total</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--blue-600)" }}>₹{(selectedSale.totalAmount || 0).toLocaleString("en-IN")}</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 10 }}>Purchased Items</div>
                  <table className="pp-table" style={{ fontSize: 12 }}>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th style={{ textAlign: "center" }}>Qty</th>
                        <th style={{ textAlign: "right" }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSale.products.map((product) => (
                        <tr key={`${selectedSale.billNumber}-${product.productId}`}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{product.productName}</div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>{product.barcode}</div>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <span style={{ fontWeight: 600 }}>{product.quantity}</span>
                            <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 4 }}>x ₹{(product.unitPrice || 0).toLocaleString("en-IN")}</span>
                          </td>
                          <td style={{ textAlign: "right", fontWeight: 700, color: "var(--success)" }}>
                            ₹{(product.totalPrice || 0).toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : (
                <div className="db-empty" style={{ minHeight: 160 }}>
                  Select a bill from the list to view its details.
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