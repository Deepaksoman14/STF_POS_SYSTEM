import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { createSale, listSales } from "./sales.service.js";

const optionalString = z.string().trim().optional().default("");

const customerInlineSchema = z.object({
  name: z.string().trim().min(2).optional(),
  address: optionalString,
  mobile: optionalString,
  email: optionalString
});

const createSaleSchema = z.object({
  customerId: z.string().uuid().nullable().optional(),
  customer: customerInlineSchema.optional(),
  paymentMode: z.enum(["cash", "upi", "card", "credit"]),
  discount: z.coerce.number().nonnegative().default(0),
  notes: z.string().optional().default(""),
  createdBy: z.string().min(2),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      qty: z.coerce.number().int().positive()
    })
  ).min(1)
});

export const listSalesController = asyncHandler(async (req, res) => {
  const data = await listSales(req.user.businessId);
  res.json({ success: true, data });
});

export const createSaleController = asyncHandler(async (req, res) => {
  const payload = createSaleSchema.parse(req.body);
  const data = await createSale(req.user.businessId, payload);
  res.status(201).json({ success: true, data });
});
