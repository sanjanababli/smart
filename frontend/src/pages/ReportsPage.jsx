import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { Bar, Pie } from "react-chartjs-2";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip
} from "chart.js";
import {
  fetchCategoryProfitReport,
  fetchDailySalesReport,
  fetchItemWiseSalesReport,
  fetchMonthlyProfitReport,
  fetchWeeklyProfitReport,
  fetchTopProductsReport,
  fetchTotalProfitReport
} from "../features/reports/services/reportsApi.js";
import { exportReportsToExcel, exportReportsToPdf } from "../features/reports/utils/exportReports.js";

ChartJS.register(CategoryScale, LinearScale, ArcElement, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

const getTodayDateValue = () => new Date().toISOString().split("T")[0];
const formatItemWisePeriodLabel = (period, date) => {
  if (period === "weekwise") return `Week of ${date}`;
  if (period === "monthwise") return `Month of ${date}`;
  return date;
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: "rgba(255, 255, 255, 0.7)" } },
  },
  scales: {
    x: { ticks: { color: "rgba(255, 255, 255, 0.5)" }, grid: { color: "rgba(255, 255, 255, 0.05)" } },
    y: { ticks: { color: "rgba(255, 255, 255, 0.5)" }, grid: { color: "rgba(255, 255, 255, 0.05)" } }
  }
};

const ReportsPage = ({ setCurrentPage }) => {
  const { user, logout } = useAuth();
  const [summary, setSummary] = useState(null);
  const [dailySales, setDailySales] = useState([]);
  const [weeklyProfit, setWeeklyProfit] = useState([]);
  const [monthlySales, setMonthlySales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [categoryProfit, setCategoryProfit] = useState([]);
  const [dailyItemSales, setDailyItemSales] = useState([]);

  const [profitView, setProfitView] = useState("daywise");
  const [itemsSoldView, setItemsSoldView] = useState("daywise");
  const [itemWiseSalesView, setItemWiseSalesView] = useState("daywise");
  const [selectedItemSalesDate, setSelectedItemSalesDate] = useState(getTodayDateValue);

  const [error, setError] = useState("");
  const [dailyItemSalesError, setDailyItemSalesError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDailyItemSalesLoading, setIsDailyItemSalesLoading] = useState(false);

  useEffect(() => {
    const loadReports = async () => {
      try {
        setIsLoading(true);
        setError("");
        const [summaryData, dailyData, weeklyData, monthlyData, topProductsData, categoryProfitData] = await Promise.all([
          fetchTotalProfitReport(),
          fetchDailySalesReport(),
          fetchWeeklyProfitReport(),
          fetchMonthlyProfitReport(),
          fetchTopProductsReport(),
          fetchCategoryProfitReport()
        ]);

        setSummary(summaryData);
        setDailySales(dailyData);
        setWeeklyProfit(weeklyData);
        setMonthlySales(monthlyData);
        setTopProducts(topProductsData);
        setCategoryProfit(categoryProfitData);
      } catch (requestError) {
        setError(requestError.response?.data?.message || "Failed to load reports");
      } finally {
        setIsLoading(false);
      }
    };

    loadReports();
  }, []);

  useEffect(() => {
    const loadDailyItemSales = async () => {
      try {
        setIsDailyItemSalesLoading(true);
        setDailyItemSalesError("");
        const data = await fetchItemWiseSalesReport({
          date: selectedItemSalesDate,
          period: itemWiseSalesView
        });
        setDailyItemSales(data);
      } catch (requestError) {
        setDailyItemSalesError(requestError.response?.data?.message || "Failed to load item-wise sales");
      } finally {
        setIsDailyItemSalesLoading(false);
      }
    };
    loadDailyItemSales();
  }, [selectedItemSalesDate, itemWiseSalesView]);

  const profitChartConfig = {
    daywise: {
      title: "Daily Profit",
      labels: dailySales.map((item) => `${item._id.day}/${item._id.month}`),
      data: dailySales.map((item) => item.totalProfit),
      color: "#a78bfa"
    },
    weekly: {
      title: "Weekly Profit",
      labels: weeklyProfit.map((item) => `W${item._id.week}, ${item._id.year}`),
      data: weeklyProfit.map((item) => item.totalProfit),
      color: "#34d399"
    },
    monthly: {
      title: "Monthly Profit",
      labels: monthlySales.map((item) => `${item._id.month}/${item._id.year}`),
      data: monthlySales.map((item) => item.totalProfit),
      color: "#60a5fa"
    }
  };

  const itemsSoldChartConfig = {
    daywise: {
      title: "Daily Items Sold",
      labels: dailySales.map((item) => `${item._id.day}/${item._id.month}`),
      data: dailySales.map((item) => item.totalItems),
      color: "#f472b6"
    },
    weekly: {
      title: "Weekly Items Sold",
      labels: weeklyProfit.map((item) => `W${item._id.week}, ${item._id.year}`),
      data: weeklyProfit.map((item) => item.totalItems),
      color: "#fbbf24"
    },
    monthly: {
      title: "Monthly Items Sold",
      labels: monthlySales.map((item) => `${item._id.month}/${item._id.year}`),
      data: monthlySales.map((item) => item.totalItems),
      color: "#94a3b8"
    }
  };

  const activeProfitChart = profitChartConfig[profitView];
  const activeItemsSoldChart = itemsSoldChartConfig[itemsSoldView];

  const profitChartData = {
    labels: activeProfitChart.labels,
    datasets: [{ label: activeProfitChart.title, data: activeProfitChart.data, backgroundColor: activeProfitChart.color }]
  };

  const itemsSoldChartData = {
    labels: activeItemsSoldChart.labels,
    datasets: [{ label: activeItemsSoldChart.title, data: activeItemsSoldChart.data, backgroundColor: activeItemsSoldChart.color }]
  };

  const pieColors = ["#a78bfa", "#34d399", "#60a5fa", "#f472b6", "#fbbf24", "#94a3b8", "#f87171", "#38bdf8"];

  const categoryProfitChartData = {
    labels: categoryProfit.map((item) => item._id),
    datasets: [{
      label: "Category Profit",
      data: categoryProfit.map((item) => item.totalProfit),
      backgroundColor: categoryProfit.map((_, i) => pieColors[i % pieColors.length]),
      borderColor: "rgba(255,255,255,0.1)",
      borderWidth: 1
    }]
  };

  const dailyItemSalesChartData = {
    labels: dailyItemSales.map((item) => item._id),
    datasets: [{
      label: `Items Sold for ${formatItemWisePeriodLabel(itemWiseSalesView, selectedItemSalesDate)}`,
      data: dailyItemSales.map((item) => item.totalQuantitySold),
      backgroundColor: dailyItemSales.map((_, i) => pieColors[i % pieColors.length])
    }]
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
          <button className="db-nav-item" onClick={() => setCurrentPage("sales")}>
            <span className="db-nav-icon">📊</span><span>Sales</span>
          </button>
          <button className="db-nav-item active" onClick={() => setCurrentPage("reports")}>
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
          <h1 className="pp-title">Reports</h1>
          <div className="pp-header-actions">
            <button
              type="button"
              className="pp-btn-secondary"
              onClick={() => exportReportsToPdf({ summary, dailySales, topProducts })}
              disabled={!summary || isLoading}
            >
              📄 Export PDF
            </button>
            <button
              type="button"
              className="pp-btn-primary"
              onClick={() => exportReportsToExcel({ dailySales, monthlySales, topProducts })}
              disabled={!summary || isLoading}
            >
              📊 Export Excel
            </button>
          </div>
        </div>

        {error && <div className="pp-form-error" style={{ marginBottom: "1rem" }}>{error}</div>}

        {isLoading || !summary ? (
          <div className="pp-loading">
            <div className="pp-spinner" />
            Loading reports...
          </div>
        ) : (
          <>
            <div className="db-stats-row">
              <div className="db-stat-card">
                <div className="db-stat-icon" style={{ background: "rgba(167,139,250,0.2)" }}>💰</div>
                <div>
                  <div className="db-stat-label">Total Sales</div>
                  <div className="db-stat-value">₹{summary.totalSales?.toLocaleString("en-IN") || 0}</div>
                </div>
              </div>
              <div className="db-stat-card">
                <div className="db-stat-icon" style={{ background: "rgba(52,211,153,0.2)" }}>📈</div>
                <div>
                  <div className="db-stat-label">Total Profit</div>
                  <div className="db-stat-value">₹{summary.totalProfit?.toLocaleString("en-IN") || 0}</div>
                </div>
              </div>
              <div className="db-stat-card">
                <div className="db-stat-icon" style={{ background: "rgba(96,165,250,0.2)" }}>🏷️</div>
                <div>
                  <div className="db-stat-label">Total Items Sold</div>
                  <div className="db-stat-value">{summary.totalItemsSold?.toLocaleString() || 0}</div>
                </div>
              </div>
              <div className="db-stat-card">
                <div className="db-stat-icon" style={{ background: "rgba(244,114,182,0.2)" }}>⚠️</div>
                <div>
                  <div className="db-stat-label">Low Stock Alerts</div>
                  <div className="db-stat-value">{summary.lowStockAlertsCount || 0}</div>
                </div>
              </div>
            </div>

            <div className="db-reports-grid-balanced" style={{ marginTop: "1.5rem" }}>
              {/* PROFIT ANALYTICS */}
              <div className="db-glass-panel" style={{ minHeight: "380px" }}>
                <div className="db-panel-header">
                  <div className="db-panel-title">{activeProfitChart.title}</div>
                  <select 
                    className="db-select-glass" 
                    value={profitView} 
                    onChange={(e) => setProfitView(e.target.value)}
                  >
                    <option value="daywise">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div style={{ height: "300px" }}>
                  <Bar data={profitChartData} options={chartOptions} />
                </div>
              </div>

              {/* ITEMS SOLD ANALYTICS */}
              <div className="db-glass-panel" style={{ minHeight: "380px" }}>
                <div className="db-panel-header">
                  <div className="db-panel-title">{activeItemsSoldChart.title}</div>
                  <select 
                    className="db-select-glass" 
                    value={itemsSoldView} 
                    onChange={(e) => setItemsSoldView(e.target.value)}
                  >
                    <option value="daywise">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div style={{ height: "300px" }}>
                  <Bar data={itemsSoldChartData} options={chartOptions} />
                </div>
              </div>
            </div>

            <div className="db-reports-grid-asymmetric" style={{ marginTop: "1.5rem" }}>
              {/* CATEGORY PROFIT (Pie) */}
              <div className="db-glass-panel" style={{ minHeight: "440px" }}>
                <div className="db-panel-header">
                  <div className="db-panel-title">Category Wise Profit</div>
                </div>
                <div style={{ height: "360px", display: "flex", justifyContent: "center" }}>
                  {categoryProfit.length ? (
                    <Pie 
                      data={categoryProfitChartData} 
                      options={{
                        ...chartOptions,
                        plugins: { ...chartOptions.plugins, legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 }, color: "rgba(255,255,255,0.7)" } } }
                      }} 
                    />
                  ) : (
                    <div className="db-empty">No category profit data yet.</div>
                  )}
                </div>
              </div>

              {/* ITEM WISE SALES ANALYTICS */}
              <div className="db-glass-panel" style={{ minHeight: "440px" }}>
                <div className="db-panel-header">
                  <div className="db-panel-header-stack">
                    <div className="db-panel-title">Item Wise Sales Analytics</div>
                    <div className="db-panel-sub">Compare sold items for a specific date and period.</div>
                  </div>
                  <div className="db-panel-actions-row">
                    <select 
                      className="db-select-glass" 
                      value={itemWiseSalesView} 
                      onChange={(e) => setItemWiseSalesView(e.target.value)}
                    >
                      <option value="daywise">Daywise</option>
                      <option value="weekwise">Weekwise</option>
                      <option value="monthwise">Monthwise</option>
                    </select>
                    <input
                      type="date"
                      className="db-input-glass"
                      value={selectedItemSalesDate}
                      onChange={(e) => setSelectedItemSalesDate(e.target.value)}
                    />
                  </div>
                </div>
                {dailyItemSalesError ? <div className="glass-error">{dailyItemSalesError}</div> : null}
                <div style={{ height: "340px" }}>
                  {isDailyItemSalesLoading ? (
                    <div className="pp-loading" style={{ height: "100%", border: "none" }}><div className="pp-spinner" /></div>
                  ) : dailyItemSales.length ? (
                    <Bar 
                      data={dailyItemSalesChartData} 
                      options={{
                        ...chartOptions,
                        plugins: { ...chartOptions.plugins, legend: { display: false } },
                        scales: { ...chartOptions.scales, x: { ...chartOptions.scales.x, ticks: { ...chartOptions.scales.x.ticks, autoSkip: false, maxRotation: 45, minRotation: 25 } } }
                      }} 
                    />
                  ) : (
                    <div className="db-empty">No items sold for this period.</div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default ReportsPage;
