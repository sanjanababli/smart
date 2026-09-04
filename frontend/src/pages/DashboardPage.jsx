import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { API } from "../services/api.js";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import {
  fetchLowStockPurchaseOrdersReport,
  fetchGeneratedPurchaseOrders,
  generatePurchaseOrders,
  downloadPurchaseOrderPdf,
} from "../features/reports/services/reportsApi.js";
import { AIChatAssistant } from "../components/AIChatAssistant.jsx";

// ── helpers ────────────────────────────────────────────────────────────────

const formatCurrency = (value) => Number(value ?? 0).toFixed(2);

const normalizePurchaseOrder = (po) => {
  const vendorGroupsSource = po.vendorGroups ?? [
    {
      vendorEmail:   po.vendorEmail,
      vendorName:    po.vendorName,
      vendorAddress: po.vendorAddress,
      finalAmount:   po.finalAmount,
      products: po.items?.map((item) => ({
        productId:                item.productId,
        productName:              item.productName,
        barcode:                  item.barcode,
        cost:                     item.unitPrice,
        recommendedOrderQuantity: item.requiredStock,
        lineAmount:               item.lineAmount,
      })) ?? [],
    },
  ];

  const normalizedVendorGroups = vendorGroupsSource.map((vg) => {
    const products = (vg.products ?? []).map((p) => {
      const quantity   = Number(p.recommendedOrderQuantity ?? 0);
      const cost       = Number(p.cost ?? 0);
      const lineAmount = Number(p.lineAmount ?? quantity * cost);
      return { ...p, cost, recommendedOrderQuantity: quantity, lineAmount };
    });
    const finalAmount = Number(
      vg.finalAmount ?? products.reduce((t, p) => t + p.lineAmount, 0)
    );
    return { ...vg, products, finalAmount };
  });

  return {
    ...po,
    generatedAt:  po.generatedAt ?? po.createdAt,
    vendorGroups: normalizedVendorGroups,
    finalAmount:  Number(
      po.finalAmount ??
        normalizedVendorGroups.reduce((t, vg) => t + vg.finalAmount, 0)
    ),
  };
};

const groupByDay = (sales) => {
  const map = {};
  sales.forEach((s) => {
    if (!s.date) return;
    const d = new Date(s.date);
    if (isNaN(d.getTime())) return;
    const day = d.toLocaleDateString("en-IN", { weekday: "short" });
    if (!map[day]) map[day] = { day, revenue: 0, profit: 0 };
    map[day].revenue += s.totalAmount || 0;
    map[day].profit  += s.totalProfit || 0;
  });
  return Object.values(map).slice(-7);
};

const groupByCategory = (products) => {
  const map = {};
  products.forEach((p) => {
    if (!map[p.category]) map[p.category] = 0;
    map[p.category] += p.price * p.stock;
  });
  const colors = ["#2563EB", "#10B981", "#3B82F6", "#F59E0B", "#60A5FA"];
  const total  = Object.values(map).reduce((a, b) => a + b, 0) || 1;
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
      name:    p.name,
      sku:     p.barcode,
      stock:   p.stock,
      max:     p.threshold * 4 || 100,
      urgency: p.stock === 0 ? "critical" : p.stock <= p.threshold / 2 ? "warning" : "low",
    }));

const getRecentSales = (sales) =>
  [...sales]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)
    .map((s) => ({
      id:     s.billNumber,
      item:   `${s.totalItems || 0} items`,
      amount: `₹${(s.totalAmount || 0).toLocaleString("en-IN")}`,
      profit: `₹${(s.totalProfit || 0).toLocaleString("en-IN")}`,
    }));

// ── nav config ─────────────────────────────────────────────────────────────

const NAV = [
  { label: "Dashboard", page: null        },
  { label: "Products",  page: "products"  },
  { label: "Billing",   page: "billing"   },
  { label: "Sales",     page: "sales"     },
  { label: "Reports",   page: "reports"   },
];

// ── sub-components ─────────────────────────────────────────────────────────

const StatCard = ({ label, value, sub, icon }) => (
  <div className="db-stat-card">
    <div className="db-stat-icon">{icon}</div>
    <div>
      <div className="db-stat-label">{label}</div>
      <div className="db-stat-value">{value}</div>
      {sub && <div className="db-stat-sub">{sub}</div>}
    </div>
  </div>
);

const Spinner = () => (
  <div style={{
    display: "flex", alignItems: "center", justifyContent: "center",
    height: 200, color: "var(--text-muted)", fontSize: 13, gap: 10,
  }}>
    <div className="pp-spinner" />
    Loading data...
  </div>
);

// ── sidebar ────────────────────────────────────────────────────────────────

const Sidebar = ({ setCurrentPage, user, logout, activePage, isPrivileged, onAiChat, onPoBuilder, showPoBuilder }) => (
  <aside className="db-sidebar">
    <div className="db-logo">S</div>

    <nav className="db-nav">
      {NAV.map(({ label, page }) => (
        <button
          key={label}
          className={`db-nav-item ${activePage === page ? "active" : ""}`}
          onClick={() => setCurrentPage(page)}
          title={label}
        >
          <span className="db-nav-icon" />
          <span>{label}</span>
        </button>
      ))}
      {isPrivileged && (
        <button
          className="db-nav-item"
          onClick={() => setCurrentPage("staff")}
          title="Staff"
        >
          <span className="db-nav-icon" />
          <span>Staff</span>
        </button>
      )}
      <button
        className="db-nav-item"
        onClick={logout}
        style={{ marginTop: "auto" }}
        title="Logout"
      >
        <span className="db-nav-icon" />
        <span>Logout</span>
      </button>
    </nav>

    <div className="db-user-pill" onClick={() => setCurrentPage("profile")} title="Profile">
      <div className="db-avatar">{user?.name?.[0]?.toUpperCase() || "U"}</div>
      <div>
        <div className="db-user-name">{user?.name}</div>
        <div className="db-user-role">{user?.role}</div>
      </div>
    </div>
  </aside>
);

// ── main ───────────────────────────────────────────────────────────────────

const DashboardPage = ({ setCurrentPage }) => {
  const { user, logout } = useAuth();
  const [sales,    setSales]    = useState([]);
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showAiChat, setShowAiChat] = useState(false);

  const [lowStockPOs,      setLowStockPOs]      = useState([]);
  const [selectedPoProds,  setSelectedPoProds]  = useState({});
  const [showPoBuilder,    setShowPoBuilder]    = useState(false);
  const [showSavedPos,     setShowSavedPos]     = useState(false);
  const [savedPOs,         setSavedPOs]         = useState([]);
  const [poError,          setPoError]          = useState("");
  const [poSuccess,        setPoSuccess]        = useState("");

  const isPrivileged = user?.role === "owner" || user?.role === "admin";

  const loadPoData = async () => {
    try {
      const [lowStockData, generatedData] = await Promise.all([
        fetchLowStockPurchaseOrdersReport(),
        fetchGeneratedPurchaseOrders(),
      ]);
      setLowStockPOs(lowStockData || []);
      setSavedPOs((generatedData || []).map(normalizePurchaseOrder));
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
        if (isPrivileged) await loadPoData();
      } catch (e) {
        console.error("Dashboard fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isPrivileged]);

  useEffect(() => {
    const init = lowStockPOs.reduce((map, vg) => {
      vg.products.forEach((p) => { map[p.productId] = false; });
      return map;
    }, {});
    setSelectedPoProds(init);
  }, [lowStockPOs]);

  const handleSelectAll = (checked) => {
    const next = lowStockPOs.reduce((map, vg) => {
      vg.products.forEach((p) => { map[p.productId] = checked; });
      return map;
    }, {});
    setSelectedPoProds(next);
  };

  const handleToggleProd = (id) =>
    setSelectedPoProds((cur) => ({ ...cur, [id]: !cur[id] }));

  const handleGeneratePO = async () => {
    setPoError(""); setPoSuccess("");
    const ids = Object.entries(selectedPoProds)
      .filter(([, v]) => v).map(([k]) => k);
    if (!ids.length) {
      setPoError("Select at least one product.");
      return;
    }
    try {
      const result = await generatePurchaseOrders(ids);
      await loadPoData();
      setPoSuccess(result.message || "Purchase orders generated successfully.");
      setShowPoBuilder(false);
      setSelectedPoProds({});
    } catch (e) {
      setPoError(e.response?.data?.message || "Failed to generate purchase orders");
    }
  };

  const handleDownloadPO = async (po) => {
    try {
      const blob = await downloadPurchaseOrderPdf(po._id || po.id);
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${po.poNumber}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download failed:", e);
    }
  };

  // computed
  const today         = new Date().toDateString();
  const todaySales    = sales.filter((s) => {
    if (!s.date) return false;
    const d = new Date(s.date);
    return !isNaN(d.getTime()) && d.toDateString() === today;
  });
  const todayRevenue  = todaySales.reduce((a, s) => a + (s.totalAmount || 0), 0);
  const todayProfit   = todaySales.reduce((a, s) => a + (s.totalProfit || 0), 0);
  const totalOrders   = todaySales.length;
  const lowStockCount = products.filter((p) => (p.stock || 0) <= (p.threshold || 0)).length;

  const chartData    = groupByDay(sales);
  const categoryData = groupByCategory(products);
  const lowStock     = getLowStock(products);
  const recentSales  = getRecentSales(sales);

  const allPoIds      = lowStockPOs.flatMap((vg) => vg.products.map((p) => p.productId));
  const selectedCount = allPoIds.filter((id) => selectedPoProds[id]).length;
  const allSelected   = allPoIds.length > 0 && selectedCount === allPoIds.length;

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="db-root">
      <Sidebar
        setCurrentPage={setCurrentPage}
        user={user}
        logout={logout}
        activePage={null}
        isPrivileged={isPrivileged}
      />

      <main className="db-main">

        {/* TOPBAR */}
        <div className="db-topbar">
          <div>
            <div className="db-greeting">{greeting}, {user?.name?.split(" ")[0] || "there"}</div>
            <div className="db-subgreeting">Here is what is happening in your store today.</div>
          </div>
          <div className="db-topbar-actions">
            <button
              className="db-action-btn"
              style={{
                background: "var(--surface-1)",
                color: "var(--blue-600)",
                border: "1.5px solid var(--blue-200)",
                boxShadow: "var(--card-shadow)",
              }}
              onClick={() => setShowAiChat(true)}
            >
              AI Assistant
            </button>
            {isPrivileged && (
              <button
                className="db-action-btn"
                style={{
                  background: showPoBuilder ? "var(--blue-800)" : "var(--surface-deep)",
                  color: "#fff",
                }}
                onClick={() => setShowPoBuilder((c) => !c)}
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
            {/* PO BUILDER */}
            {showPoBuilder && isPrivileged && (
              <div className="db-glass-panel" style={{ border: "1.5px solid var(--blue-200)" }}>
                <div className="db-panel-header">
                  <div>
                    <div className="db-panel-title">Purchase Order Builder</div>
                    <div className="db-panel-sub">Select products to generate purchase orders for vendors.</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <label style={{ fontSize: 13, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                      <input type="checkbox" checked={allSelected} onChange={(e) => handleSelectAll(e.target.checked)} />
                      Select All
                    </label>
                    <button className="db-action-btn" onClick={handleGeneratePO}>
                      Generate ({selectedCount})
                    </button>
                  </div>
                </div>
                {poError   && <div className="error-text"   style={{ marginBottom: 12 }}>{poError}</div>}
                {poSuccess && <div className="success-text" style={{ marginBottom: 12 }}>{poSuccess}</div>}
                <div className="db-po-groups">
                  {lowStockPOs.length === 0 ? (
                    <div className="db-empty">No low stock products available for PO generation.</div>
                  ) : lowStockPOs.map((vendor) => (
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
                              checked={!!selectedPoProds[p.productId]}
                              onChange={() => handleToggleProd(p.productId)}
                              style={{ marginRight: 8 }}
                            />
                            {p.productName}
                          </label>
                          <span>Req: {p.recommendedOrderQuantity}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STAT CARDS */}
            <div className="db-stats-row">
              <StatCard
                label="Today's Revenue"
                value={`₹${(todayRevenue || 0).toLocaleString("en-IN")}`}
                sub={`${totalOrders} orders today`}
                icon="₹"
              />
              <StatCard
                label="Today's Orders"
                value={totalOrders}
                sub="from sales records"
                icon="#"
              />
              <StatCard
                label="Today's Profit"
                value={`₹${(todayProfit || 0).toLocaleString("en-IN")}`}
                sub={todayRevenue > 0 ? `${Math.round((todayProfit / todayRevenue) * 100)}% margin` : "no sales yet"}
                icon="+"
              />
              <StatCard
                label="Low Stock Items"
                value={lowStockCount}
                sub={lowStockCount > 0 ? "needs attention" : "all stocked up"}
                icon="!"
              />
            </div>

            {/* SAVED POs */}
            {isPrivileged && savedPOs.length > 0 && (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div className="db-panel-title">Generated Purchase Orders</div>
                  <button className="db-view-all" onClick={() => setShowSavedPos((c) => !c)}>
                    {showSavedPos ? "Hide" : "View All"}
                  </button>
                </div>
                <div className={`db-pos-container ${showSavedPos ? "expanded" : "scroll"}`}>
                  {savedPOs.map((po) => (
                    <div key={po.poNumber} className="po-glass-card">
                      <div className="po-card-header">
                        <div>
                          <div className="po-card-num">{po.poNumber}</div>
                          <div className="po-card-date">{new Date(po.generatedAt).toLocaleDateString()}</div>
                        </div>
                        <button className="po-dl-btn" onClick={() => handleDownloadPO(po)}>
                          PDF
                        </button>
                      </div>
                      <div className="po-card-vendor">{po.vendorName}</div>
                      <div className="po-card-amount">₹{formatCurrency(po.finalAmount)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CHARTS */}
            <div className="db-charts-row">
              <div className="db-glass-panel">
                <div className="db-panel-header">
                  <div>
                    <div className="db-panel-title">Revenue & Profit</div>
                    <div className="db-panel-sub">Last 7 days</div>
                  </div>
                </div>
                {chartData.length === 0 ? (
                  <div className="db-empty">No sales data yet — make your first sale.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#2563EB" stopOpacity={0}   />
                        </linearGradient>
                        <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#10B981" stopOpacity={0.18} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}    />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" tick={{ fill: "#8FA3C4", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#8FA3C4", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: "#fff",
                          border: "1px solid #E3EAF6",
                          borderRadius: 10,
                          color: "#0A1628",
                          fontSize: 12,
                          boxShadow: "0 4px 16px rgba(10,22,40,0.1)",
                        }}
                        formatter={(val) => `₹${(val || 0).toLocaleString("en-IN")}`}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2} fill="url(#revGrad)" />
                      <Area type="monotone" dataKey="profit"  stroke="#10B981" strokeWidth={2} fill="url(#profGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
                <div className="db-chart-legend">
                  <span><span className="db-legend-dot" style={{ background: "#2563EB" }} />Revenue</span>
                  <span><span className="db-legend-dot" style={{ background: "#10B981" }} />Profit</span>
                </div>
              </div>

              <div className="db-glass-panel db-chart-side">
                <div className="db-panel-title">Categories</div>
                <div className="db-panel-sub" style={{ marginBottom: 14 }}>Stock value split</div>
                {categoryData.length === 0 ? (
                  <div className="db-empty">No products yet</div>
                ) : (
                  <>
                    <PieChart width={130} height={130}>
                      <Pie
                        data={categoryData}
                        cx={60} cy={60}
                        innerRadius={38} outerRadius={60}
                        dataKey="value"
                        strokeWidth={2}
                        stroke="#EEF2F8"
                      >
                        {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                    </PieChart>
                    <div className="db-donut-legend">
                      {categoryData.map((c) => (
                        <div key={c.name} className="db-donut-row">
                          <span className="db-legend-dot" style={{ background: c.color }} />
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
                </div>
                {lowStock.length === 0 ? (
                  <div className="db-empty">All products are well stocked</div>
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
                  <button className="db-view-all" onClick={() => setCurrentPage("sales")}>View All</button>
                </div>
                {recentSales.length === 0 ? (
                  <div className="db-empty">No sales recorded yet</div>
                ) : (
                  <table className="db-table">
                    <thead>
                      <tr>
                        <th>Bill No.</th>
                        <th>Items</th>
                        <th>Amount</th>
                        <th>Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentSales.map((s) => (
                        <tr key={s.id}>
                          <td className="db-order-id">{s.id}</td>
                          <td>{s.item}</td>
                          <td style={{ fontWeight: 600 }}>{s.amount}</td>
                          <td style={{ color: "#059669", fontWeight: 600 }}>{s.profit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {isPrivileged && (
              <div className="db-reports-hint">
                You have access to detailed reports — daily sales, monthly trends, top products and profit analysis.
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
