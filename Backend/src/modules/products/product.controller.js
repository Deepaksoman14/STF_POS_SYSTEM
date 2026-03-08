import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { createProduct, listProducts } from "./product.service.js";

const createProductSchema = z.object({
  sku: z.string().min(2),
  name: z.string().min(2),
  category: z.string().min(2),
  batchNo: z.string().min(2),
  composition: z.string().optional().default(""),
  mrp: z.coerce.number().positive(),
  salePrice: z.coerce.number().positive(),
  stockQty: z.coerce.number().int().nonnegative(),
  reorderLevel: z.coerce.number().int().nonnegative()
});

export const listProductsController = asyncHandler(async (req, res) => {
  const data = await listProducts(req.user.businessId);
  res.json({ success: true, data });
});

export const createProductController = asyncHandler(async (req, res) => {
  const payload = createProductSchema.parse(req.body);
  const data = await createProduct(req.user.businessId, payload);
  res.status(201).json({ success: true, data });
});