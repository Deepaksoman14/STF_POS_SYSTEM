import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { createCustomer, listCustomers } from "./customer.service.js";

const createCustomerSchema = z.object({
  name: z.string().min(2),
  mobile: z.string().min(10).max(15),
  village: z.string().min(2),
  creditDue: z.coerce.number().nonnegative().default(0)
});

export const listCustomersController = asyncHandler(async (req, res) => {
  const data = await listCustomers(req.user.businessId);
  res.json({ success: true, data });
});

export const createCustomerController = asyncHandler(async (req, res) => {
  const payload = createCustomerSchema.parse(req.body);
  const data = await createCustomer(req.user.businessId, payload);
  res.status(201).json({ success: true, data });
});