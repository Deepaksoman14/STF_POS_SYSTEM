import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { listUsers, listBusinesses, updateUserAccess } from "./user.service.js";

const updateUserSchema = z.object({
  role: z.enum(["admin", "owner", "viewer"]).optional(),
  isActive: z.boolean().optional()
}).refine((value) => value.role !== undefined || value.isActive !== undefined, {
  message: "Provide role or isActive"
});

export const listUsersController = asyncHandler(async (_req, res) => {
  const data = await listUsers();
  res.json({ success: true, data });
});

export const listBusinessesController = asyncHandler(async (_req, res) => {
  const data = await listBusinesses();
  res.json({ success: true, data });
});

export const updateUserController = asyncHandler(async (req, res) => {
  const payload = updateUserSchema.parse(req.body);
  const data = await updateUserAccess(req.params.userId, payload, req.user);
  res.json({ success: true, data });
});
