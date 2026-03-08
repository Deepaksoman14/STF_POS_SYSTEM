import { asyncHandler } from "../../utils/asyncHandler.js";
import { getSummary } from "./dashboard.service.js";

export const summaryController = asyncHandler(async (req, res) => {
  const data = await getSummary(req.user.businessId);
  res.json({ success: true, data });
});