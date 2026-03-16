import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { API } from "../services/api.js";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import {
  fetchLowStockPurchaseOrdersReport,
  fetchGeneratedPurchaseOrders,
  generatePurchaseOrders,
  downloadPurchaseOrderPdf
} from "../features/reports/services/reportsApi.js";
import { AIChatAssistant } from "../components/AIChatAssistant.jsx";

// ── helpers ────────────────────────────────────────────────────────────────

const formatCurrency = (value) => Number(value ?? 0).toFixed(2);

const normalizePurchaseOrder = (purchaseOrder) => {
  const vendorGroupsSource = purchaseOrder.vendorGroups ?? [
    {
      vendorEmail: purchaseOrder.vendorEmail,
      vendorName: purchaseOrder.vendorName,
      vendorAddress: purchaseOrder.vendorAddress,
      finalAmount: purchaseOrder.finalAmount,
      products: purchaseOrder.items?.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        barcode: item.barcode,
        cost: item.unitPrice,
        recommendedOrderQuantity: item.requiredStock,
        lineAmount: item.lineAmount
      })) ?? []
    }
  ];

  const normalizedVendorGroups = vendorGroupsSource.map((vendorGroup) => {
    const normalizedProducts = (vendorGroup.products ?? []).map((product) => {
      const quantity = Number(product.recommendedOrderQuantity ?? 0);
      const cost = Number(product.cost ?? 0);
      const lineAmount = Number(product.lineAmount ?? quantity * cost);

      return {
        ...product,
        cost,
        recommendedOrderQuantity: quantity,
        lineAmount
      };
    });

    const finalAmount = Number(
      vendorGroup.finalAmount ?? normalizedProducts.reduce((total, product) => total + product.lineAmount, 0)
    );

    return {
      ...vendorGroup,
      products: normalizedProducts,
      finalAmount
    };
  });

  return {
    ...purchaseOrder,
    generatedAt: purchaseOrder.generatedAt ?? purchaseOrder.createdAt,
    vendorGroups: normalizedVendorGroups,
    finalAmount: Number(
      purchaseOrder.finalAmount ?? normalizedVendorGroups.reduce((total, vendorGroup) => total + vendorGroup.finalAmount, 0)
    )
  };
};

const groupByDay = (sales) => {
  const map = {};
  sales.forEach((s) => {
    // Graceful check in case date is missing/invalid
    if (!s.date) return;
    const dateObj = new Date(s.date);
    if (isNaN(dateObj.getTime())) return;

    const day = dateObj.toLocaleDateString("en-IN", { weekday: "short" });
    if (!map[day]) map[day] = { day, revenue: 0, profit: 0 };
    map[day].revenue += (s.totalAmount || 0);
    map[day].profit  += (s.totalProfit || 0);
  });
  return Object.values(map).slice(-7);
};
 
const groupByCategory = (products) => {
  const map = {};
  products.forEach((p) => {
    if (!map[p.category]) map[p.category] = 0;
    map[p.category] += p.price * p.stock;
  });
  const colors = ["#a78bfa", "#34d399", "#60a5fa", "#f472b6", "#fbbf24"];
  const total = Object.values(map).reduce((a, b) => a + b, 0) || 1;
  return Object.entries(map).map(([name, val], i) => ({
    name,
    value: Math.round((val / total) * 100),
    color: colors[i % colors.length],
  }));
};
 
const getLowStock = (products) =>
  products
    .filter((p) => p.stock <= p.threshold)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 4)
    .map((p) => ({
      name: p.name,
      sku: p.barcode,
      stock: p.stock,
      max: p.threshold * 4 || 100,
      urgency: p.stock === 0 ? "critical" : p.stock <= p.threshold / 2 ? "warning" : "low",
    }));
 
const getRecentSales = (sales) =>
  [...sales]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)
    .map((s) => ({
      id: s.billNumber,
      item: `${s.totalItems || 0} items`,
      amount: `₹${(s.totalAmount || 0).toLocaleString("en-IN")}`,
      profit: `₹${(s.totalProfit || 0).toLocaleString("en-IN")}`,
    }));
 
// ── sub-components ─────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, color, icon }) => (
  <div className="db-stat-card">
    <div className="db-stat-icon" style={{ background: color }}>{icon}</div>
    <div>
      <div className="db-stat-label">{label}</div>
      <div className="db-stat-value">{value}</div>
      {sub && <div className="db-stat-sub">{sub}</div>}
    </div>
  </div>
);
 
const Spinner = () => (
  <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:120, color:"rgba(255,255,255,0.3)", fontSize:"0.85rem" }}>
    Loading...
  </div>
);
 
// ── main ───────────────────────────────────────────────────────────────────
const DashboardPage = ({ setCurrentPage }) => {
  const { user, logout } = useAuth();
  const [sales,    setSales]    = useState([]);
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showAiChat, setShowAiChat] = useState(false);

  // New states for PO Builder
  const [lowStockPurchaseOrders, setLowStockPurchaseOrders] = useState([]);
  const [selectedPoProducts, setSelectedPoProducts] = useState({});
  const [showPoBuilder, setShowPoBuilder] = useState(false);
  const [showSavedPos, setShowSavedPos] = useState(false);
  const [savedPurchaseOrders, setSavedPurchaseOrders] = useState([]);
  const [poError, setPoError] = useState("");
  const [poSuccess, setPoSuccess] = useState("");

  const isPrivileged = user?.role === "owner" || user?.role === "admin";

  const loadPurchaseOrderData = async () => {
    try {
      const [lowStockPoData, generatedPoData] = await Promise.all([
        fetchLowStockPurchaseOrdersReport(),
        fetchGeneratedPurchaseOrders()
      ]);
      setLowStockPurchaseOrders(lowStockPoData || []);
      setSavedPurchaseOrders((generatedPoData || []).map(normalizePurchaseOrder));
    } catch (e) {
      console.error("Failed to load PO data:", e);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [salesRes, productsRes] = await Promise.all([
          API.get("/sales"),
          API.get("/products"),
        ]);
        
        setSales(salesRes.data?.data || []);
        setProducts(productsRes.data?.data || []);
        if (isPrivileged) await loadPurchaseOrderData();
      } catch (e) {
        console.error("Dashboard fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isPrivileged]);
 
  useEffect(() => {
    const initialSelections = lowStockPurchaseOrders.reduce((selectionMap, vendorGroup) => {
      vendorGroup.products.forEach((product) => {
        selectionMap[product.productId] = false;
      });
      return selectionMap;
    }, {});
    setSelectedPoProducts(initialSelections);
  }, [lowStockPurchaseOrders]);

  const handleSelectAllPoProducts = (isChecked) => {
    const nextSelectionState = lowStockPurchaseOrders.reduce((selectionMap, vendorGroup) => {
      vendorGroup.products.forEach((product) => {
        selectionMap[product.productId] = isChecked;
      });
      return selectionMap;
    }, {});
    setSelectedPoProducts(nextSelectionState);
  };

  const handleTogglePoProduct = (productId) => {
    setSelectedPoProducts((current) => ({
      ...current,
      [productId]: !current[productId]
    }));
  };

  const handleGeneratePurchaseOrder = async () => {
    setPoError("");
    setPoSuccess("");

    const selectedProductIds = Object.entries(selectedPoProducts)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => id);

    if (!selectedProductIds.length) {
      setPoError("Select at least one product to generate a purchase order.");
      return;
    }

    try {
      const result = await generatePurchaseOrders(selectedProductIds);
      await loadPurchaseOrderData();
      setPoSuccess(result.message || "Purchase orders generated and emailed successfully.");
      setShowPoBuilder(false);
      setSelectedPoProducts({});
    } catch (e) {
      setPoError(e.response?.data?.message || "Failed to generate purchase orders");
    }
  };

  const handleDownloadPurchaseOrder = async (purchaseOrder) => {
    try {
      const blob = await downloadPurchaseOrderPdf(purchaseOrder._id || purchaseOrder.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${purchaseOrder.poNumber}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download failed:", e);
    }
  };

  // computed
  const today        = new Date().toDateString();
  const todaySales   = sales.filter((s) => {
    if (!s.date) return false;
    const d = new Date(s.date);
    return !isNaN(d.getTime()) && d.toDateString() === today;
  });
  const todayRevenue = todaySales.reduce((a, s) => a + (s.totalAmount || 0), 0);
  const todayProfit  = todaySales.reduce((a, s) => a + (s.totalProfit || 0), 0);
  const totalOrders  = todaySales.length;
  const lowStockCount = products.filter((p) => (p.stock || 0) <= (p.threshold || 0)).length;

  const chartData    = groupByDay(sales);
  const categoryData = groupByCategory(products);
  const lowStock     = getLowStock(products);
  const recentSales  = getRecentSales(sales);

  const allPoProductIds = lowStockPurchaseOrders.flatMap((vendorGroup) =>
    vendorGroup.products.map((product) => product.productId)
  );
  const selectedPoCount = allPoProductIds.filter((productId) => selectedPoProducts[productId]).length;
  const areAllPoProductsSelected = allPoProductIds.length > 0 && selectedPoCount === allPoProductIds.length;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Sub-component for PO Card (Glass style)
  const renderPurchaseOrderCard = (po) => (
    <div key={po.poNumber} className="po-glass-card">
      <div className="po-card-header">
        <div>
          <div className="po-card-num">{po.poNumber}</div>
          <div className="po-card-date">{new Date(po.generatedAt).toLocaleDateString()}</div>
        </div>
        <button className="po-dl-btn" onClick={() => handleDownloadPurchaseOrder(po)}>Download PDF</button>
      </div>
      <div className="po-card-body">
        <div className="po-card-vendor">{po.vendorName}</div>
        <div className="po-card-amount">₹{formatCurrency(po.finalAmount)}</div>
      </div>
    </div>
  );
 
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
            { icon: "⊞", label: "Dashboard",  page: null        },
            // { icon: "📦", label: "Inventory",  page: "inventory" },
            { icon: "🏷️", label: "Products",   page: "products"  },
            { icon: "🧾", label: "Billing",    page: "billing"   },
            { icon: "📊", label: "Sales",      page: "sales"     },
          ].map(({ icon, label, page }) => (
            <button
              key={label}
              className={`db-nav-item ${page === null ? "active" : ""}`}
              onClick={() => page && setCurrentPage(page) || (!page && setCurrentPage(null))}
            >
              <span className="db-nav-icon">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
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
 
      {/* MAIN */}
      <main className="db-main">
 
        <div className="db-topbar">
          <div>
            <div className="db-greeting">{greeting}, {user?.name?.split(" ")[0] || "there"} 👋</div>
            <div className="db-subgreeting">Here's what's happening in your store today.</div>
          </div>
          <div className="db-topbar-actions">
            <button 
              className="db-action-btn" 
              style={{ background: "rgba(167,139,250,0.8)" }} 
              onClick={() => setShowAiChat(true)}
            >
              Ask AI Assistant
            </button>
            {isPrivileged && (
              <button 
                className="db-nav-item" 
                style={{ padding: "0.5rem 1rem", borderRadius: "8px", background: "rgba(255,255,255,0.05)" }}
                onClick={() => setShowPoBuilder(!showPoBuilder)}
              >
                {showPoBuilder ? "Close PO Builder" : "Generate PO"}
              </button>
            )}
            <button className="db-action-btn" onClick={() => setCurrentPage("billing")}>
              + New Sale
            </button>
          </div>
        </div>

        {loading ? <Spinner /> : (
          <>
            {/* PO BUILDER OVERLAY (Glass) */}
            {showPoBuilder && isPrivileged && (
              <div className="db-glass-panel" style={{ marginBottom: "1.5rem", border: "1px solid rgba(167,139,250,0.3)" }}>
                <div className="db-panel-header">
                  <div>
                    <div className="db-panel-title">Purchase Order Builder</div>
                    <div className="db-panel-sub">Select products to generate purchase orders for vendors.</div>
                  </div>
                  <div className="db-po-builder-actions">
                    <label style={{ marginRight: "1rem", fontSize: "0.85rem", opacity: 0.7 }}>
                      <input 
                        type="checkbox" 
                        checked={areAllPoProductsSelected} 
                        onChange={(e) => handleSelectAllPoProducts(e.target.checked)}
                        style={{ marginRight: "0.5rem" }}
                      />
                      Select All
                    </label>
                    <button className="db-action-btn" onClick={handleGeneratePurchaseOrder}>
                      Generate ({selectedPoCount})
                    </button>
                  </div>
                </div>
                {poError && <div className="glass-error" style={{ margin: "1rem 0" }}>{poError}</div>}
                {poSuccess && <div className="glass-success" style={{ margin: "1rem 0" }}>{poSuccess}</div>}
                <div className="db-po-groups">
                  {lowStockPurchaseOrders.length === 0 ? (
                    <div className="db-empty">No low stock products available for PO generation.</div>
                  ) : (
                    lowStockPurchaseOrders.map((vendor) => (
                      <div key={vendor.vendorEmail} className="db-po-vendor-group">
                        <div className="db-po-vendor-header">
                          <strong>{vendor.vendorName}</strong>
                          <span>{vendor.vendorEmail}</span>
                        </div>
                        {vendor.products.map((p) => (
                          <div key={p.productId} className="db-po-product-row">
                            <label>
                              <input 
                                type="checkbox" 
                                checked={!!selectedPoProducts[p.productId]} 
                                onChange={() => handleTogglePoProduct(p.productId)}
                                style={{ marginRight: "0.75rem" }}
                              />
                              {p.productName}
                            </label>
                            <span>Req: {p.recommendedOrderQuantity}</span>
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            {/* STAT CARDS */}
            <div className="db-stats-row">
              <StatCard
                label="Today's Revenue"
                value={`₹${(todayRevenue || 0).toLocaleString("en-IN")}`}
                sub={`${totalOrders} orders today`}
                color="rgba(167,139,250,0.2)"
                icon="💰"
              />
              <StatCard
                label="Today's Orders"
                value={totalOrders}
                sub="from sales records"
                color="rgba(52,211,153,0.2)"
                icon="🛒"
              />
              <StatCard
                label="Today's Profit"
                value={`₹${(todayProfit || 0).toLocaleString("en-IN")}`}
                sub={todayRevenue > 0 ? `${Math.round((todayProfit / todayRevenue) * 100)}% margin` : "no sales yet"}
                color="rgba(96,165,250,0.2)"
                icon="📈"
              />
              <StatCard
                label="Low Stock Items"
                value={lowStockCount}
                sub={lowStockCount > 0 ? "needs attention" : "all stocked up"}
                color="rgba(244,114,182,0.2)"
                icon="⚠️"
              />
            </div>

            {/* SAVED POs (Horizontal Scroll) */}
            {isPrivileged && savedPurchaseOrders.length > 0 && (
              <div className="db-pos-section">
                <div className="db-panel-header" style={{ marginBottom: "0.75rem" }}>
                  <div className="db-panel-title" style={{ fontSize: "1rem" }}>Generated Purchase Orders</div>
                  <button className="db-view-all" onClick={() => setShowSavedPos(!showSavedPos)}>
                    {showSavedPos ? "Hide" : "View All"}
                  </button>
                </div>
                <div className={`db-pos-container ${showSavedPos ? "expanded" : "scroll"}`}>
                   {savedPurchaseOrders.map(renderPurchaseOrderCard)}
                </div>
              </div>
            )}
 
            {/* CHARTS */}
            <div className="db-charts-row">
              <div className="db-glass-panel db-chart-main">
                <div className="db-panel-header">
                  <div>
                    <div className="db-panel-title">Revenue & Profit</div>
                    <div className="db-panel-sub">Last 7 days</div>
                  </div>
                </div>
                {chartData.length === 0 ? (
                  <div className="db-empty">No sales data yet — make your first sale!</div>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#a78bfa" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#34d399" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" tick={{ fill:"rgba(255,255,255,0.4)", fontSize:11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill:"rgba(255,255,255,0.4)", fontSize:11 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background:"rgba(20,25,35,0.95)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, color:"#fff", fontSize:12 }}
                        formatter={(val) => `₹${(val || 0).toLocaleString("en-IN")}`}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#a78bfa" strokeWidth={2} fill="url(#revGrad)" />
                      <Area type="monotone" dataKey="profit"  stroke="#34d399" strokeWidth={2} fill="url(#profGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
                <div className="db-chart-legend">
                  <span><span style={{background:"#a78bfa"}} className="db-legend-dot"/>Revenue</span>
                  <span><span style={{background:"#34d399"}} className="db-legend-dot"/>Profit</span>
                </div>
              </div>
 
              <div className="db-glass-panel db-chart-side">
                <div className="db-panel-title">Categories</div>
                <div className="db-panel-sub" style={{marginBottom:"1rem"}}>Stock value split</div>
                {categoryData.length === 0 ? (
                  <div className="db-empty">No products yet</div>
                ) : (
                  <>
                    <PieChart width={140} height={140}>
                      <Pie data={categoryData} cx={65} cy={65} innerRadius={42} outerRadius={65} dataKey="value" strokeWidth={0}>
                        {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                    </PieChart>
                    <div className="db-donut-legend">
                      {categoryData.map((c) => (
                        <div key={c.name} className="db-donut-row">
                          <span className="db-legend-dot" style={{background: c.color}} />
                          <span className="db-donut-label">{c.name}</span>
                          <span className="db-donut-val">{c.value}%</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
 
            {/* BOTTOM ROW */}
            <div className="db-bottom-row">
              <div className="db-glass-panel">
                <div className="db-panel-header">
                  <div className="db-panel-title">Low Stock Alerts</div>
                  {/* <button className="db-view-all" onClick={() => setCurrentPage("")}>View All →</button> */}
                </div>
                {lowStock.length === 0 ? (
                  <div className="db-empty">✅ All products are well stocked</div>
                ) : lowStock.map((item) => (
                  <div key={item.sku} className="db-stock-row">
                    <div>
                      <div className="db-stock-name">{item.name}</div>
                      <div className="db-stock-sku">{item.sku}</div>
                    </div>
                    <div className="db-stock-right">
                      <span className={`db-urgency db-urgency--${item.urgency}`}>{item.stock} left</span>
                      <div className="db-stock-bar">
                        <div
                          className={`db-stock-fill db-stock-fill--${item.urgency}`}
                          style={{ width: `${Math.min((item.stock / item.max) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
 
              <div className="db-glass-panel">
                <div className="db-panel-header">
                  <div className="db-panel-title">Recent Sales</div>
                  <button className="db-view-all" onClick={() => setCurrentPage("sales")}>View All →</button>
                </div>
                {recentSales.length === 0 ? (
                  <div className="db-empty">No sales recorded yet</div>
                ) : (
                  <table className="db-table">
                    <thead>
                      <tr>
                        <th>Bill No.</th>
                        <th>Item</th>
                        <th>Amount</th>
                        <th>Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentSales.map((s) => (
                        <tr key={s.id}>
                          <td className="db-order-id">{s.id}</td>
                          <td>{s.item}</td>
                          <td>{s.amount}</td>
                          <td style={{color:"#34d399"}}>{s.profit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
 
            {/* REPORTS HINT — owner/admin only */}
            {isPrivileged && (
              <div className="db-reports-hint">
                <span>📋 You have access to detailed reports — daily sales, monthly trends, top products & profit analysis</span>
              </div>
            )}
          </>
        )}
      </main>
      {showAiChat && <AIChatAssistant onClose={() => setShowAiChat(false)} />}
    </div>
  );
};
 
export default DashboardPage;