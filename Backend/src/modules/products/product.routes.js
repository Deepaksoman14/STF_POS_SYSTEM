import { Router } from "express";
import { authGuard, requireRoles } from "../../middleware/auth.js";
import { createProductController, listProductsController } from "./product.controller.js";

const router = Router();

router.use(authGuard);
router.get("/", listProductsController);
router.post("/", requireRoles("admin", "owner"), createProductController);

export default router;
