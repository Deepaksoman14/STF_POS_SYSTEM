import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import productRoutes from "../modules/products/product.routes.js";
import customerRoutes from "../modules/customers/customer.routes.js";
import salesRoutes from "../modules/sales/sales.routes.js";
import dashboardRoutes from "../modules/dashboard/dashboard.routes.js";
import userRoutes from "../modules/users/user.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/customers", customerRoutes);
router.use("/sales", salesRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/users", userRoutes);

export default router;
