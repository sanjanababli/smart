import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { checkoutCart, scanProductByBarcode } from "../features/billing/services/billingApi.js";
import AppSidebar from "./AppSidebar.jsx";

const BillingPage = ({ setCurrentPage }) => {
  const { user, logout } = useAuth();
  const [barcode,      setBarcode]      = useState("");
  const [cart,         setCart]         = useState([]);
  const [error,        setError]        = useState("");
  const [isScanning,   setIsScanning]   = useState(false);
  const [isCheckingOut,setIsCheckingOut]= useState(false);
  const [billData,     setBillData]     = useState(null);
  const [scanSuccess,  setScanSuccess]  = useState(false);

  const handleScan = async (e) => {
    e.preventDefault();
    if (!barcode.trim()) return;
    try {
      setIsScanning(true); setError("");
      const product = await scanProductByBarcode(barcode.trim());
      setCart((cur) => {
        const existing = cur.find((i) => i.productId === product._id);
        if (existing) return cur.map((i) => i.productId === product._id ? { ...i, quantity: i.quantity + 1 } : i);
        return [...cur, { productId: product._id, name: product.name, barcode: product.barcode, price: product.price, cost: product.cost, stock: product.stock, quantity: 1 }];
      });
      setBarcode("");
      setScanSuccess(true);
      setTimeout(() => setScanSuccess(false), 800);
    } catch (e) {
      setError(e.response?.data?.message || "Scan failed");
    } finally { setIsScanning(false); }
  };

  const updateQuantity = (productId, qty) => {
    if (qty <= 0) { setCart((cur) => cur.filter((i) => i.productId !== productId)); return; }
    setCart((cur) => cur.map((i) => i.productId === productId ? { ...i, quantity: qty } : i));
  };

  const handleCheckout = async () => {
    if (!cart.length) return;
    try {
      setIsCheckingOut(true); setError("");
      const result = await checkoutCart(cart.map((i) => ({ productId: i.productId, quantity: i.quantity })));
      setBillData(result); setCart([]);
    } catch (e) {
      setError(e.response?.data?.message || "Checkout failed");
    } finally { setIsCheckingOut(false); }
  };

  const totalBill   = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const totalProfit = cart.reduce((s, i) => s + (i.price - i.cost) * i.quantity, 0);

  return (
    <div className="db-root">
      <AppSidebar setCurrentPage={setCurrentPage} user={user} logout={logout} activePage="billing" />

      <main className="db-main">
        <div className="db-topbar">
          <div>
            <div className="db-greeting">Billing Counter</div>
            <div className="db-subgreeting">Scan a barcode or type it manually to add items to the cart.</div>
          </div>
        </div>

        {/* SCANNER */}
        <div className={`db-scanner-container ${scanSuccess ? "scan-feedback-pulse" : ""}`}>
          <form className="db-scanner-input-wrap" onSubmit={handleScan}>
            <span className="db-scanner-icon" style={{ fontSize: 20, color: "var(--blue-400)" }}>&#x2315;</span>
            <input
              className="db-scanner-input"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Scan or type barcode here..."
              autoFocus
            />
            <button type="submit" className="pp-btn-primary" disabled={isScanning} style={{ minWidth: 120, flex: "none" }}>
              {isScanning ? "Processing..." : "Add Item"}
            </button>
          </form>
          <div className={`db-scanner-status ${isScanning ? "active" : ""}`}>
            <div className="db-scanner-success-ring" />
          </div>
        </div>

        {error && <div className="error-text" style={{ marginBottom: 14 }}>{error}</div>}

        {/* CART + SUMMARY */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, alignItems: "start" }}>

          {/* CART */}
          <div className="pp-table-panel">
            <div className="pp-table-header">
              <div className="db-panel-title">Current Cart</div>
              <span className="pp-table-info">{cart.length} items</span>
            </div>

            {cart.length ? (
              <table className="pp-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Barcode</th>
                    <th>Price</th>
                    <th style={{ textAlign: "center" }}>Qty</th>
                    <th style={{ textAlign: "right" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item) => (
                    <tr key={item.productId}>
                      <td style={{ fontWeight: 600 }}>{item.name}</td>
                      <td style={{ fontFamily: "monospace", fontSize: 11, color: "var(--text-muted)" }}>{item.barcode}</td>
                      <td>₹{(item.price || 0).toLocaleString("en-IN")}</td>
                      <td style={{ textAlign: "center" }}>
                        <div style={{
                          display: "inline-flex", alignItems: "center", gap: 8,
                          background: "var(--surface-2)", border: "1px solid var(--surface-3)",
                          padding: "3px 8px", borderRadius: 999,
                        }}>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            style={{
                              width: 22, height: 22, borderRadius: "50%",
                              border: "1px solid var(--surface-3)", background: "var(--surface-1)",
                              color: "var(--text-secondary)", cursor: "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontWeight: 700, fontSize: 14, lineHeight: 1,
                            }}
                          >
                            -
                          </button>
                          <span style={{ fontWeight: 700, minWidth: 20, textAlign: "center", fontSize: 13 }}>{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            style={{
                              width: 22, height: 22, borderRadius: "50%",
                              border: "none", background: "var(--blue-500)",
                              color: "#fff", cursor: "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontWeight: 700, fontSize: 14, lineHeight: 1,
                              boxShadow: "0 2px 6px rgba(37,99,235,0.3)",
                            }}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700, color: "var(--success)" }}>
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="db-empty" style={{ padding: "48px 16px" }}>
                No products in cart yet. Scan an item to begin.
              </div>
            )}
          </div>

          {/* SUMMARY */}
          <div className="db-glass-panel" style={{ position: "sticky", top: 20 }}>
            <div className="db-panel-title" style={{ marginBottom: 20 }}>Checkout Summary</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: 20 }}>
              {[
                { label: "Items Count",      value: cart.reduce((s, i) => s + i.quantity, 0).toString(), style: {} },
                { label: "Estimated Profit", value: `₹${(totalProfit || 0).toLocaleString("en-IN")}`,   style: { color: "var(--success)" } },
              ].map(({ label, value, style }) => (
                <div key={label} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 0", borderBottom: "1px solid var(--surface-3)",
                }}>
                  <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>{label}</span>
                  <span style={{ fontWeight: 600, ...style }}>{value}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14 }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>Total Bill</span>
                <span style={{ fontSize: 24, fontWeight: 900, color: "var(--blue-600)", letterSpacing: "-0.03em" }}>
                  ₹{(totalBill || 0).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="pp-btn-primary"
              disabled={!cart.length || isCheckingOut}
              onClick={handleCheckout}
              style={{ width: "100%", padding: 13, fontSize: 14 }}
            >
              {isCheckingOut ? "Processing..." : "Complete Checkout"}
            </button>
          </div>
        </div>

        {/* GENERATED BILL */}
        {billData && (
          <div className="db-glass-panel" style={{ borderTop: "3px solid var(--success)", position: "relative" }}>
            <div className="db-panel-header" style={{ marginBottom: 16 }}>
              <div>
                <div className="db-panel-title" style={{ color: "var(--success)" }}>Bill Generated Successfully</div>
                <div className="db-panel-sub">
                  Bill #{billData.billNumber} · {new Date(billData.checkoutAt).toLocaleString("en-IN")}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>
                  ₹{(billData.totalAmount || 0).toLocaleString("en-IN")}
                </div>
                <div style={{ color: "var(--success)", fontSize: 12, fontWeight: 600 }}>
                  + ₹{(billData.totalProfit || 0).toLocaleString("en-IN")} profit
                </div>
              </div>
            </div>
            <table className="pp-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th style={{ textAlign: "center" }}>Qty</th>
                  <th>Unit Price</th>
                  <th style={{ textAlign: "right" }}>Line Total</th>
                </tr>
              </thead>
              <tbody>
                {billData.items.map((item) => (
                  <tr key={`${billData.billNumber}-${item.productId}`}>
                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                    <td style={{ textAlign: "center" }}>{item.quantity}</td>
                    <td style={{ color: "var(--text-secondary)" }}>₹{(item.unitPrice || 0).toLocaleString("en-IN")}</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>₹{(item.lineTotal || 0).toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default BillingPage;
