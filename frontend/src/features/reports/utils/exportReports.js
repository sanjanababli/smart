import jsPDF from "jspdf";
import * as XLSX from "xlsx";

export const exportReportsToPdf = ({ summary, dailySales, topProducts }) => {
  const pdf = new jsPDF();
  let y = 20;

  pdf.setFontSize(18);
  pdf.text("Sales Report", 14, y);
  y += 12;

  pdf.setFontSize(11);
  pdf.text(`Total Products: ${summary.totalProducts}`, 14, y);
  y += 8;
  pdf.text(`Total Sales: ${summary.totalSales}`, 14, y);
  y += 8;
  pdf.text(`Total Profit: ${summary.totalProfit}`, 14, y);
  y += 8;
  pdf.text(`Low Stock Alerts: ${summary.lowStockAlertsCount}`, 14, y);
  y += 12;

  pdf.setFontSize(14);
  pdf.text("Daily Sales", 14, y);
  y += 8;
  pdf.setFontSize(10);

  dailySales.slice(-10).forEach((item) => {
    const label = `${item._id.day}/${item._id.month}/${item._id.year}`;
    pdf.text(`${label}  Sales: ${item.totalSales}  Profit: ${item.totalProfit}`, 14, y);
    y += 6;
  });

  y += 8;
  pdf.setFontSize(14);
  pdf.text("Top Products", 14, y);
  y += 8;
  pdf.setFontSize(10);

  topProducts.forEach((item) => {
    pdf.text(`${item.productName}  Qty: ${item.totalQuantitySold}  Sales: ${item.totalSales}`, 14, y);
    y += 6;
  });

  pdf.save("sales-report.pdf");
};

export const exportReportsToExcel = ({ dailySales, monthlySales, topProducts }) => {
  const workbook = XLSX.utils.book_new();

  const dailySheet = XLSX.utils.json_to_sheet(
    dailySales.map((item) => ({
      date: `${item._id.day}/${item._id.month}/${item._id.year}`,
      totalSales: item.totalSales,
      totalProfit: item.totalProfit,
      totalItems: item.totalItems
    }))
  );

  const monthlySheet = XLSX.utils.json_to_sheet(
    monthlySales.map((item) => ({
      month: `${item._id.month}/${item._id.year}`,
      totalSales: item.totalSales,
      totalProfit: item.totalProfit,
      totalItems: item.totalItems
    }))
  );

  const topProductsSheet = XLSX.utils.json_to_sheet(topProducts);

  XLSX.utils.book_append_sheet(workbook, dailySheet, "Daily Sales");
  XLSX.utils.book_append_sheet(workbook, monthlySheet, "Monthly Sales");
  XLSX.utils.book_append_sheet(workbook, topProductsSheet, "Top Products");

  XLSX.writeFile(workbook, "sales-report.xlsx");
};
