import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { Bar, Pie } from "react-chartjs-2";
import {
  ArcElement, BarElement, CategoryScale, Chart as ChartJS,
  Legend, LinearScale, LineElement, PointElement, Title, Tooltip,
} from "chart.js";
import {
  fetchCategoryProfitReport, fetchDailySalesReport, fetchItemWiseSalesReport,
  fetchMonthlyProfitReport, fetchWeeklyProfitReport, fetchTopProductsReport, fetchTotalProfitReport,
} from "../features/reports/services/reportsApi.js";
import { exportReportsToExcel, exportReportsToPdf } from "../features/reports/utils/exportReports.js";
import AppSidebar from "./AppSidebar.jsx";

ChartJS.register(CategoryScale, LinearScale, ArcElement, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

const getTodayDateValue = () => new Date().toISOString().split("T")[0];

const formatItemWisePeriodLabel = (period, date) => {
  if (period === "weekwise")  return `Week of ${date}`;
  if (period === "monthwise") return `Month of ${date}`;
  return date;
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: "#4B6089", font: { size: 12, family: "Inter" } } },
  },
  scales: {
    x: { ticks: { color: "#8FA3C4", font: { size: 11 } }, grid: { color: "rgba(10,22,40,0.05)" }, border: { color: "rgba(10,22,40,0.08)" } },
    y: { ticks: { color: "#8FA3C4", font: { size: 11 } }, grid: { color: "rgba(10,22,40,0.05)" }, border: { color: "rgba(10,22,40,0.08)" } },
  },
};

const CHART_COLORS = ["#2563EB", "#10B981", "#3B82F6", "#F59E0B", "#60A5FA", "#EF4444", "#8B5CF6", "#06B6D4"];

const ReportsPage = ({ setCurrentPage }) => {
  const { user, logout } = useAuth();

  const [summary,        setSummary]        = useState(null);
  const [dailySales,     setDailySales]     = useState([]);
  const [weeklyProfit,   setWeeklyProfit]   = useState([]);
  const [monthlySales,   setMonthlySales]   = useState([]);
  const [topProducts,    setTopProducts]    = useState([]);
  const [categoryProfit, setCategoryProfit] = useState([]);
  const [dailyItemSales, setDailyItemSales] = useState([]);

  const [profitView,            setProfitView]            = useState("daywise");
  const [itemsSoldView,         setItemsSoldView]         = useState("daywise");
  const [itemWiseSalesView,     setItemWiseSalesView]     = useState("daywise");
  const [selectedItemSalesDate, setSelectedItemSalesDate] = useState(getTodayDateValue);

  const [error,                   setError]                   = useState("");
  const [dailyItemSalesError,     setDailyItemSalesError]     = useState("");
  const [isLoading,               setIsLoading]               = useState(true);
  const [isDailyItemSalesLoading, setIsDailyItemSalesLoading] = useState(false);

  useEffect(() => {
    const loadReports = async () => {
      try {
        setIsLoading(true); setError("");
        const [summaryData, dailyData, weeklyData, monthlyData, topProductsData, categoryProfitData] = await Promise.all([
          fetchTotalProfitReport(), fetchDailySalesReport(), fetchWeeklyProfitReport(),
          fetchMonthlyProfitReport(), fetchTopProductsReport(), fetchCategoryProfitReport(),
        ]);
        setSummary(summaryData); setDailySales(dailyData); setWeeklyProfit(weeklyData);
        setMonthlySales(monthlyData); setTopProducts(topProductsData); setCategoryProfit(categoryProfitData);
      } catch (e) { setError(e.response?.data?.message || "Failed to load reports"); }
      finally { setIsLoading(false); }
    };
    loadReports();
  }, []);

  useEffect(() => {
    const loadDailyItemSales = async () => {
      try {
        setIsDailyItemSalesLoading(true); setDailyItemSalesError("");
        const data = await fetchItemWiseSalesReport({ date: selectedItemSalesDate, period: itemWiseSalesView });
        setDailyItemSales(data);
      } catch (e) { setDailyItemSalesError(e.response?.data?.message || "Failed to load item-wise sales"); }
      finally { setIsDailyItemSalesLoading(false); }
    };
    loadDailyItemSales();
  }, [selectedItemSalesDate, itemWiseSalesView]);

  const profitChartConfig = {
    daywise: { title: "Daily Profit",   labels: dailySales.map((i) => `${i._id.day}/${i._id.month}`),           data: dailySales.map((i) => i.totalProfit),   color: "#2563EB" },
    weekly:  { title: "Weekly Profit",  labels: weeklyProfit.map((i) => `W${i._id.week}, ${i._id.year}`),       data: weeklyProfit.map((i) => i.totalProfit), color: "#10B981" },
    monthly: { title: "Monthly Profit", labels: monthlySales.map((i) => `${i._id.month}/${i._id.year}`),        data: monthlySales.map((i) => i.totalProfit), color: "#3B82F6" },
  };

  const itemsSoldChartConfig = {
    daywise: { title: "Daily Items Sold",   labels: dailySales.map((i) => `${i._id.day}/${i._id.month}`),  data: dailySales.map((i) => i.totalItems),    color: "#F59E0B" },
    weekly:  { title: "Weekly Items Sold",  labels: weeklyProfit.map((i) => `W${i._id.week}`),             data: weeklyProfit.map((i) => i.totalItems),  color: "#60A5FA" },
    monthly: { title: "Monthly Items Sold", labels: monthlySales.map((i) => `${i._id.month}/${i._id.year}`), data: monthlySales.map((i) => i.totalItems), color: "#8B5CF6" },
  };

  const activeProfitChart    = profitChartConfig[profitView];
  const activeItemsSoldChart = itemsSoldChartConfig[itemsSoldView];

  const mkBarData = (cfg) => ({
    labels: cfg.labels,
    datasets: [{ label: cfg.title, data: cfg.data, backgroundColor: cfg.color, borderRadius: 6, borderSkipped: false }],
  });

  const categoryProfitChartData = {
    labels: categoryProfit.map((i) => i._id),
    datasets: [{ label: "Category Profit", data: categoryProfit.map((i) => i.totalProfit), backgroundColor: categoryProfit.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]), borderColor: "#fff", borderWidth: 2 }],
  };

  const dailyItemSalesChartData = {
    labels: dailyItemSales.map((i) => i._id),
    datasets: [{ label: `Items Sold — ${formatItemWisePeriodLabel(itemWiseSalesView, selectedItemSalesDate)}`, data: dailyItemSales.map((i) => i.totalQuantitySold), backgroundColor: dailyItemSales.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]), borderRadius: 6, borderSkipped: false }],
  };

  const statCards = [
    { label: "Total Sales",      value: `₹${summary?.totalSales?.toLocaleString("en-IN") || 0}`,  icon: "₹" },
    { label: "Total Profit",     value: `₹${summary?.totalProfit?.toLocaleString("en-IN") || 0}`, icon: "+" },
    { label: "Total Items Sold", value: summary?.totalItemsSold?.toLocaleString() || 0,            icon: "#" },
    { label: "Low Stock Alerts", value: summary?.lowStockAlertsCount || 0,                         icon: "!" },
  ];

  return (
    <div className="db-root">
      <AppSidebar setCurrentPage={setCurrentPage} user={user} logout={logout} activePage="reports" />

      <main className="db-main">
        <div className="pp-header">
          <div>
            <div className="db-greeting">Reports</div>
            <div className="db-subgreeting">Analytics, profit trends and export tools.</div>
          </div>
          <div className="pp-header-actions">
            <button type="button" className="pp-btn-secondary" onClick={() => exportReportsToPdf({ summary, dailySales, topProducts })} disabled={!summary || isLoading}>
              Export PDF
            </button>
            <button type="button" className="pp-btn-primary" onClick={() => exportReportsToExcel({ dailySales, monthlySales, topProducts })} disabled={!summary || isLoading}>
              Export Excel
            </button>
          </div>
        </div>

        {error && <div className="error-text" style={{ marginBottom: 14 }}>{error}</div>}

        {isLoading || !summary ? (
          <div className="pp-loading"><div className="pp-spinner" />Loading reports...</div>
        ) : (
          <>
            <div className="db-stats-row">
              {statCards.map(({ label, value, icon }) => (
                <div key={label} className="db-stat-card">
                  <div className="db-stat-icon" style={{ fontSize: 18, fontWeight: 800 }}>{icon}</div>
                  <div>
                    <div className="db-stat-label">{label}</div>
                    <div className="db-stat-value">{value}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="db-reports-grid-balanced">
              <div className="db-glass-panel" style={{ minHeight: 360 }}>
                <div className="db-panel-header">
                  <div className="db-panel-title">{activeProfitChart.title}</div>
                  <select className="db-select-glass" value={profitView} onChange={(e) => setProfitView(e.target.value)}>
                    <option value="daywise">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div style={{ height: 280 }}>
                  <Bar data={mkBarData(activeProfitChart)} options={chartOptions} />
                </div>
              </div>

              <div className="db-glass-panel" style={{ minHeight: 360 }}>
                <div className="db-panel-header">
                  <div className="db-panel-title">{activeItemsSoldChart.title}</div>
                  <select className="db-select-glass" value={itemsSoldView} onChange={(e) => setItemsSoldView(e.target.value)}>
                    <option value="daywise">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div style={{ height: 280 }}>
                  <Bar data={mkBarData(activeItemsSoldChart)} options={chartOptions} />
                </div>
              </div>
            </div>

            <div className="db-reports-grid-asymmetric">
              <div className="db-glass-panel" style={{ minHeight: 420 }}>
                <div className="db-panel-header"><div className="db-panel-title">Category Wise Profit</div></div>
                <div style={{ height: 340, display: "flex", justifyContent: "center" }}>
                  {categoryProfit.length ? (
                    <Pie data={categoryProfitChartData} options={{ ...chartOptions, plugins: { ...chartOptions.plugins, legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 11 }, color: "#4B6089" } } } }} />
                  ) : (
                    <div className="db-empty">No category profit data yet.</div>
                  )}
                </div>
              </div>

              <div className="db-glass-panel" style={{ minHeight: 420 }}>
                <div className="db-panel-header">
                  <div className="db-panel-header-stack">
                    <div className="db-panel-title">Item Wise Sales Analytics</div>
                    <div className="db-panel-sub">Compare sold items for a specific date and period.</div>
                  </div>
                  <div className="db-panel-actions-row">
                    <select className="db-select-glass" value={itemWiseSalesView} onChange={(e) => setItemWiseSalesView(e.target.value)}>
                      <option value="daywise">Daywise</option>
                      <option value="weekwise">Weekwise</option>
                      <option value="monthwise">Monthwise</option>
                    </select>
                    <input type="date" className="db-input-glass" value={selectedItemSalesDate} onChange={(e) => setSelectedItemSalesDate(e.target.value)} />
                  </div>
                </div>
                {dailyItemSalesError && <div className="error-text" style={{ marginBottom: 10 }}>{dailyItemSalesError}</div>}
                <div style={{ height: 320 }}>
                  {isDailyItemSalesLoading ? (
                    <div className="pp-loading" style={{ height: "100%" }}><div className="pp-spinner" /></div>
                  ) : dailyItemSales.length ? (
                    <Bar data={dailyItemSalesChartData} options={{ ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: false } }, scales: { ...chartOptions.scales, x: { ...chartOptions.scales.x, ticks: { ...chartOptions.scales.x.ticks, autoSkip: false, maxRotation: 45, minRotation: 25 } } } }} />
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