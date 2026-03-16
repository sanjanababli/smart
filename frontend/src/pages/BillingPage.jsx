import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { checkoutCart, scanProductByBarcode } from "../features/billing/services/billingApi.js";

const BillingPage = ({ setCurrentPage }) => {
  const { user, logout } = useAuth();
  const [barcode, setBarcode] = useState("");
  const [cart, setCart] = useState([]);
  const [error, setError] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [billData, setBillData] = useState(null);
  const [scanSuccess, setScanSuccess] = useState(false);

  const handleScan = async (event) => {
    event.preventDefault();

    if (!barcode.trim()) {
      return;
    }

    try {
      setIsScanning(true);
      setError("");
      const product = await scanProductByBarcode(barcode.trim());

      setCart((currentCart) => {
        const existingItem = currentCart.find((item) => item.productId === product._id);

        if (existingItem) {
          return currentCart.map((item) =>
            item.productId === product._id ? { ...item, quantity: item.quantity + 1 } : item
          );
        }

        return [
          ...currentCart,
          {
            productId: product._id,
            name: product.name,
            barcode: product.barcode,
            price: product.price,
            cost: product.cost,
            stock: product.stock,
            quantity: 1
          }
        ];
      });

      setBarcode("");
      setScanSuccess(true);
      setTimeout(() => setScanSuccess(false), 800);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Scan failed");
    } finally {
      setIsScanning(false);
    }
  };

  const updateQuantity = (productId, nextQuantity) => {
    if (nextQuantity <= 0) {
      setCart((currentCart) => currentCart.filter((item) => item.productId !== productId));
      return;
    }

    setCart((currentCart) =>
      currentCart.map((item) => (item.productId === productId ? { ...item, quantity: nextQuantity } : item))
    );
  };

  const handleCheckout = async () => {
    if (!cart.length) {
      return;
    }

    try {
      setIsCheckingOut(true);
      setError("");
      const result = await checkoutCart(
        cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      );
      setBillData(result);
      setCart([]);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Checkout failed");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const totalBill = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalProfit = cart.reduce((sum, item) => sum + (item.price - item.cost) * item.quantity, 0);

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
          <button className="db-nav-item active" onClick={() => setCurrentPage("billing")}>
            <span className="db-nav-icon">🧾</span><span>Billing</span>
          </button>
          <button className="db-nav-item" onClick={() => setCurrentPage("sales")}>
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
        <div className="pp-header">
          <div>
            <h1 className="pp-title">Billing Counter</h1>
            <p style={{ color: "rgba(255,255,255,0.6)", marginTop: "0.25rem", fontSize: "0.9rem" }}>
              Scan a barcode or type it manually to add items to the cart.
            </p>
          </div>
        </div>

        {/* SCANNER BAR */}
        <div className={`db-scanner-container ${scanSuccess ? 'scan-feedback-pulse' : ''}`} style={{ marginBottom: "2rem" }}>
          <form className="db-scanner-input-wrap" onSubmit={handleScan}>
            <span className="db-scanner-icon">🏷️</span>
            <input
              className="db-scanner-input"
              value={barcode}
              onChange={(event) => setBarcode(event.target.value)}
              placeholder="Scan or type barcode here..."
              autoFocus
            />
            <button 
              type="submit" 
              className="pp-btn-primary" 
              disabled={isScanning}
              style={{ minWidth: "140px" }}
            >
              {isScanning ? "Processing..." : "Add Item"}
            </button>
          </form>
          <div className={`db-scanner-status ${isScanning ? 'active' : ''}`}>
             <div className="db-scanner-success-ring"></div>
          </div>
        </div>
        {error && <div className="glass-error" style={{ marginBottom: "1.5rem" }}>{error}</div>}

        {/* CART & SUMMARY ROW */}
        <div className="db-charts-row" style={{ alignItems: "flex-start", marginBottom: "1.5rem" }}>
          
          {/* CART CARD */}
          <div className="db-glass-panel" style={{ flex: 2 }}>
            <div className="db-panel-header">
              <div className="db-panel-title">Current Cart</div>
              <div className="db-panel-sub">{cart.length} items</div>
            </div>

            {cart.length ? (
              <div className="pp-table-container" style={{ margin: "-1.5rem" }}>
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
                        <td>{item.name}</td>
                        <td style={{ color: "rgba(255,255,255,0.5)" }}>{item.barcode}</td>
                        <td>₹{(item.price || 0).toLocaleString("en-IN")}</td>
                        <td style={{ textAlign: "center" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.75rem", background: "rgba(0,0,0,0.2)", padding: "0.25rem 0.5rem", borderRadius: "100px", border: "1px solid rgba(255,255,255,0.05)" }}>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              style={{ width: "24px", height: "24px", borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                              -
                            </button>
                            <span style={{ fontWeight: "600", minWidth: "1.5rem", textAlign: "center" }}>{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              style={{ width: "24px", height: "24px", borderRadius: "50%", border: "none", background: "linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td style={{ textAlign: "right", fontWeight: "600", color: "#34d399" }}>
                          ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="db-empty">
                <span style={{ fontSize: "2rem", display: "block", marginBottom: "0.5rem" }}>🛒</span>
                No products in the cart yet.<br />
                <span style={{ fontSize: "0.85rem", opacity: 0.6 }}>Scan an item to begin.</span>
              </div>
            )}
          </div>

          {/* SUMMARY CARD */}
          <div className="db-glass-panel" style={{ flex: 1, position: "sticky", top: "2rem" }}>
            <div className="db-panel-title" style={{ marginBottom: "1.5rem" }}>Checkout Summary</div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "1rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ color: "rgba(255,255,255,0.6)" }}>Items Count</span>
                <span style={{ fontWeight: "600" }}>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "1rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ color: "rgba(255,255,255,0.6)" }}>Estimated Profit</span>
                <span style={{ color: "#34d399" }}>₹{(totalProfit || 0).toLocaleString("en-IN")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "0.5rem" }}>
                <span style={{ fontSize: "1.1rem", fontWeight: "600" }}>Total Bill</span>
                <span style={{ fontSize: "1.5rem", fontWeight: "bold", background: "linear-gradient(135deg, #a78bfa, #34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  ₹{(totalBill || 0).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="pp-btn-primary"
              disabled={!cart.length || isCheckingOut}
              onClick={handleCheckout}
              style={{ width: "100%", padding: "0.85rem", fontSize: "1.05rem", display: "flex", justifyContent: "center", gap: "0.5rem" }}
            >
              {isCheckingOut ? (
                <span>Processing...</span>
              ) : (
                <>💳 Complete Checkout</>
              )}
            </button>
          </div>
        </div>

        {/* GENERATED BILL */}
        {billData && (
          <div className="db-glass-panel" style={{ border: "1px solid rgba(52,211,153,0.3)", position: "relative", overflow: "hidden" }}>
            {/* Background highlight */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "linear-gradient(90deg, #34d399, #10b981)" }} />
            
            <div className="db-panel-header" style={{ marginBottom: "1.5rem" }}>
              <div>
                <div className="db-panel-title" style={{ color: "#34d399", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span>✅</span> Bill Generated Successfully
                </div>
                <div className="db-panel-sub">Bill #{billData.billNumber} • {new Date(billData.checkoutAt).toLocaleString("en-IN")}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>₹{(billData.totalAmount || 0).toLocaleString("en-IN")}</div>
                <div style={{ color: "#34d399", fontSize: "0.85rem" }}>+ ₹{(billData.totalProfit || 0).toLocaleString("en-IN")} profit</div>
              </div>
            </div>

            <div className="pp-table-container" style={{ margin: "0 -1.5rem -1.5rem -1.5rem" }}>
              <table className="pp-table">
                <thead>
                  <tr style={{ background: "rgba(52,211,153,0.05)" }}>
                    <th>Product</th>
                    <th style={{ textAlign: "center" }}>Qty</th>
                    <th>Unit Price</th>
                    <th style={{ textAlign: "right" }}>Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {billData.items.map((item) => (
                    <tr key={`${billData.billNumber}-${item.productId}`}>
                      <td>{item.name}</td>
                      <td style={{ textAlign: "center" }}>{item.quantity}</td>
                      <td style={{ color: "rgba(255,255,255,0.6)" }}>₹{(item.unitPrice || 0).toLocaleString("en-IN")}</td>
                      <td style={{ textAlign: "right", fontWeight: "600" }}>₹{(item.lineTotal || 0).toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default BillingPage;
