import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createProduct,
  deleteProduct,
  listArchivedProducts,
  listProducts,
  restoreProduct,
  updateProduct
} from "./product.service.js";

const productSchema = z.object({
  sku: z.string().min(2),
  name: z.string().min(2),
  category: z.string().min(2),
  batchNo: z.string().min(2),
  composition: z.string().optional().default(""),
  costPrice: z.coerce.number().nonnegative().default(0),
  salePrice: z.coerce.number().positive(),
  stockQty: z.coerce.number().int().nonnegative(),
  reorderLevel: z.coerce.number().int().nonnegative()
});

const paramsSchema = z.object({
  productId: z.string().uuid()
});

export const listProductsController = asyncHandler(async (req, res) => {
  const data = await listProducts(req.user.businessId);
  res.json({ success: true, data });
});

export const listArchivedProductsController = asyncHandler(async (req, res) => {
  const data = await listArchivedProducts(req.user.businessId);
  res.json({ success: true, data });
});

export const createProductController = asyncHandler(async (req, res) => {
  const payload = productSchema.parse(req.body);
  const data = await createProduct(req.user.businessId, payload);
  res.status(201).json({ success: true, data });
});

export const updateProductController = asyncHandler(async (req, res) => {
  const { productId } = paramsSchema.parse(req.params);
  const payload = productSchema.parse(req.body);
  const data = await updateProduct(req.user.businessId, productId, payload);
  res.json({ success: true, data });
});

export const deleteProductController = asyncHandler(async (req, res) => {
  const { productId } = paramsSchema.parse(req.params);
  const data = await deleteProduct(req.user.businessId, productId);
  res.json({ success: true, data });
});

export const restoreProductController = asyncHandler(async (req, res) => {
  const { productId } = paramsSchema.parse(req.params);
  const data = await restoreProduct(req.user.businessId, productId);
  res.json({ success: true, data });
});
