import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { createCustomer, deleteCustomer, listCustomers, updateCustomer } from "./customer.service.js";

const customerSchema = z.object({
  name: z.string().min(2),
  mobile: z.string().min(10).max(15),
  village: z.string().min(2),
  creditDue: z.coerce.number().nonnegative().default(0)
});

const paramsSchema = z.object({
  customerId: z.string().uuid()
});

export const listCustomersController = asyncHandler(async (req, res) => {
  const data = await listCustomers(req.user.businessId);
  res.json({ success: true, data });
});

export const createCustomerController = asyncHandler(async (req, res) => {
  const payload = customerSchema.parse(req.body);
  const data = await createCustomer(req.user.businessId, payload);
  res.status(201).json({ success: true, data });
});

export const updateCustomerController = asyncHandler(async (req, res) => {
  const { customerId } = paramsSchema.parse(req.params);
  const payload = customerSchema.parse(req.body);
  const data = await updateCustomer(req.user.businessId, customerId, payload);
  res.json({ success: true, data });
});

export const deleteCustomerController = asyncHandler(async (req, res) => {
  const { customerId } = paramsSchema.parse(req.params);
  const data = await deleteCustomer(req.user.businessId, customerId);
  res.json({ success: true, data });
});
