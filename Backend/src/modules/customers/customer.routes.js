import { Router } from "express";
import { authGuard, requireRoles } from "../../middleware/auth.js";
import { createCustomerController, listCustomersController } from "./customer.controller.js";

const router = Router();

router.use(authGuard);
router.get("/", listCustomersController);
router.post("/", requireRoles("admin", "owner"), createCustomerController);

export default router;
