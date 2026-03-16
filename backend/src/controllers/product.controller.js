import { Product } from "../models/Product.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { ApiError } from "../utils/ApiError.js";
import { syncStockAlert } from "../services/stockAlert.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const findProductById = async (id) => {
  const product = await Product.findById(id);

  if (!product) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Product not found");
  }

  return product;
};

export const createProduct = asyncHandler(async (req, res) => {
  const { name, category, price, cost, stock, threshold, barcode, vendorName, vendorEmail, vendorAddress } = req.body;

  if (
    !name ||
    !category ||
    price === undefined ||
    cost === undefined ||
    stock === undefined ||
    threshold === undefined ||
    !barcode
  ) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      "Name, category, price, cost, stock, threshold, and barcode are required"
    );
  }

  const existingProduct = await Product.findOne({ barcode: barcode.trim() });

  if (existingProduct) {
    throw new ApiError(HTTP_STATUS.CONFLICT, "Product already exists with this barcode");
  }

  const product = await Product.create({
    name,
    category,
    price,
    cost,
    stock,
    threshold,
    barcode,
    vendorName: vendorName || "TAXAS",
    vendorEmail: vendorEmail || "pratrnerli@gmail.com",
    vendorAddress: vendorAddress || "belgavi"
  });

  await syncStockAlert(product);

  res.status(HTTP_STATUS.CREATED).json({ data: product });
});

export const getProducts = asyncHandler(async (_req, res) => {
  const { search, category, minPrice, maxPrice, inStock } = _req.query;
  const filters = {};

  if (search) {
    filters.$or = [
      { name: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
      { barcode: { $regex: search, $options: "i" } }
    ];
  }

  if (category) {
    filters.category = { $regex: `^${category}$`, $options: "i" };
  }

  if (minPrice || maxPrice) {
    filters.price = {};

    if (minPrice) {
      filters.price.$gte = Number(minPrice);
    }

    if (maxPrice) {
      filters.price.$lte = Number(maxPrice);
    }
  }

  if (inStock === "true") {
    filters.stock = { $gt: 0 };
  }

  const products = await Product.find(filters).sort({ createdAt: -1 });
  res.status(HTTP_STATUS.OK).json({ data: products });
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await findProductById(req.params.id);
  res.status(HTTP_STATUS.OK).json({ data: product });
});

export const getProductByBarcode = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ barcode: req.params.barcode.trim() });

  if (!product) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Product not found");
  }

  res.status(HTTP_STATUS.OK).json({ data: product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const { barcode } = req.body;

  if (barcode) {
    const existingProduct = await Product.findOne({ barcode: barcode.trim(), _id: { $ne: req.params.id } });

    if (existingProduct) {
      throw new ApiError(HTTP_STATUS.CONFLICT, "Product already exists with this barcode");
    }
  }

  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!product) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Product not found");
  }

  await syncStockAlert(product);

  res.status(HTTP_STATUS.OK).json({ data: product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  await findProductById(req.params.id);
  await Product.findByIdAndDelete(req.params.id);
  res.status(HTTP_STATUS.NO_CONTENT).send();
});

export const updateProductStockByBarcode = asyncHandler(async (req, res) => {
  const { barcode, count } = req.body;

  if (!barcode || count === undefined) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Barcode and count are required");
  }

  const product = await Product.findOne({ barcode: barcode.trim() });

  if (!product) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Product not found");
  }

  product.stock += count;
  await product.save();
  
  // Sync stock alert if necessary
  try {
    const { syncStockAlert } = await import("../services/stockAlert.service.js");
    await syncStockAlert(product);
  } catch (error) {
    console.error("Stock alert sync failed:", error);
  }

  res.status(HTTP_STATUS.OK).json({ data: product });
});
