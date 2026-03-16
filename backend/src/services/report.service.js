import { Product } from "../models/Product.js";
import { SoldProduct } from "../models/SoldProduct.js";
import { StockAlert } from "../models/StockAlert.js";
import { Bill } from "../models/Bill.js";
import { PurchaseOrder } from "../models/PurchaseOrder.js";
import { Vendor } from "../models/Vendor.js";

export const getDailySalesReport = async () => {
  return SoldProduct.aggregate([
    {
      $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" },
          day: { $dayOfMonth: "$date" }
        },
        totalSales: { $sum: "$totalPrice" },
        totalProfit: { $sum: "$profit" },
        totalItems: { $sum: "$quantity" }
      }
    },
    {
      $sort: {
        "_id.year": 1,
        "_id.month": 1,
        "_id.day": 1
      }
    }
  ]);
};

const getDateRangeForPeriod = (date, period) => {
  const baseDate = new Date(`${date}T00:00:00`);
  const startDate = new Date(baseDate);
  const endDate = new Date(baseDate);

  if (period === "weekwise") {
    const dayOfWeek = startDate.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    startDate.setDate(startDate.getDate() - daysFromMonday);
    endDate.setTime(startDate.getTime());
    endDate.setDate(startDate.getDate() + 6);
  } else if (period === "monthwise") {
    startDate.setDate(1);
    endDate.setMonth(startDate.getMonth() + 1, 0);
  }

  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
};

export const getItemWiseSalesForDate = async (date, period = "daywise") => {
  const { startDate, endDate } = getDateRangeForPeriod(date, period);

  return SoldProduct.aggregate([
    {
      $match: {
        date: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: "$productName",
        totalQuantitySold: { $sum: "$quantity" },
        totalSales: { $sum: "$totalPrice" },
        totalProfit: { $sum: "$profit" },
        barcode: { $first: "$barcode" }
      }
    },
    {
      $sort: {
        totalQuantitySold: -1,
        _id: 1
      }
    }
  ]);
};

export const getMonthlySalesReport = async () => {
  return SoldProduct.aggregate([
    {
      $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" }
        },
        totalSales: { $sum: "$totalPrice" },
        totalProfit: { $sum: "$profit" },
        totalItems: { $sum: "$quantity" }
      }
    },
    {
      $sort: {
        "_id.year": 1,
        "_id.month": 1
      }
    }
  ]);
};

export const getWeeklyProfitReport = async () => {
  return SoldProduct.aggregate([
    {
      $group: {
        _id: {
          year: { $isoWeekYear: "$date" },
          week: { $isoWeek: "$date" }
        },
        totalSales: { $sum: "$totalPrice" },
        totalProfit: { $sum: "$profit" },
        totalItems: { $sum: "$quantity" }
      }
    },
    {
      $sort: {
        "_id.year": 1,
        "_id.week": 1
      }
    }
  ]);
};

export const getTopProductsReport = async () => {
  return SoldProduct.aggregate([
    {
      $group: {
        _id: "$productId",
        productName: { $first: "$productName" },
        barcode: { $first: "$barcode" },
        totalQuantitySold: { $sum: "$quantity" },
        totalSales: { $sum: "$totalPrice" },
        totalProfit: { $sum: "$profit" }
      }
    },
    {
      $sort: {
        totalQuantitySold: -1
      }
    },
    {
      $limit: 10
    }
  ]);
};

export const getTotalProfitReport = async () => {
  const [salesSummary] = await SoldProduct.aggregate([
    {
      $group: {
        _id: null,
        totalSales: { $sum: "$totalPrice" },
        totalProfit: { $sum: "$profit" },
        totalItemsSold: { $sum: "$quantity" }
      }
    }
  ]);

  const [totalProducts, lowStockAlertsCount, lowStockAlerts] = await Promise.all([
    Product.countDocuments(),
    StockAlert.countDocuments({ status: "active" }),
    StockAlert.find({ status: "active" }).sort({ currentStock: 1, lastTriggeredAt: -1 }).limit(10)
  ]);

  return {
    totalProducts,
    totalSales: salesSummary?.totalSales ?? 0,
    totalProfit: salesSummary?.totalProfit ?? 0,
    totalItemsSold: salesSummary?.totalItemsSold ?? 0,
    lowStockAlertsCount,
    lowStockAlerts
  };
};

export const getCategoryProfitReport = async () => {
  return SoldProduct.aggregate([
    {
      $lookup: {
        from: "products",
        localField: "productId",
        foreignField: "_id",
        as: "product"
      }
    },
    {
      $unwind: {
        path: "$product",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $group: {
        _id: {
          $ifNull: ["$product.category", "Uncategorized"]
        },
        totalProfit: { $sum: "$profit" },
        totalSales: { $sum: "$totalPrice" },
        totalItems: { $sum: "$quantity" }
      }
    },
    {
      $sort: {
        totalProfit: -1,
        _id: 1
      }
    }
  ]);
};

export const getLowStockPurchaseOrdersReport = async () => {
  const lowStockProducts = await Product.find({
    $expr: { $lte: ["$stock", "$threshold"] }
  })
    .sort({ vendorEmail: 1, stock: 1, createdAt: -1 })
    .lean();

  const vendorEmails = [...new Set(lowStockProducts.map((product) => product.vendorEmail).filter(Boolean))];
  const vendors = await Vendor.find({ email: { $in: vendorEmails } }).lean();
  const vendorMap = new Map(vendors.map((vendor) => [vendor.email, vendor]));
  const activePurchaseOrders = await PurchaseOrder.find({}, { items: 1 }).lean();
  const activePoProductIds = new Set(
    activePurchaseOrders.flatMap((purchaseOrder) => purchaseOrder.items.map((item) => item.productId.toString()))
  );

  const groupedOrders = lowStockProducts.reduce((groups, product) => {
    if (activePoProductIds.has(product._id.toString())) {
      return groups;
    }

    const targetStock = Number(product.threshold) * 5;
    const recommendedOrderQuantity = Math.max(targetStock - Number(product.stock), 0);

    if (recommendedOrderQuantity <= 0) {
      return groups;
    }

    if (!groups[product.vendorEmail]) {
      const vendor = vendorMap.get(product.vendorEmail);

      groups[product.vendorEmail] = {
        vendorEmail: product.vendorEmail,
        vendorName: vendor?.name ?? product.vendorName ?? "Unknown Vendor",
        vendorPhoneNumber: vendor?.phoneNumber ?? "",
        vendorAddress: vendor?.address ?? product.vendorAddress ?? "",
        products: [],
        totalRecommendedOrderQuantity: 0
      };
    }

    groups[product.vendorEmail].products.push({
      productId: product._id,
      productName: product.name,
      category: product.category,
      barcode: product.barcode,
      cost: product.cost,
      currentStock: product.stock,
      threshold: product.threshold,
      targetStock,
      recommendedOrderQuantity
    });

    groups[product.vendorEmail].totalRecommendedOrderQuantity += recommendedOrderQuantity;

    return groups;
  }, {});

  return Object.values(groupedOrders);
};
